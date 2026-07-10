import { NextResponse } from "next/server";
import { ATTENDANCE_CODE_TTL_SECONDS, generateAttendanceCode, hashAttendanceCode } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { getClientIp, isRateLimited, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  if (await isRateLimited(`attendance-code:${getClientIp(request)}`, 10, 60_000)) return NextResponse.json({ error: "Too many attendance code requests." }, { status: 429 });
  try {
    const user = await requireApiUser(request);
    const bookingId = sanitizeText((await request.json()).bookingId, 80);
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId: user.id } });
    if (!booking) return NextResponse.json({ error: "Active booking not found." }, { status: 404 });
    if (booking.status !== "accepted") return NextResponse.json({ error: "The booking must be accepted before attendance can be marked." }, { status: 409 });
    if (booking.paymentStatus !== "paid") return NextResponse.json({ error: "The booking payment is not complete." }, { status: 409 });
    const providerProfileId = booking.coachId || booking.dojoId;
    if (!providerProfileId) return NextResponse.json({ error: "Booking provider is missing." }, { status: 409 });

    const code = generateAttendanceCode();
    const expiresAt = new Date(Date.now() + ATTENDANCE_CODE_TTL_SECONDS * 1000);
    await prisma.attendanceCode.create({
      data: {
        bookingId: booking.id,
        customerId: user.id,
        providerOwnerId: booking.providerOwnerId,
        providerProfileId,
        codeHash: hashAttendanceCode(code),
        sessionDate: booking.preferredDate,
        expiresAt
      }
    });

    return NextResponse.json({ code, expiresAt: expiresAt.toISOString(), expiresInSeconds: ATTENDANCE_CODE_TTL_SECONDS }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not generate attendance code." }, { status: 500 });
  }
}
