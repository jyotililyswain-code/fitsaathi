import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createBookingEventNotification, customerBookingAction } from "@/lib/notifications/booking-events";
import { createNotification } from "@/lib/notifications/create-notification";
import { deliverNotifications } from "@/lib/notifications/send-push";
import { monthInIndia, todayInIndia } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp, isRateLimited, RequestSecurityError } from "@/lib/security";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";

const bookingDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Choose a valid booking date.");
const bookingTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

const bookingSchema = z.object({
  targetType: z.enum(["coach", "dojo"]),
  targetId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9][0-9]{9}$/),
  city: z.string().trim().min(2).max(100),
  classType: z.enum(["home", "dojo", "online"]),
  packageType: z.enum(["trial", "monthly", "quarterly", "custom"]),
  preferredDate: bookingDateSchema,
  preferredTime: bookingTimeSchema,
  notes: z.string().trim().max(1000).optional().default(""),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(request);
    if (user.role !== "customer") return NextResponse.json({ error: "A customer account is required to create a booking." }, { status: 403 });
    if (await isRateLimited(`booking-create:${user.id}:${getClientIp(request)}`, 10, 10 * 60_000)) return NextResponse.json({ error: "Too many booking attempts. Please wait and try again." }, { status: 429 });
    const input = bookingSchema.parse(await request.json());
    const existing = await findIdempotentBooking(input.idempotencyKey);
    if (existing) {
      if (existing.userId !== user.id) return NextResponse.json({ error: "This booking request is not available." }, { status: 409 });
      return bookingResponse(existing);
    }

    const today = todayInIndia();
    if (input.preferredDate < today) return NextResponse.json({ error: "Choose a future booking date." }, { status: 400 });
    const [coach, dojo, customer] = await Promise.all([
      input.targetType === "coach" ? prisma.coach.findUnique({ where: { id: input.targetId }, include: { owner: { select: { emailVerified: true, accountStatus: true } } } }) : Promise.resolve(null),
      input.targetType === "dojo" ? prisma.dojo.findUnique({ where: { id: input.targetId }, include: { owner: { select: { emailVerified: true, accountStatus: true } } } }) : Promise.resolve(null),
      prisma.user.findUnique({ where: { id: user.id } }),
    ]);
    const provider = coach || dojo;
    if (!provider || !customer) return NextResponse.json({ error: "Provider not found." }, { status: 404 });
    if (provider.ownerId === user.id) return NextResponse.json({ error: "You cannot book your own provider profile." }, { status: 409 });
    if (provider.owner.accountStatus !== "active") return NextResponse.json({ error: "This provider is not available for booking." }, { status: 409 });
    if (coach && (!coach.verified || coach.status !== "approved")) return NextResponse.json({ error: "This coach is not available for booking." }, { status: 409 });
    if (dojo && (!dojo.approved || dojo.status !== "active")) return NextResponse.json({ error: "This dojo or gym is not available for booking." }, { status: 409 });
    const selectedDay = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${input.preferredDate}T00:00:00.000Z`)).toLowerCase();
    if (provider.availableDays.length && !provider.availableDays.some(day => day.trim().toLowerCase() === selectedDay)) return NextResponse.json({ error: "This provider is not available on the selected day." }, { status: 409 });
    const exactTimes = provider.availableTimings.map(normalizeAvailabilityTime);
    if (exactTimes.length && exactTimes.every(Boolean) && !exactTimes.includes(input.preferredTime)) return NextResponse.json({ error: "This provider is not available at the selected time." }, { status: 409 });

    let result: { booking: Awaited<ReturnType<typeof prisma.booking.create>>; notificationIds: string[] };
    try {
      result = await prisma.$transaction(async tx => {
        const booking = await tx.booking.create({
          data: {
            idempotencyKey: input.idempotencyKey,
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
            payoutMonth: monthInIndia(),
          },
        });
        const providerNotification = await createBookingEventNotification(tx, { event: "created", booking, recipientUserId: provider.ownerId, actorUserId: user.id, audience: "provider" });
        const customerNotification = await createNotification(tx, { recipientUserId: user.id, type: "booking_confirmed", title: "Booking request sent", message: "Your booking request was sent to the provider.", bookingId: booking.id, relatedEntityType: "booking", relatedEntityId: booking.id, actionUrl: customerBookingAction(booking.id), deduplicationKey: `booking_confirmed:${booking.id}:${user.id}`, metadata: { bookingId: booking.id } });
        return { booking, notificationIds: [providerNotification.id, customerNotification.id] };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const duplicate = await findIdempotentBooking(input.idempotencyKey);
        if (duplicate?.userId === user.id) return bookingResponse(duplicate);
      }
      throw error;
    }
    await deliverNotifications(result.notificationIds);
    return NextResponse.json({ bookingId: result.booking.id, status: result.booking.status, providerName: provider.name }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Please correct the booking details.", issues: error.issues }, { status: 400 });
    console.error("booking.create_failed", { category: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "Could not create this booking." }, { status: 500 });
  }
}

function findIdempotentBooking(idempotencyKey: string) {
  return prisma.booking.findUnique({ where: { idempotencyKey }, include: { coach: { select: { name: true } }, dojo: { select: { name: true } } } });
}

function bookingResponse(booking: NonNullable<Awaited<ReturnType<typeof findIdempotentBooking>>>) {
  return NextResponse.json({ bookingId: booking.id, status: booking.status, providerName: booking.coach?.name || booking.dojo?.name || "your provider" });
}

function normalizeAvailabilityTime(value: string) {
  const twentyFourHour = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHour) return `${twentyFourHour[1].padStart(2, "0")}:${twentyFourHour[2]}`;
  const twelveHour = value.trim().match(/^(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)$/i);
  if (!twelveHour) return null;
  let hour = Number(twelveHour[1]) % 12;
  if (twelveHour[3].toLowerCase() === "pm") hour += 12;
  return `${String(hour).padStart(2, "0")}:${twelveHour[2] || "00"}`;
}
