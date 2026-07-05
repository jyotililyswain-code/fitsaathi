import { NextResponse } from "next/server";
import { getPriceBreakdown } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = await request.json();
    const targetType = body.targetType === "coach" ? "coach" : body.targetType === "dojo" ? "dojo" : "";
    const targetId = sanitizeText(body.targetId, 100);
    const orderId = sanitizeText(body.razorpayOrderId, 100);
    if (!targetType || !targetId || !orderId || body.acceptedTerms !== true || body.acceptedPrivacy !== true) return NextResponse.json({ error: "Invalid booking request." }, { status: 400 });

    const [payment, coach, dojo, customer] = await Promise.all([
      prisma.payment.findUnique({ where: { razorpayOrderId: orderId } }),
      targetType === "coach" ? prisma.coach.findUnique({ where: { id: targetId } }) : Promise.resolve(null),
      targetType === "dojo" ? prisma.dojo.findUnique({ where: { id: targetId } }) : Promise.resolve(null),
      prisma.user.findUnique({ where: { id: user.id } })
    ]);
    const provider = coach || dojo;
    if (!payment || payment.userId !== user.id || payment.status !== "paid" || payment.targetId !== targetId) return NextResponse.json({ error: "A verified payment is required." }, { status: 409 });
    if (payment.bookingId) return NextResponse.json({ error: "This payment already has a booking." }, { status: 409 });
    if (!provider || !customer) return NextResponse.json({ error: "Provider not found." }, { status: 404 });

    const baseFee = coach ? coach.baseFee : dojo!.originalPrice;
    const pricing = getPriceBreakdown(baseFee, coach ? coach.platformFee : 0);
    const created = await prisma.$transaction(async tx => {
      const currentPayment = await tx.payment.findUnique({ where: { id: payment.id } });
      if (!currentPayment || currentPayment.status !== "paid" || currentPayment.bookingId) throw new Error("PAYMENT_NOT_AVAILABLE");
      const booking = await tx.booking.create({ data: {
        userId: user.id, providerOwnerId: provider.ownerId, coachId: coach?.id, dojoId: dojo?.id,
        customerName: sanitizeText(body.customerName, 100) || customer.name, city: sanitizeText(body.city, 100), classType: sanitizeText(body.classType, 30), packageType: sanitizeText(body.packageType, 30), preferredDate: sanitizeText(body.preferredDate, 20), preferredTime: sanitizeText(body.preferredTime, 20), notes: sanitizeText(body.notes, 1000),
        amount: pricing.finalPrice, originalPrice: pricing.originalPrice, platformFee: pricing.platformFee, finalPrice: pricing.finalPrice, coachPayout: coach ? pricing.coachPayout : pricing.originalPrice, payoutAmount: coach ? pricing.coachPayout : pricing.originalPrice, commissionAmount: pricing.platformFee, acceptedPolicies: true, paymentStatus: "paid", razorpayOrderId: orderId, razorpayPaymentId: payment.razorpayPaymentId, payoutMonth: new Date().toISOString().slice(0, 7)
      } });
      await tx.payment.update({ where: { id: payment.id }, data: { bookingId: booking.id } });
      await tx.notification.createMany({ data: [
        { userId: provider.ownerId, bookingId: booking.id, type: "new_booking", title: "New booking request", message: `${booking.customerName} sent a new booking request.` },
        { userId: user.id, bookingId: booking.id, type: "payment_success", title: "Booking request sent", message: `Your payment of ₹${pricing.finalPrice} was recorded.` }
      ] });
      return booking;
    });
    return NextResponse.json({ bookingId: created.id, status: created.status }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "PAYMENT_NOT_AVAILABLE") return NextResponse.json({ error: "A verified unused payment is required." }, { status: 409 });
    console.error("booking.create_failed", error);
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }
}
