import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = await request.json();
    const orderId = sanitizeText(body.orderId, 80);
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
    if (!payment || payment.userId !== user.id) return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
    if (payment.status !== "paid") await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", failureReason: sanitizeText(body.reason, 300) || "checkout_failed", razorpayPaymentId: sanitizeText(body.paymentId, 80) || null, errorCode: sanitizeText(body.errorCode, 80) || null } });
    return NextResponse.json({ recorded: true });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not record payment failure." }, { status: 500 });
  }
}
