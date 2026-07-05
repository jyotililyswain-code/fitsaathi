import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { authenticate, type AuthRequest } from "./auth";
import { prisma } from "./db";
import { fetchCapturedPayment, createRazorpayOrder, razorpaySettings, requireRazorpayClient, verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from "./razorpay-service";
import { settleDailyCharges } from "./social";

export const paymentsRouter = Router();
export const walletRouter = Router();

const asyncRoute = (handler: (request: any, response: Response) => Promise<unknown>) => (request: any, response: Response, next: any) => Promise.resolve(handler(request, response)).catch(next);
const walletRechargePurpose = "WALLET_RECHARGE";
const verificationPurpose = "YEARLY_VERIFICATION";

paymentsRouter.use(authenticate);
walletRouter.use(authenticate);

walletRouter.get("/", asyncRoute(async (request: AuthRequest, response) => {
  await settleDailyCharges(request.user!.id);
  const wallet = await prisma.wallet.upsert({ where: { userId: request.user!.id }, update: {}, create: { userId: request.user!.id } });
  const transactions = await prisma.walletTransaction.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: "desc" }, take: 20 });
  const verification = await verificationStatusForUser(request.user!.id, false);
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

paymentsRouter.post("/wallet/create-order", asyncRoute(async (request: AuthRequest, response) => {
  const amount = z.object({ amount: z.coerce.number() }).parse(request.body).amount;
  if (!Number.isInteger(amount) || amount < 10 || amount > 10000) return response.status(400).json({ error: "Invalid amount. Wallet recharge must be between Rs. 10 and Rs. 10,000." });
  requireRazorpayClient();
  const amountPaise = amount * 100;
  const payment = await prisma.payment.create({ data: { userId: request.user!.id, purpose: walletRechargePurpose, amount, amountPaise, currency: razorpaySettings().currency, provider: "RAZORPAY", platformFee: 0, status: "created" } });
  try {
    const { order, currency, keyId } = await createRazorpayOrder({ amountPaise, receipt: `wallet_${payment.id}`, notes: { userId: request.user!.id, purpose: walletRechargePurpose, paymentId: payment.id } });
    const wallet = await prisma.wallet.upsert({ where: { userId: request.user!.id }, update: {}, create: { userId: request.user!.id } });
    const transaction = await prisma.$transaction(async tx => {
      await tx.payment.update({ where: { id: payment.id }, data: { razorpayOrderId: order.id, providerOrderId: order.id, currency } });
      return tx.walletTransaction.create({
        data: {
          userId: request.user!.id,
          type: "recharge",
          purpose: walletRechargePurpose,
          amountPaise,
          balanceAfterPaise: wallet.balancePaise,
          status: "pending",
          razorpayOrderId: order.id,
          reference: `wallet:${order.id}`,
          description: "Wallet recharge pending",
          metadata: { paymentId: payment.id, amountRupees: amount }
        }
      });
    });
    response.status(201).json({ razorpayKeyId: keyId, orderId: order.id, amount: Number(order.amount), currency, transactionId: transaction.id });
  } catch (error) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", failureReason: error instanceof Error ? error.message : "order_creation_failed" } }).catch(() => undefined);
    throw error;
  }
}));

paymentsRouter.post("/wallet/verify", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ razorpay_order_id: z.string().min(5), razorpay_payment_id: z.string().min(5), razorpay_signature: z.string().min(20), transactionId: z.string().uuid() }).parse(request.body);
  const transaction = await prisma.walletTransaction.findUnique({ where: { id: input.transactionId } });
  if (!transaction || transaction.userId !== request.user!.id || transaction.razorpayOrderId !== input.razorpay_order_id || transaction.purpose !== walletRechargePurpose) return response.status(404).json({ error: "Wallet transaction not found." });
  if (transaction.status === "success") return response.json({ success: true, idempotent: true, balancePaise: transaction.balanceAfterPaise });
  if (!verifyRazorpayPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
    await markPaymentFailed(input.razorpay_order_id, input.transactionId, "Payment verification failed");
    return response.status(400).json({ error: "Payment verification failed." });
  }
  await fetchCapturedPayment(input.razorpay_payment_id, input.razorpay_order_id, transaction.amountPaise);
  const result = await completeWalletRecharge({ transactionId: input.transactionId, orderId: input.razorpay_order_id, paymentId: input.razorpay_payment_id, signature: input.razorpay_signature });
  response.json({ success: true, balancePaise: result.balancePaise, transaction: result.transaction });
}));

paymentsRouter.post("/verification/create-order", asyncRoute(async (request: AuthRequest, response) => {
  requireRazorpayClient();
  const amountPaise = 30000;
  const payment = await prisma.payment.create({ data: { userId: request.user!.id, purpose: verificationPurpose, amount: 300, amountPaise, currency: razorpaySettings().currency, provider: "RAZORPAY", platformFee: 0, status: "created" } });
  try {
    const { order, currency, keyId } = await createRazorpayOrder({ amountPaise, receipt: `verify_${payment.id}`, notes: { userId: request.user!.id, purpose: verificationPurpose, paymentId: payment.id } });
    const wallet = await prisma.wallet.upsert({ where: { userId: request.user!.id }, update: {}, create: { userId: request.user!.id } });
    const transaction = await prisma.$transaction(async tx => {
      await tx.payment.update({ where: { id: payment.id }, data: { razorpayOrderId: order.id, providerOrderId: order.id, currency } });
      return tx.walletTransaction.create({
        data: {
          userId: request.user!.id,
          type: "verification_fee",
          purpose: "VERIFICATION_PAYMENT",
          amountPaise: -amountPaise,
          balanceAfterPaise: wallet.balancePaise,
          status: "pending",
          razorpayOrderId: order.id,
          reference: `verification:${order.id}`,
          description: "Yearly verification payment pending",
          metadata: { paymentId: payment.id, amountRupees: 300 }
        }
      });
    });
    response.status(201).json({ razorpayKeyId: keyId, orderId: order.id, amount: Number(order.amount), currency, transactionId: transaction.id });
  } catch (error) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", failureReason: error instanceof Error ? error.message : "order_creation_failed" } }).catch(() => undefined);
    throw error;
  }
}));

paymentsRouter.post("/verification/verify", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ razorpay_order_id: z.string().min(5), razorpay_payment_id: z.string().min(5), razorpay_signature: z.string().min(20), transactionId: z.string().uuid() }).parse(request.body);
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: input.razorpay_order_id } });
  if (!payment || payment.userId !== request.user!.id || payment.purpose !== verificationPurpose) return response.status(404).json({ error: "Verification payment order not found." });
  if (payment.status === "paid") return response.json(await verificationStatusForUser(request.user!.id, true));
  if (!verifyRazorpayPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
    await markPaymentFailed(input.razorpay_order_id, input.transactionId, "Payment verification failed");
    return response.status(400).json({ error: "Payment verification failed." });
  }
  await fetchCapturedPayment(input.razorpay_payment_id, input.razorpay_order_id, payment.amountPaise || 30000);
  await completeVerificationPayment({ userId: request.user!.id, transactionId: input.transactionId, orderId: input.razorpay_order_id, paymentId: input.razorpay_payment_id, signature: input.razorpay_signature });
  response.json(await verificationStatusForUser(request.user!.id, false));
}));

paymentsRouter.get("/verification/status", asyncRoute(async (request: AuthRequest, response) => {
  response.set("Cache-Control", "no-store").json(await verificationStatusForUser(request.user!.id, false));
}));

export async function razorpayWebhookHandler(request: Request, response: Response) {
  const payload = Buffer.isBuffer(request.body) ? request.body : Buffer.from(String(request.body || ""));
  try {
    if (!verifyRazorpayWebhookSignature(payload, String(request.headers["x-razorpay-signature"] || ""))) return response.status(400).json({ error: "Invalid webhook signature." });
    const event = JSON.parse(payload.toString("utf8"));
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const orderId = String(paymentEntity?.order_id || orderEntity?.id || "");
    const eventId = String(event.id || `${event.event}:${orderId}:${paymentEntity?.id || ""}:${event.created_at || ""}`);
    try {
      await prisma.razorpayWebhookEvent.create({ data: { eventId, event: String(event.event || "unknown"), payload: event as Prisma.InputJsonValue } });
    } catch (error: any) {
      if (error?.code === "P2002") return response.json({ received: true, idempotent: true });
      throw error;
    }
    if (!orderId) return response.json({ received: true });
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
    if (!payment) return response.json({ received: true });
    const paymentId = String(paymentEntity?.id || payment.razorpayPaymentId || "");
    if (["payment.captured", "order.paid"].includes(String(event.event))) {
      if (payment.purpose === walletRechargePurpose) await completeWalletRecharge({ orderId, paymentId, signature: "", fromWebhook: true });
      else if (payment.purpose === verificationPurpose && payment.userId) await completeVerificationPayment({ userId: payment.userId, orderId, paymentId, signature: "", fromWebhook: true });
      else await prisma.payment.update({ where: { id: payment.id }, data: { status: "paid", razorpayPaymentId: paymentId || payment.razorpayPaymentId, providerPaymentId: paymentId || payment.providerPaymentId, webhookEvent: String(event.event), paidAt: payment.paidAt || new Date() } });
    } else if (String(event.event) === "payment.failed") {
      await markPaymentFailed(orderId, undefined, paymentEntity?.error_description || "payment_failed");
    }
    await prisma.razorpayWebhookEvent.update({ where: { eventId }, data: { paymentId: payment.id } });
    response.json({ received: true });
  } catch (error) {
    console.error("razorpay.webhook_error", error);
    response.status(Number((error as any)?.status) || 500).json({ error: error instanceof Error ? error.message : "Webhook processing failed." });
  }
}

async function completeWalletRecharge(input: { transactionId?: string; orderId: string; paymentId: string; signature: string; fromWebhook?: boolean }) {
  return prisma.$transaction(async tx => {
    const transaction = input.transactionId
      ? await tx.walletTransaction.findUnique({ where: { id: input.transactionId } })
      : await tx.walletTransaction.findFirst({ where: { razorpayOrderId: input.orderId, purpose: walletRechargePurpose } });
    const payment = await tx.payment.findUnique({ where: { razorpayOrderId: input.orderId } });
    if (!transaction || !payment || !payment.userId) throw Object.assign(new Error("Wallet transaction not found."), { status: 404 });
    if (transaction.amountPaise <= 0) throw Object.assign(new Error("Wallet recharge amount is invalid."), { status: 400 });
    if (transaction.status === "success") {
      let updatedTransaction = transaction;
      if (input.paymentId && !transaction.razorpayPaymentId) {
        updatedTransaction = await tx.walletTransaction.update({ where: { id: transaction.id }, data: { razorpayPaymentId: input.paymentId, razorpaySignature: input.signature || transaction.razorpaySignature } });
      }
      if (input.paymentId && !payment.providerPaymentId) {
        await tx.payment.update({ where: { id: payment.id }, data: { razorpayPaymentId: input.paymentId, providerPaymentId: input.paymentId, razorpaySignature: input.signature || payment.razorpaySignature } });
      }
      return { balancePaise: updatedTransaction.balanceAfterPaise, transaction: updatedTransaction };
    }
    const claimed = await tx.walletTransaction.updateMany({ where: { id: transaction.id, status: "pending" }, data: { status: "processing" } });
    if (claimed.count !== 1) {
      const current = await tx.walletTransaction.findUnique({ where: { id: transaction.id } });
      if (current?.status === "success") return { balancePaise: current.balanceAfterPaise, transaction: current };
      throw Object.assign(new Error("Wallet recharge is already being processed."), { status: 409 });
    }
    const wallet = await tx.wallet.upsert({ where: { userId: payment.userId }, update: { balancePaise: { increment: transaction.amountPaise } }, create: { userId: payment.userId, balancePaise: transaction.amountPaise } });
    const updated = await tx.walletTransaction.update({ where: { id: transaction.id }, data: { status: "success", balanceAfterPaise: wallet.balancePaise, razorpayPaymentId: input.paymentId || transaction.razorpayPaymentId, razorpaySignature: input.signature || transaction.razorpaySignature, creditedAt: new Date(), description: "Wallet recharge successful" } });
    await tx.payment.update({ where: { id: payment.id }, data: { status: "paid", razorpayPaymentId: input.paymentId || payment.razorpayPaymentId, razorpaySignature: input.signature || payment.razorpaySignature, providerPaymentId: input.paymentId || payment.providerPaymentId, paidAt: payment.paidAt || new Date(), webhookEvent: input.fromWebhook ? "payment.captured" : payment.webhookEvent } });
    return { balancePaise: wallet.balancePaise, transaction: updated };
  });
}

async function completeVerificationPayment(input: { userId: string; transactionId?: string; orderId: string; paymentId: string; signature: string; fromWebhook?: boolean }) {
  return prisma.$transaction(async tx => {
    const payment = await tx.payment.findUnique({ where: { razorpayOrderId: input.orderId } });
    if (!payment || payment.userId !== input.userId) throw Object.assign(new Error("Verification payment order not found."), { status: 404 });
    const transaction = input.transactionId
      ? await tx.walletTransaction.findUnique({ where: { id: input.transactionId } })
      : await tx.walletTransaction.findFirst({ where: { razorpayOrderId: input.orderId, purpose: "VERIFICATION_PAYMENT" } });
    if (payment.status === "paid") {
      if (input.paymentId && !payment.providerPaymentId) await tx.payment.update({ where: { id: payment.id }, data: { razorpayPaymentId: input.paymentId, providerPaymentId: input.paymentId, razorpaySignature: input.signature || payment.razorpaySignature } });
      if (transaction && input.paymentId && !transaction.razorpayPaymentId) await tx.walletTransaction.update({ where: { id: transaction.id }, data: { razorpayPaymentId: input.paymentId, razorpaySignature: input.signature || transaction.razorpaySignature } });
      const user = await tx.user.findUnique({ where: { id: input.userId }, select: { verificationPaidUntil: true } });
      return { validUntil: user?.verificationPaidUntil || null };
    }
    const claimed = await tx.payment.updateMany({ where: { id: payment.id, status: "created" }, data: { status: "processing" } });
    if (claimed.count !== 1) {
      const current = await tx.payment.findUnique({ where: { id: payment.id } });
      if (current?.status === "paid") {
        const user = await tx.user.findUnique({ where: { id: input.userId }, select: { verificationPaidUntil: true } });
        return { validUntil: user?.verificationPaidUntil || null };
      }
      throw Object.assign(new Error("Verification payment is already being processed."), { status: 409 });
    }
    const startsAt = payment.paidAt || new Date();
    const validUntil = new Date(startsAt.getTime() + 365 * 86400_000);
    if (transaction && transaction.status !== "success") await tx.walletTransaction.update({ where: { id: transaction.id }, data: { status: "success", razorpayPaymentId: input.paymentId || transaction.razorpayPaymentId, razorpaySignature: input.signature || transaction.razorpaySignature, creditedAt: startsAt, description: "Yearly verification payment successful" } });
    await tx.payment.update({ where: { id: payment.id }, data: { status: "paid", razorpayPaymentId: input.paymentId || payment.razorpayPaymentId, razorpaySignature: input.signature || payment.razorpaySignature, providerPaymentId: input.paymentId || payment.providerPaymentId, paidAt: startsAt, webhookEvent: input.fromWebhook ? "payment.captured" : payment.webhookEvent } });
    await tx.user.update({ where: { id: input.userId }, data: { verificationPaymentStatus: "paid", verificationPaidUntil: validUntil } });
    await tx.socialVerification.updateMany({ where: { userId: input.userId }, data: { paymentStatus: "paid", paymentId: payment.id, paidAt: startsAt, expiresAt: validUntil } });
    return { validUntil };
  });
}

async function markPaymentFailed(orderId: string, transactionId: string | undefined, reason: string) {
  await prisma.$transaction(async tx => {
    await tx.payment.updateMany({ where: { razorpayOrderId: orderId, status: { not: "paid" } }, data: { status: "failed", failureReason: reason } });
    if (transactionId) await tx.walletTransaction.updateMany({ where: { id: transactionId, status: { not: "success" } }, data: { status: "failed", description: reason } });
    else await tx.walletTransaction.updateMany({ where: { razorpayOrderId: orderId, status: { not: "success" } }, data: { status: "failed", description: reason } });
  });
}

async function verificationStatusForUser(userId: string, idempotent: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { verificationPaymentStatus: true, verificationPaidUntil: true, socialVerification: { select: { status: true } } } });
  const now = new Date();
  const paid = Boolean(user?.verificationPaymentStatus === "paid" && user.verificationPaidUntil && user.verificationPaidUntil > now);
  return { paid, validUntil: user?.verificationPaidUntil || null, verificationStatus: user?.socialVerification?.status || "not_submitted", idempotent };
}
