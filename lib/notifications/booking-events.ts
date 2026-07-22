import type { Booking, Prisma } from "@prisma/client";
import { createNotification } from "@/lib/notifications/create-notification";

type BookingEvent = "created" | "trial_created_provider" | "accepted" | "rejected" | "cancelled" | "cancelled_by_provider" | "rescheduled" | "payment_confirmed" | "completed";

const copy: Record<BookingEvent, { type: string; title: string; message: string }> = {
  created: { type: "booking_created", title: "New booking received", message: "You received a new customer booking. Open your dashboard to review it." },
  trial_created_provider: { type: "trial_booked", title: "Trial booked automatically", message: "A new trial has been booked. No approval is required." },
  accepted: { type: "booking_accepted", title: "Booking accepted", message: "Your booking has been accepted. Open FitSaathi to view the details." },
  rejected: { type: "booking_rejected", title: "Booking not accepted", message: "The provider could not accept this booking. Open FitSaathi for more information." },
  cancelled: { type: "booking_cancelled", title: "Booking cancelled", message: "A booking has been cancelled. Open FitSaathi to view the updated details." },
  cancelled_by_provider: { type: "booking_cancelled_by_provider", title: "Booking cancelled by provider", message: "Your provider cancelled this booking. Open FitSaathi for the updated status." },
  rescheduled: { type: "booking_rescheduled", title: "Booking schedule updated", message: "A booking date or time has been changed. Open FitSaathi to review it." },
  payment_confirmed: { type: "payment_confirmed", title: "Payment confirmed", message: "Payment for your booking has been confirmed." },
  completed: { type: "booking_completed", title: "Booking completed", message: "Your booking has been marked as completed." },
};

export function providerBookingAction(booking: Pick<Booking, "id" | "coachId">) {
  return booking.coachId ? `/coach-dashboard?booking=${booking.id}` : `/dojo-dashboard?booking=${booking.id}`;
}

export function customerBookingAction(bookingId: string) {
  return `/dashboard?booking=${bookingId}`;
}

export async function createBookingEventNotification(
  tx: Prisma.TransactionClient,
  input: {
    event: BookingEvent;
    booking: Pick<Booking, "id" | "coachId">;
    recipientUserId: string;
    actorUserId?: string | null;
    audience: "provider" | "customer";
    deduplicationSuffix?: string;
    messageOverride?: string;
  },
) {
  const content = copy[input.event];
  return createNotification(tx, {
    recipientUserId: input.recipientUserId,
    actorUserId: input.actorUserId,
    type: content.type,
    title: content.title,
    message: input.messageOverride || content.message,
    bookingId: input.booking.id,
    relatedEntityType: "booking",
    relatedEntityId: input.booking.id,
    actionUrl: input.audience === "provider" ? providerBookingAction(input.booking) : customerBookingAction(input.booking.id),
    deduplicationKey: `${content.type}:${input.booking.id}:${input.recipientUserId}${input.deduplicationSuffix ? `:${input.deduplicationSuffix}` : ""}`,
    metadata: { bookingId: input.booking.id },
  });
}
