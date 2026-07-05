import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay-security";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Razorpay webhook secret is not configured." }, { status: 500 });
  if (Number(request.headers.get("content-length") || 0) > 1_000_000) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  const payload = await request.text();
  if (!verifyRazorpayWebhookSignature(payload, request.headers.get("x-razorpay-signature") || "", secret)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  let event: any;
  try { event = JSON.parse(payload); } catch { return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 }); }
  const paymentEntity = event.payload?.payment?.entity;
  const refundEntity = event.payload?.refund?.entity;
  let orderId = String(paymentEntity?.order_id || refundEntity?.order_id || "");
  let payment = orderId ? await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } }) : null;
  if (!payment && refundEntity?.payment_id) payment = await prisma.payment.findUnique({ where: { razorpayPaymentId: String(refundEntity.payment_id) } });
  const status = event.event === "payment.captured" || event.event === "order.paid" ? "paid" : event.event === "payment.failed" ? "failed" : event.event === "refund.processed" ? "refunded" : undefined;
  if (payment && status) {
    await prisma.$transaction(async tx => {
      await tx.payment.update({ where: { id: payment!.id }, data: { status, razorpayPaymentId: paymentEntity?.id || refundEntity?.payment_id || payment!.razorpayPaymentId, refundId: refundEntity?.id || null, failureReason: paymentEntity?.error_description || null, webhookEvent: event.event, paidAt: status === "paid" ? new Date() : payment!.paidAt } });
      if (payment!.bookingId && ["refunded", "failed"].includes(status)) await tx.booking.update({ where: { id: payment!.bookingId }, data: { paymentStatus: status } });
      if (payment!.orderId && ["refunded", "failed"].includes(status)) await tx.order.update({ where: { id: payment!.orderId }, data: { paymentStatus: status, status: status === "refunded" ? "refunded" : "cancelled" } });
    });
  }
  return NextResponse.json({ received: true, event: event.event || "unknown" }, { headers: { "Cache-Control": "no-store" } });
}
