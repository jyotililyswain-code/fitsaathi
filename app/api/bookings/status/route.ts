import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRole } from "@/lib/admin";
import { todayInIndia } from "@/lib/date";
import { createBookingEventNotification } from "@/lib/notifications/booking-events";
import { deliverNotifications } from "@/lib/notifications/send-push";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp, isRateLimited, RequestSecurityError } from "@/lib/security";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";

const bookingDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Choose a valid booking date.");
const bookingTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

const requestSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(["accepted", "rejected", "completed", "cancelled", "rescheduled"]),
  preferredDate: bookingDateSchema.optional(),
  preferredTime: bookingTimeSchema.optional(),
}).superRefine((value, context) => {
  if (value.status === "rescheduled" && (!value.preferredDate || !value.preferredTime)) context.addIssue({ code: "custom", message: "A new date and time are required." });
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(request);
    if (await isRateLimited(`booking-status:${user.id}:${getClientIp(request)}`, 30, 10 * 60_000)) return NextResponse.json({ error: "Too many booking updates. Please wait." }, { status: 429 });
    const input = requestSchema.parse(await request.json());
    const booking = await prisma.booking.findUnique({ where: { id: input.bookingId }, include: { customer: true, providerOwner: true } });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const providerRoleMatches = (Boolean(booking.coachId) && user.role === "coach") || (Boolean(booking.dojoId) && user.role === "dojo");
    const providerActor = booking.providerOwnerId === user.id && providerRoleMatches;
    const customerActor = booking.userId === user.id;
    const adminActor = isAdminRole(user.role);
    if (!providerActor && !customerActor && !adminActor) return NextResponse.json({ error: "You cannot manage this booking." }, { status: 403 });
    if (["accepted", "rejected", "completed"].includes(input.status) && !providerActor && !adminActor) return NextResponse.json({ error: "Only the provider can make this booking update." }, { status: 403 });
    const transitionError = validateTransition(booking.status, input.status);
    if (transitionError) return NextResponse.json({ error: transitionError }, { status: 409 });
    if (input.status === "rescheduled" && input.preferredDate! < todayInIndia()) return NextResponse.json({ error: "Choose a future booking date." }, { status: 400 });

    const result = await prisma.$transaction(async tx => {
      const nextStatus = input.status === "rescheduled" ? booking.status : input.status;
      const contactVisible = ["accepted", "completed"].includes(nextStatus);
      const claim = await tx.booking.updateMany({
        where: { id: booking.id, updatedAt: booking.updatedAt },
        data: {
          status: nextStatus,
          ...(input.status === "rescheduled" ? { preferredDate: input.preferredDate, preferredTime: input.preferredTime } : {}),
          contactVisible,
          customerPhone: contactVisible ? booking.customerPhone || booking.customer.phone : null,
          providerPhone: contactVisible ? booking.providerPhone || booking.providerOwner.phone : null,
          payoutStatus: "not_due",
        },
      });
      if (!claim.count) throw new BookingConflictError();
      const updated = await tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
      const notifications = [];
      const suffix = input.status === "rescheduled" ? `${input.preferredDate}:${input.preferredTime}` : undefined;
      if (["accepted", "rejected", "completed"].includes(input.status)) {
        notifications.push(await createBookingEventNotification(tx, { event: input.status as "accepted" | "rejected" | "completed", booking: updated, recipientUserId: booking.userId, actorUserId: user.id, audience: "customer" }));
      } else if (input.status === "cancelled") {
        if (customerActor || adminActor) notifications.push(await createBookingEventNotification(tx, { event: "cancelled", booking: updated, recipientUserId: booking.providerOwnerId, actorUserId: user.id, audience: "provider" }));
        if (providerActor || adminActor) notifications.push(await createBookingEventNotification(tx, { event: "cancelled_by_provider", booking: updated, recipientUserId: booking.userId, actorUserId: user.id, audience: "customer" }));
      } else if (input.status === "rescheduled") {
        notifications.push(await createBookingEventNotification(tx, { event: "rescheduled", booking: updated, recipientUserId: booking.userId, actorUserId: user.id, audience: "customer", deduplicationSuffix: suffix }));
        notifications.push(await createBookingEventNotification(tx, { event: "rescheduled", booking: updated, recipientUserId: booking.providerOwnerId, actorUserId: user.id, audience: "provider", deduplicationSuffix: suffix }));
      }
      return { booking: updated, notificationIds: notifications.map(item => item.id) };
    });
    await deliverNotifications(result.notificationIds);
    return NextResponse.json({ booking: result.booking });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof BookingConflictError) return NextResponse.json({ error: "This booking changed while you were updating it. Refresh and try again." }, { status: 409 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid booking update.", issues: error.issues }, { status: 400 });
    console.error("booking.status_failed", { category: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "Could not update booking." }, { status: 500 });
  }
}

class BookingConflictError extends Error {}

function validateTransition(current: string, requested: string) {
  if (requested === "rescheduled") return ["confirmed", "accepted"].includes(current) ? null : "This booking cannot be rescheduled now.";
  if (requested === "accepted" || requested === "rejected") return ["pending", "confirmed"].includes(current) ? null : "This booking request has already been handled.";
  if (requested === "completed") return current === "accepted" ? null : "Only an accepted booking can be completed.";
  if (requested === "cancelled") return ["pending", "confirmed", "accepted"].includes(current) ? null : "This booking can no longer be cancelled.";
  return "Invalid booking status transition.";
}
