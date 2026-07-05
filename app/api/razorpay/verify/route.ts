import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay-security";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { getClientIp, isRateLimited, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  if (await isRateLimited(`razorpay-verify:${getClientIp(request)}`, 20, 60_000)) return NextResponse.json({ error: "Too many verification attempts." }, { status: 429 });
  try {
    const user = await requireApiUser(request);
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay server credentials are not configured." }, { status: 500 });
    const body = await request.json();
    const orderId = sanitizeText(body.razorpay_order_id, 80);
    const paymentId = sanitizeText(body.razorpay_payment_id, 80);
    const signature = sanitizeText(body.razorpay_signature, 160);
    if (!orderId || !paymentId || !signature) return NextResponse.json({ error: "Missing Razorpay verification fields." }, { status: 400 });
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
    if (!payment || payment.userId !== user.id) return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
    if (payment.status === "paid" && payment.razorpayPaymentId === paymentId) return NextResponse.json({ verified: true, orderId, paymentId, idempotent: true });
    if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature, keySecret)) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", failureReason: "signature_mismatch" } });
      return NextResponse.json({ verified: false, error: "Payment signature verification failed." }, { status: 400 });
    }
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    let remotePayment = await razorpay.payments.fetch(paymentId);
    if (remotePayment.order_id !== orderId || Number(remotePayment.amount) !== Number(payment.amountPaise) || remotePayment.currency !== "INR") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", failureReason: "payment_details_mismatch" } });
      return NextResponse.json({ verified: false, error: "Payment details did not match the order." }, { status: 400 });
    }
    if (remotePayment.status === "authorized") remotePayment = await razorpay.payments.capture(paymentId, Number(payment.amountPaise), "INR");
    if (remotePayment.status !== "captured") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "pending_capture", razorpayPaymentId: paymentId } });
      return NextResponse.json({ verified: false, error: "Payment is not captured yet." }, { status: 409 });
    }
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "paid", razorpayPaymentId: paymentId, razorpaySignature: signature, paidAt: new Date() } });
    return NextResponse.json({ verified: true, orderId, paymentId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("razorpay.verification_error", error);
    return NextResponse.json({ error: "Could not verify the payment. You can safely retry." }, { status: 500 });
  }
}
