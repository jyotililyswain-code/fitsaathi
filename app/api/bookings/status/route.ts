import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = await request.json();
    const bookingId = sanitizeText(body.bookingId, 100);
    const status = sanitizeText(body.status, 20) as "accepted" | "rejected" | "completed" | "cancelled";
    if (!bookingId || !["accepted", "rejected", "completed", "cancelled"].includes(status)) return NextResponse.json({ error: "Invalid booking status request." }, { status: 400 });
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { customer: true, providerOwner: true } });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.providerOwnerId !== user.id && !isAdminRole(user.role)) return NextResponse.json({ error: "You cannot manage this booking." }, { status: 403 });
    const visible = ["accepted", "completed"].includes(status);
    const updated = await prisma.$transaction(async tx => {
      const item = await tx.booking.update({ where: { id: booking.id }, data: { status, contactVisible: visible, customerPhone: visible ? booking.customerPhone || booking.customer.phone : null, providerPhone: visible ? booking.providerPhone || booking.providerOwner.phone : null, payoutStatus: "not_due" } });
      if (["accepted", "rejected"].includes(status)) await tx.notification.create({ data: { userId: booking.userId, bookingId: booking.id, type: `booking_${status}`, title: `Booking ${status}`, message: status === "accepted" ? "Your provider accepted the booking." : "Your provider rejected the booking." } });
      return item;
    });
    return NextResponse.json({ booking: updated });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not update booking." }, { status: 500 });
  }
}
