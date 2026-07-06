import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { canDelete, canManageFinance, canManageOrders, canManageUsers, canModerateMarketplace, isAdminRole, type AdminRole } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { getClientIp, isRateLimited, sanitizeText } from "@/lib/security";

type ActionBody = { action?: unknown; targetId?: unknown; value?: unknown; reason?: unknown; settings?: unknown };

export async function POST(request: Request) {
  if (await isRateLimited(`admin-action:${getClientIp(request)}`, 60, 60_000)) return NextResponse.json({ error: "Too many admin actions." }, { status: 429 });
  try {
    const actor = await requireApiUser(request);
    if (!isAdminRole(actor.role)) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    const role = actor.role as AdminRole;
    const body = (await request.json()) as ActionBody;
    const action = sanitizeText(body.action, 60);
    const targetId = sanitizeText(body.targetId, 120);
    const value = sanitizeText(body.value, 60);
    const reason = sanitizeText(body.reason, 500);
    if (!action || !targetId) return NextResponse.json({ error: "Action and target are required." }, { status: 400 });
    let details: Record<string, unknown> = { targetId, value, reason };

    if (action === "seller_status") {
      if (!canModerateMarketplace(role) || !["verified", "trusted", "rejected", "suspended"].includes(value)) return NextResponse.json({ error: "Marketplace moderation permission required." }, { status: 403 });
      await prisma.seller.update({ where: { id: targetId }, data: { status: value as any, verified: ["verified", "trusted"].includes(value), trusted: value === "trusted" } });
    } else if (action === "product_status") {
      if (!canModerateMarketplace(role) || !["approved", "rejected", "featured", "trending"].includes(value)) return NextResponse.json({ error: "Marketplace moderation permission required." }, { status: 403 });
      await prisma.product.update({ where: { id: targetId }, data: { status: ["featured", "trending"].includes(value) ? "approved" : value as any, featured: value === "featured", trending: value === "trending" } });
    } else if (action === "order_status") {
      if (!canManageOrders(role) || !["pending", "confirmed", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].includes(value)) return NextResponse.json({ error: "Order management permission required." }, { status: 403 });
      if (value === "refunded" && !canManageFinance(role)) return NextResponse.json({ error: "Finance permission required." }, { status: 403 });
      await prisma.order.update({ where: { id: targetId }, data: { status: value as any } });
    } else if (action === "verify_payment") {
      if (!canManageFinance(role)) return NextResponse.json({ error: "Finance permission required." }, { status: 403 });
      await verifyManualPayment(targetId, actor.id);
    } else if (action === "reject_payment") {
      if (!canManageFinance(role)) return NextResponse.json({ error: "Finance permission required." }, { status: 403 });
      await rejectManualPayment(targetId, actor.id, reason || "Payment could not be verified.");
    } else if (action === "user_status") {
      if (!canManageUsers(role) || !["active", "banned"].includes(value) || targetId === actor.id) return NextResponse.json({ error: "User management permission required." }, { status: 403 });
      await prisma.user.update({ where: { id: targetId }, data: { accountStatus: value } });
      if (value === "banned") await prisma.refreshToken.deleteMany({ where: { userId: targetId } });
    } else if (action === "report_status") {
      await prisma.report.update({ where: { id: targetId }, data: { status: value || "resolved", resolvedById: actor.id, resolution: reason } });
    } else if (action === "delete_product") {
      if (!canDelete(role)) return NextResponse.json({ error: "Delete permission required." }, { status: 403 });
      await prisma.product.delete({ where: { id: targetId } });
    } else if (action === "delete_seller") {
      if (!canDelete(role)) return NextResponse.json({ error: "Delete permission required." }, { status: 403 });
      await prisma.seller.delete({ where: { id: targetId } });
    } else if (action === "delete_user") {
      if (!canDelete(role) || targetId === actor.id) return NextResponse.json({ error: "Delete permission required." }, { status: 403 });
      await prisma.user.delete({ where: { id: targetId } });
    } else if (action === "platform_settings") {
      if (!canManageFinance(role)) return NextResponse.json({ error: "Platform settings permission required." }, { status: 403 });
      const submitted = body.settings && typeof body.settings === "object" ? body.settings as Record<string, unknown> : {};
      const settings = { commissionPercent: Math.min(50, Math.max(0, Number(submitted.commissionPercent) || 0)), highValueOrderThreshold: Math.min(10_000_000, Math.max(0, Number(submitted.highValueOrderThreshold) || 0)), maintenanceMode: submitted.maintenanceMode === true, manualSellerVerification: submitted.manualSellerVerification !== false, updatedById: actor.id };
      await prisma.platformSettings.upsert({ where: { id: targetId }, update: settings, create: { id: targetId, ...settings } });
      details = { targetId, settings };
    } else if (action === "notification_read") {
      await prisma.notification.updateMany({ where: { id: targetId }, data: { read: true } });
    } else return NextResponse.json({ error: "Unsupported admin action." }, { status: 400 });

    await prisma.adminLog.create({ data: { actorId: actor.id, action, targetId, details: details as Prisma.InputJsonValue, ip: getClientIp(request) } });
    return NextResponse.json({ ok: true, action, targetId });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (Number((error as { status?: number })?.status)) return NextResponse.json({ error: error instanceof Error ? error.message : "Admin action failed." }, { status: Number((error as { status?: number }).status) });
    console.error("admin.action_failed", error);
    return NextResponse.json({ error: "Admin action failed." }, { status: 500 });
  }
}

async function verifyManualPayment(paymentId: string, actorId: string) {
  await prisma.$transaction(async tx => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: { include: { items: true } }, booking: true, user: true } });
    if (!payment) throw Object.assign(new Error("Payment not found."), { status: 404 });
    if (payment.paymentStatus === "paid" && payment.status === "paid") return;
    const now = new Date();
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "paid", paymentStatus: "paid", paidAt: payment.paidAt || now, verifiedAt: now, verifiedBy: actorId, rejectionReason: null, failureReason: null }
    });

    if (payment.bookingId) {
      await tx.booking.update({ where: { id: payment.bookingId }, data: { paymentStatus: "paid", status: "confirmed" as any, contactVisible: true } });
      await tx.notification.createMany({
        data: [
          { userId: payment.userId || payment.booking!.userId, bookingId: payment.bookingId, type: "payment_verified", title: "Booking confirmed", message: "Your UPI payment was verified. Your booking is now confirmed." },
          { userId: payment.booking!.providerOwnerId, bookingId: payment.bookingId, type: "booking_confirmed", title: "Booking payment verified", message: `${payment.booking!.customerName} has a confirmed booking after UPI verification.` }
        ]
      });
    }

    if (payment.orderId && payment.order) {
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "paid", status: "confirmed" as any } });
      const sellerIds = Array.from(new Set(payment.order.items.map(item => item.sellerId)));
      const sellers = sellerIds.length ? await tx.seller.findMany({ where: { id: { in: sellerIds } }, select: { ownerId: true } }) : [];
      await tx.notification.createMany({
        data: [
          { userId: payment.order.userId, orderId: payment.orderId, type: "payment_verified", title: "Order confirmed", message: `Your order #${payment.orderId.slice(0, 8)} is confirmed after UPI verification.` },
          ...sellers.map(seller => ({ userId: seller.ownerId, orderId: payment.orderId!, type: "marketplace_order", title: "New confirmed product order", message: `Order #${payment.orderId!.slice(0, 8)} is ready to process.` }))
        ]
      });
    }

    if (payment.purpose === "dojo_registration" && payment.targetId) {
      await tx.dojo.updateMany({ where: { id: payment.targetId }, data: { registrationPaymentStatus: "paid" } });
    }

    if (payment.purpose === "WALLET_RECHARGE" && payment.userId) {
      const reference = `manual_payment:${payment.id}`;
      const existing = await tx.walletTransaction.findUnique({ where: { reference } });
      if (!existing) {
        const amountPaise = payment.amountPaise || payment.amount * 100;
        const wallet = await tx.wallet.upsert({ where: { userId: payment.userId }, update: { balancePaise: { increment: amountPaise } }, create: { userId: payment.userId, balancePaise: amountPaise } });
        await tx.walletTransaction.create({ data: { userId: payment.userId, type: "recharge", purpose: "WALLET_RECHARGE", amountPaise, balanceAfterPaise: wallet.balancePaise, status: "success", reference, creditedAt: now, description: "Manual UPI wallet recharge verified" } });
      }
    }

    if (payment.purpose === "YEARLY_VERIFICATION" && payment.userId) {
      const startsAt = payment.paidAt || now;
      const validUntil = new Date(startsAt.getTime() + 365 * 86400_000);
      await tx.user.update({ where: { id: payment.userId }, data: { verificationPaymentStatus: "paid", verificationPaidUntil: validUntil } });
      await tx.socialVerification.updateMany({ where: { userId: payment.userId }, data: { paymentStatus: "paid", paymentId: payment.id, paidAt: startsAt, expiresAt: validUntil } });
      const reference = `manual_verification:${payment.id}`;
      const existing = await tx.walletTransaction.findUnique({ where: { reference } });
      if (!existing) await tx.walletTransaction.create({ data: { userId: payment.userId, type: "verification_fee", purpose: "VERIFICATION_PAYMENT", amountPaise: -(payment.amountPaise || payment.amount * 100), balanceAfterPaise: 0, status: "success", reference, creditedAt: startsAt, description: "Manual UPI yearly verification verified" } });
    }

    if (payment.purpose === "premium" && payment.userId) {
      const plan = premiumPlanFromPayment(payment.lineItems);
      const days = plan === "monthly" ? 30 : plan === "quarterly" ? 90 : 365;
      const startsAt = payment.paidAt || now;
      const endsAt = new Date(startsAt.getTime() + days * 86400_000);
      const existing = await tx.premiumSubscription.findFirst({ where: { paymentId: payment.id } });
      if (!existing) {
        await tx.premiumSubscription.updateMany({ where: { userId: payment.userId, active: true }, data: { active: false } });
        await tx.premiumSubscription.create({ data: { userId: payment.userId, plan: plan as any, startsAt, endsAt, amountPaise: payment.amountPaise || payment.amount * 100, paymentId: payment.id } });
      }
      await tx.user.update({ where: { id: payment.userId }, data: { premiumUntil: endsAt } });
    }
  });
}

async function rejectManualPayment(paymentId: string, actorId: string, reason: string) {
  await prisma.$transaction(async tx => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: { include: { items: true } }, booking: true } });
    if (!payment) throw Object.assign(new Error("Payment not found."), { status: 404 });
    const wasRejected = payment.paymentStatus === "rejected" || payment.status === "rejected";
    const now = new Date();
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "rejected", paymentStatus: "rejected", failureReason: reason, rejectionReason: reason, verifiedAt: now, verifiedBy: actorId }
    });

    if (payment.bookingId) await tx.booking.update({ where: { id: payment.bookingId }, data: { paymentStatus: "rejected", status: "rejected" as any } });
    if (payment.orderId && payment.order) {
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "rejected", status: "cancelled" as any } });
      if (!wasRejected) {
        for (const item of payment.order.items) {
          await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity }, salesCount: { decrement: item.quantity } } });
        }
      }
    }
    if (payment.purpose === "dojo_registration" && payment.targetId) await tx.dojo.updateMany({ where: { id: payment.targetId }, data: { registrationPaymentStatus: "rejected" } });
    if (payment.purpose === "YEARLY_VERIFICATION" && payment.userId) {
      await tx.user.update({ where: { id: payment.userId }, data: { verificationPaymentStatus: "unpaid", verificationPaidUntil: null } });
      await tx.socialVerification.updateMany({ where: { userId: payment.userId, paymentId: payment.id }, data: { paymentStatus: "unpaid", paymentId: null, paidAt: null, expiresAt: null } });
    }
    if (payment.userId) {
      await tx.notification.create({ data: { userId: payment.userId, type: "payment_rejected", title: "Payment rejected", message: reason } });
    }
  });
}

function premiumPlanFromPayment(lineItems: Prisma.JsonValue) {
  if (lineItems && typeof lineItems === "object" && !Array.isArray(lineItems) && "plan" in lineItems) {
    const plan = String((lineItems as { plan?: unknown }).plan || "");
    if (["monthly", "quarterly", "annual"].includes(plan)) return plan;
  }
  return "monthly";
}
