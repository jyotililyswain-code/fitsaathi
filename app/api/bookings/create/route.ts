import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp, isRateLimited, RequestSecurityError } from "@/lib/security";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";

const bookingSchema = z.object({
  targetType: z.enum(["coach", "dojo"]),
  targetId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9][0-9]{9}$/),
  city: z.string().trim().min(2).max(100),
  classType: z.enum(["home", "dojo", "online"]),
  packageType: z.enum(["trial", "monthly", "quarterly", "custom"]),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(1000).optional().default(""),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true)
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(request);
    if (await isRateLimited(`booking-prepare:${user.id}:${getClientIp(request)}`, 10, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many booking attempts. Please wait and try again." }, { status: 429 });
    }
    const input = bookingSchema.parse(await request.json());
    const today = new Date().toISOString().slice(0, 10);
    if (input.preferredDate < today) return NextResponse.json({ error: "Choose a future booking date." }, { status: 400 });

    const [coach, dojo, customer] = await Promise.all([
      input.targetType === "coach" ? prisma.coach.findUnique({ where: { id: input.targetId } }) : Promise.resolve(null),
      input.targetType === "dojo" ? prisma.dojo.findUnique({ where: { id: input.targetId } }) : Promise.resolve(null),
      prisma.user.findUnique({ where: { id: user.id } })
    ]);
    const provider = coach || dojo;
    if (!provider || !customer) return NextResponse.json({ error: "Provider not found." }, { status: 404 });
    if (coach && (!coach.verified || coach.status === "suspended" || coach.status === "rejected")) {
      return NextResponse.json({ error: "This coach is not available for booking." }, { status: 409 });
    }
    if (dojo && (!dojo.approved || dojo.status !== "active")) {
      return NextResponse.json({ error: "This dojo or gym is not available for booking." }, { status: 409 });
    }

    const booking = await prisma.$transaction(async tx => {
      const created = await tx.booking.create({
        data: {
          userId: user.id,
          providerOwnerId: provider.ownerId,
          coachId: coach?.id,
          dojoId: dojo?.id,
          customerName: input.name || customer.name,
          city: input.city,
          classType: input.classType,
          packageType: input.packageType,
          preferredDate: input.preferredDate,
          preferredTime: input.preferredTime,
          notes: input.notes,
          status: "confirmed",
          amount: 0,
          originalPrice: 0,
          platformFee: 0,
          finalPrice: 0,
          coachPayout: 0,
          payoutAmount: 0,
          commissionAmount: 0,
          acceptedPolicies: true,
          paymentStatus: "not_required",
          contactVisible: false,
          customerPhone: input.phone,
          providerPhone: null,
          payoutMonth: new Date().toISOString().slice(0, 7)
        }
      });
      await tx.notification.createMany({
        data: [
          { userId: provider.ownerId, bookingId: created.id, type: "booking_confirmed", title: "New free booking", message: `${created.customerName} created a booking request. No payment is required.` },
          { userId: user.id, bookingId: created.id, type: "booking_confirmed", title: "Booking confirmed", message: `Your booking with ${provider.name} is confirmed. FitSaathi charged ₹0.` }
        ]
      });
      return created;
    });

    return NextResponse.json({
      bookingId: booking.id,
      status: booking.status,
      providerName: provider.name
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Please correct the booking details.", issues: error.issues }, { status: 400 });
    console.error("booking.create_failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Could not create this booking." }, { status: 500 });
  }
}
