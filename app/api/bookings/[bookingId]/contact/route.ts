import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { getClientIp, isRateLimited } from "@/lib/security";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

export async function GET(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const user = await requireApiUser(request);
    if (await isRateLimited(`booking-contact:${user.id}:${getClientIp(request)}`, 30, 10 * 60_000)) return NextResponse.json({ success: false, message: "Too many contact requests. Please wait." }, { status: 429 });
    const { bookingId } = await params;
    const booking = await prisma.booking.findFirst({
      // A free booking is contact-eligible as soon as it is confirmed. The
      // amount check keeps this compatible with older free rows that were
      // created before packageType was populated.
      where: {
        id: bookingId,
        userId: user.id,
        status: { in: ["confirmed", "accepted", "completed"] },
        OR: [{ packageType: "trial" }, { amount: 0 }],
      },
      select: {
        id: true,
        status: true,
        packageType: true,
        amount: true,
        preferredDate: true,
        preferredTime: true,
        classType: true,
        coach: { select: { name: true, category: true, city: true, phoneNumber: true, owner: { select: { name: true, phone: true } } } },
        dojo: { select: { name: true, category: true, address: true, city: true, state: true, pincode: true, phoneNumber: true, ownerName: true, owner: { select: { name: true, phone: true } } } },
      },
    });
    if (!booking) return NextResponse.json({ success: false, message: "You are not authorised to access this contact." }, { status: 403 });
    const provider = booking.coach || booking.dojo;
    const phone = normalizeProviderPhone(provider?.phoneNumber || provider?.owner?.phone);
    if (!provider || !phone) return NextResponse.json({ success: false, message: "This provider has not added a contact number yet." }, { status: 409 });
    const name = booking.coach ? booking.coach.owner.name : booking.dojo?.ownerName || booking.dojo?.owner.name || "Provider contact";
    return NextResponse.json({ success: true, contact: { name, phone }, booking: { id: booking.id, status: booking.status, providerName: provider.name, service: provider.category, date: booking.preferredDate, time: booking.preferredTime, classType: booking.classType, address: booking.dojo ? [booking.dojo.address, booking.dojo.city, booking.dojo.state, booking.dojo.pincode].filter(Boolean).join(", ") : booking.coach?.city || "" } });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    console.error("booking.contact_failed", { category: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ success: false, message: "Could not load this contact." }, { status: 500 });
  }
}

function normalizeProviderPhone(value?: string | null) {
  const normalized = normalizePhone(value || "");
  return isValidIndianPhone(normalized) ? `+91${normalized}` : null;
}
