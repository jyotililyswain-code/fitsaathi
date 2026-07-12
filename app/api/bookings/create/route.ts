import { NextResponse } from "next/server";
import { MANUAL_UPI_ID, manualPaymentData } from "@/lib/manual-upi";
import { paymentBoolean, paymentValue, readPaymentRequest, requireTransactionId, storePaymentScreenshot } from "@/lib/manual-payment-server";
import { BOOKING_FEE } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = await readPaymentRequest(request);
    const targetType = paymentValue(body, "targetType", 10) === "coach" ? "coach" : paymentValue(body, "targetType", 10) === "dojo" ? "dojo" : "";
    const targetId = paymentValue(body, "targetId", 100);
    const transactionId = requireTransactionId(paymentValue(body, "transactionId", 80));
    if (!targetType || !targetId || !paymentBoolean(body, "acceptedTerms") || !paymentBoolean(body, "acceptedPrivacy")) return NextResponse.json({ error: "Invalid booking request." }, { status: 400 });

    const [coach, dojo, customer] = await Promise.all([
      targetType === "coach" ? prisma.coach.findUnique({ where: { id: targetId } }) : Promise.resolve(null),
      targetType === "dojo" ? prisma.dojo.findUnique({ where: { id: targetId } }) : Promise.resolve(null),
      prisma.user.findUnique({ where: { id: user.id } })
    ]);
    const provider = coach || dojo;
    if (!provider || !customer) return NextResponse.json({ error: "Provider not found." }, { status: 404 });
    if (coach && !coach.verified) return NextResponse.json({ error: "This coach is not available for booking." }, { status: 409 });
    if (dojo && (!dojo.approved || dojo.status !== "active")) return NextResponse.json({ error: "This dojo is not available for booking." }, { status: 409 });

    // Booking payment is a fixed platform charge; provider package pricing is
    // agreed separately and must not change the amount shown at checkout.
    const bookingAmount = BOOKING_FEE;
    const screenshotPath = await storePaymentScreenshot(body, "paymentScreenshot", "booking");
    const created = await prisma.$transaction(async tx => {
      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          providerOwnerId: provider.ownerId,
          coachId: coach?.id,
          dojoId: dojo?.id,
          customerName: paymentValue(body, "customerName", 100) || paymentValue(body, "name", 100) || customer.name,
          city: paymentValue(body, "city", 100),
          classType: paymentValue(body, "classType", 30),
          packageType: paymentValue(body, "packageType", 30),
          preferredDate: paymentValue(body, "preferredDate", 20),
          preferredTime: paymentValue(body, "preferredTime", 20),
          notes: paymentValue(body, "notes", 1000),
          status: "confirmed",
          amount: bookingAmount,
          originalPrice: 0,
          platformFee: bookingAmount,
          finalPrice: bookingAmount,
          coachPayout: 0,
          payoutAmount: 0,
          commissionAmount: bookingAmount,
          acceptedPolicies: true,
          paymentStatus: "paid",
          contactVisible: true,
          customerPhone: paymentValue(body, "phone", 20),
          providerPhone: provider.phoneNumber,
          payoutMonth: new Date().toISOString().slice(0, 7)
        }
      });
      await tx.payment.create({
        data: {
          userId: user.id,
          bookingId: booking.id,
          purpose: "booking",
          targetType,
          targetId,
          amount: bookingAmount,
          amountPaise: bookingAmount * 100,
          currency: "INR",
          originalPrice: 0,
          platformFee: bookingAmount,
          coachPayout: 0,
          ...manualPaymentData(transactionId, bookingAmount, screenshotPath || undefined)
        }
      });
      await tx.notification.createMany({
        data: [
          { userId: provider.ownerId, bookingId: booking.id, type: "booking_confirmed", title: "New confirmed booking", message: `${booking.customerName} submitted a confirmed booking with manual UPI payment.` },
          { userId: user.id, bookingId: booking.id, type: "payment_success", title: "Payment successful", message: `Your UPI payment of Rs. ${bookingAmount} was recorded and your booking is confirmed. UPI ID: ${MANUAL_UPI_ID}.` }
        ]
      });
      return booking;
    });
    return NextResponse.json({ bookingId: created.id, status: created.status }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "TRANSACTION_ID_REQUIRED") return NextResponse.json({ error: "Enter your UPI transaction ID / reference ID." }, { status: 400 });
    if (error instanceof Error && error.message === "INVALID_PAYMENT_SCREENSHOT") return NextResponse.json({ error: "Upload a PNG, JPG, or WEBP payment screenshot." }, { status: 400 });
    if (error instanceof Error && error.message === "PAYMENT_SCREENSHOT_TOO_LARGE") return NextResponse.json({ error: "Payment screenshot must be under 5 MB." }, { status: 400 });
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "This UPI transaction ID is already used." }, { status: 409 });
    console.error("booking.create_failed", error);
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }
}
