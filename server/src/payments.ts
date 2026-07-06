import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthRequest } from "./auth";
import { prisma } from "./db";
import { settleDailyCharges } from "./social";

export const paymentsRouter = Router();
export const walletRouter = Router();

const asyncRoute = (handler: (request: any, response: Response) => Promise<unknown>) => (request: any, response: Response, next: any) => Promise.resolve(handler(request, response)).catch(next);
const manualUpiId = "7065223868-2@ibl";
const pendingStatus = "pending_verification";

paymentsRouter.use(authenticate);
walletRouter.use(authenticate);

walletRouter.get("/", asyncRoute(async (request: AuthRequest, response) => {
  await settleDailyCharges(request.user!.id);
  const [wallet, transactions, verification, pendingPayments] = await Promise.all([
    prisma.wallet.upsert({ where: { userId: request.user!.id }, update: {}, create: { userId: request.user!.id } }),
    prisma.walletTransaction.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    verificationStatusForUser(request.user!.id),
    prisma.payment.findMany({
      where: { userId: request.user!.id, paymentStatus: pendingStatus, purpose: { in: ["WALLET_RECHARGE", "YEARLY_VERIFICATION", "premium"] } },
      select: { id: true, purpose: true, amount: true, transactionId: true, createdAt: true, lineItems: true },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);
  response.set("Cache-Control", "no-store").json({ wallet, balancePaise: wallet.balancePaise, transactions, verification, pendingPayments, verificationFeePaise: 30000, minimumRechargePaise: 1000, dailyConnectionFeePaise: 500 });
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

paymentsRouter.post("/manual", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({
    purpose: z.enum(["WALLET_RECHARGE", "YEARLY_VERIFICATION", "premium"]),
    transactionId: z.string().trim().min(6).max(80),
    amount: z.coerce.number().optional(),
    plan: z.enum(["monthly", "quarterly", "annual"]).optional()
  }).parse(request.body);

  let amount = 0;
  let lineItems: { plan?: string } | undefined;
  if (input.purpose === "WALLET_RECHARGE") {
    amount = Math.round(Number(input.amount));
    if (!Number.isInteger(amount) || amount < 10 || amount > 10000) return response.status(400).json({ error: "Wallet recharge must be between Rs. 10 and Rs. 10,000." });
  } else if (input.purpose === "YEARLY_VERIFICATION") {
    amount = 300;
  } else {
    if (!input.plan) return response.status(400).json({ error: "Choose a Premium plan." });
    amount = input.plan === "monthly" ? 199 : input.plan === "quarterly" ? 499 : 1499;
    lineItems = { plan: input.plan };
  }

  const payment = await prisma.payment.create({
    data: {
      userId: request.user!.id,
      purpose: input.purpose,
      targetType: input.purpose === "premium" ? "premium_plan" : input.purpose === "WALLET_RECHARGE" ? "wallet" : "verification",
      targetId: input.plan,
      amount,
      amountPaise: amount * 100,
      currency: "INR",
      provider: "UPI_MANUAL",
      originalPrice: amount,
      platformFee: 0,
      status: pendingStatus,
      paymentMethod: "upi_manual",
      upiId: manualUpiId,
      transactionId: input.transactionId,
      paymentStatus: pendingStatus,
      lineItems
    }
  });
  response.status(201).json({ paymentId: payment.id, status: payment.paymentStatus, amount: payment.amount, upiId: manualUpiId });
}));

paymentsRouter.post("/wallet/create-order", disabledRazorpay);
paymentsRouter.post("/wallet/verify", disabledRazorpay);
paymentsRouter.post("/verification/create-order", disabledRazorpay);
paymentsRouter.post("/verification/verify", disabledRazorpay);

paymentsRouter.get("/verification/status", asyncRoute(async (request: AuthRequest, response) => {
  response.set("Cache-Control", "no-store").json(await verificationStatusForUser(request.user!.id));
}));

function disabledRazorpay(_request: Request, response: Response) {
  response.status(410).json({ error: "Razorpay is disabled. Pay with PhonePe / UPI and submit the transaction ID." });
}

async function verificationStatusForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { verificationPaymentStatus: true, verificationPaidUntil: true, socialVerification: { select: { status: true } } } });
  const now = new Date();
  const paid = Boolean(user?.verificationPaymentStatus === "paid" && user.verificationPaidUntil && user.verificationPaidUntil > now);
  return { paid, validUntil: user?.verificationPaidUntil || null, verificationStatus: user?.socialVerification?.status || "not_submitted" };
}
