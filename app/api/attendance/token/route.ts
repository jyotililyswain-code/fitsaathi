import { NextResponse } from "next/server";
import { createAttendanceToken } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { getClientIp, isRateLimited, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  if (await isRateLimited(`attendance-token:${getClientIp(request)}`, 20, 60_000)) return NextResponse.json({ error: "Too many attendance QR requests." }, { status: 429 });
  try {
    const user = await requireApiUser(request);
    const bookingId = sanitizeText((await request.json()).bookingId, 80);
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId: user.id } });
    if (!booking) return NextResponse.json({ error: "Active booking not found." }, { status: 404 });
    if (booking.status !== "accepted") return NextResponse.json({ error: "The booking must be accepted before attendance can be marked." }, { status: 409 });
    if (booking.paymentStatus !== "paid") return NextResponse.json({ error: "The booking payment is not complete." }, { status: 409 });
    const providerProfileId = booking.coachId || booking.dojoId;
    if (!providerProfileId) return NextResponse.json({ error: "Booking provider is missing." }, { status: 409 });
    const classStart = parseClassStart(booking.preferredDate, booking.preferredTime);
    if (!classStart) return NextResponse.json({ error: "The booking class time is invalid." }, { status: 409 });
    const classStartIso = classStart.toISOString();
    const token = createAttendanceToken({ bookingId, coachId: providerProfileId, customerId: user.id, classStartIso }, attendanceSecret());
    return NextResponse.json({ token, expiresInSeconds: 120 }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not generate attendance QR." }, { status: 500 });
  }
}

function attendanceSecret() {
  const secret = process.env.ATTENDANCE_QR_SECRET;
  if (!secret) throw new Error("ATTENDANCE_QR_SECRET is not configured.");
  return secret;
}

function parseClassStart(date: string, time: string | null) {
  const value = (time || "00:00").trim();
  const twelveHour = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const twentyFourHour = value.match(/^(\d{1,2}):(\d{2})$/);
  let hours: number;
  let minutes: number;
  if (twelveHour) {
    hours = Number(twelveHour[1]) % 12 + (twelveHour[3].toUpperCase() === "PM" ? 12 : 0);
    minutes = Number(twelveHour[2]);
  } else if (twentyFourHour) {
    hours = Number(twentyFourHour[1]);
    minutes = Number(twentyFourHour[2]);
  } else return null;
  if (hours > 23 || minutes > 59) return null;
  const parsed = new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}
