import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthRequest } from "./auth";
import { prisma } from "./db";
import { settleDailyCharges } from "./social";
import { discardIncomingUploads, optimizeUploads, upload } from "./uploads";

export const paymentsRouter = Router();
export const walletRouter = Router();

const asyncRoute = (handler: (request: any, response: Response) => Promise<unknown>) => (request: any, response: Response, next: any) => Promise.resolve(handler(request, response)).catch(next);
const manualUpiId = "7065223868-2@ibl";

paymentsRouter.use(authenticate);
walletRouter.use(authenticate);

walletRouter.get("/", asyncRoute(async (request: AuthRequest, response) => {
  await settleDailyCharges(request.user!.id);
  const [wallet, transactions, verification] = await Promise.all([
    prisma.wallet.upsert({ where: { userId: request.user!.id }, update: {}, create: { userId: request.user!.id } }),
    prisma.walletTransaction.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    verificationStatusForUser(request.user!.id)
  ]);
  response.set("Cache-Control", "no-store").json({ wallet, balancePaise: wallet.balancePaise, transactions, verification, verificationFeePaise: 30000, minimumRechargePaise: 1000, dailyConnectionFeePaise: 500 });
}));

walletRouter.get("/transactions", asyncRoute(async (request: AuthRequest, response) => {
  const query = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) }).parse(request.query);
  const where = { userId: request.user!.id };
  const [transactions, total] = await prisma.$transaction([
    prisma.walletTransaction.findMany({ where, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.walletTransaction.count({ where })
  ]);
  response.set("Cache-Control", "no-store").json({ transactions, total, page: query.page, limit: query.limit });
}));

paymentsRouter.post("/manual", upload.single("paymentScreenshot"), asyncRoute(async (request: AuthRequest, response) => {
  const incomingFiles = request.file ? [request.file] : [];
  const parsed = z.object({
    purpose: z.enum(["WALLET_RECHARGE", "YEARLY_VERIFICATION", "premium"]),
    transactionId: z.string().trim().min(6).max(80),
    amount: z.coerce.number().optional(),
    plan: z.enum(["monthly", "quarterly", "annual"]).optional()
  }).safeParse(request.body);
  if (!parsed.success) {
    discardIncomingUploads(incomingFiles);
    return response.status(400).json({ error: "Enter a valid UPI transaction ID and payment details." });
  }
  const input = parsed.data;

  let amount = 0;
  let lineItems: { plan?: string } | undefined;
  if (input.purpose === "WALLET_RECHARGE") {
    amount = Math.round(Number(input.amount));
    if (!Number.isInteger(amount) || amount < 10 || amount > 10000) {
      discardIncomingUploads(incomingFiles);
      return response.status(400).json({ error: "Wallet recharge must be between Rs. 10 and Rs. 10,000." });
    }
  } else if (input.purpose === "YEARLY_VERIFICATION") {
    amount = 300;
  } else {
    if (!input.plan) {
      discardIncomingUploads(incomingFiles);
      return response.status(400).json({ error: "Choose a Premium plan." });
    }
    amount = input.plan === "monthly" ? 199 : input.plan === "quarterly" ? 499 : 1499;
    lineItems = { plan: input.plan };
  }

  const screenshot = incomingFiles.length ? await optimizeUploads(incomingFiles, "payments") : [];
  const now = new Date();
  const result = await prisma.$transaction(async tx => {
    const payment = await tx.payment.create({
      data: {
        userId: request.user!.id,
        purpose: input.purpose,
        targetType: input.purpose === "premium" ? "premium_plan" : input.purpose === "WALLET_RECHARGE" ? "wallet" : "verification",
        targetId: input.plan,
        amount,
        amountPaise: amount * 100,
        amountPaid: amount,
        currency: "INR",
        provider: "UPI_MANUAL",
        originalPrice: amount,
        platformFee: 0,
        status: "paid",
        paymentMethod: "upi_manual",
        upiId: manualUpiId,
        transactionId: input.transactionId,
        paymentStatus: "paid",
        paymentScreenshotPath: screenshot[0]?.path,
        paidAt: now,
        lineItems
      }
    });

    if (input.purpose === "WALLET_RECHARGE") {
      const amountPaise = amount * 100;
      const wallet = await tx.wallet.upsert({ where: { userId: request.user!.id }, update: { balancePaise: { increment: amountPaise } }, create: { userId: request.user!.id, balancePaise: amountPaise } });
      await tx.walletTransaction.create({ data: { userId: request.user!.id, type: "recharge", purpose: "WALLET_RECHARGE", amountPaise, balanceAfterPaise: wallet.balancePaise, status: "success", reference: `manual_payment:${payment.id}`, creditedAt: now, description: "Manual UPI wallet recharge" } });
    }

    if (input.purpose === "YEARLY_VERIFICATION") {
      const validUntil = new Date(now.getTime() + 365 * 86400_000);
      await tx.user.update({ where: { id: request.user!.id }, data: { verificationPaymentStatus: "paid", verificationPaidUntil: validUntil } });
      await tx.socialVerification.updateMany({ where: { userId: request.user!.id }, data: { paymentStatus: "paid", paymentId: payment.id, paidAt: now, expiresAt: validUntil } });
      const wallet = await tx.wallet.upsert({ where: { userId: request.user!.id }, update: {}, create: { userId: request.user!.id } });
      await tx.walletTransaction.create({ data: { userId: request.user!.id, type: "verification_fee", purpose: "VERIFICATION_PAYMENT", amountPaise: -(amount * 100), balanceAfterPaise: wallet.balancePaise, status: "success", reference: `manual_verification:${payment.id}`, creditedAt: now, description: "Manual UPI yearly verification payment" } });
    }

    if (input.purpose === "premium" && input.plan) {
      const days = input.plan === "monthly" ? 30 : input.plan === "quarterly" ? 90 : 365;
      const endsAt = new Date(now.getTime() + days * 86400_000);
      await tx.premiumSubscription.updateMany({ where: { userId: request.user!.id, active: true }, data: { active: false } });
      await tx.premiumSubscription.create({ data: { userId: request.user!.id, plan: input.plan, startsAt: now, endsAt, amountPaise: amount * 100, paymentId: payment.id } });
      await tx.user.update({ where: { id: request.user!.id }, data: { premiumUntil: endsAt } });
    }

    return payment;
  });
  response.status(201).json({ paymentId: result.id, status: result.paymentStatus, amount: result.amount, upiId: manualUpiId, message: "Payment submitted successfully." });
}));

paymentsRouter.post("/wallet/create-order", disabledLegacyPayment);
paymentsRouter.post("/wallet/verify", disabledLegacyPayment);
paymentsRouter.post("/verification/create-order", disabledLegacyPayment);
paymentsRouter.post("/verification/verify", disabledLegacyPayment);

paymentsRouter.get("/verification/status", asyncRoute(async (request: AuthRequest, response) => {
  response.set("Cache-Control", "no-store").json(await verificationStatusForUser(request.user!.id));
}));

function disabledLegacyPayment(_request: Request, response: Response) {
  response.status(410).json({ error: "This legacy payment endpoint is disabled. Use the PhonePe / UPI payment form." });
}

async function verificationStatusForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { verificationPaymentStatus: true, verificationPaidUntil: true, socialVerification: { select: { status: true } } } });
  const now = new Date();
  const paid = Boolean(user?.verificationPaymentStatus === "paid" && user.verificationPaidUntil && user.verificationPaidUntil > now);
  return { paid, validUntil: user?.verificationPaidUntil || null, verificationStatus: user?.socialVerification?.status || "not_submitted" };
}
