import crypto from "crypto";
import { NextResponse } from "next/server";
import { verifyAttendanceToken } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { getClientIp, isRateLimited, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  if (await isRateLimited(`attendance-scan:${getClientIp(request)}`, 30, 60_000)) return NextResponse.json({ error: "Too many attendance scan attempts." }, { status: 429 });
  try {
    const user = await requireApiUser(request);
    const body = await request.json();
    const token = sanitizeText(body.token, 3000);
    const location = sanitizeText(body.location, 120);
    const secret = process.env.ATTENDANCE_QR_SECRET;
    if (!token || !secret) return NextResponse.json({ error: "Attendance service is not configured." }, { status: 500 });
    const result = verifyAttendanceToken(token, secret);
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
    const booking = await prisma.booking.findUnique({ where: { id: result.payload.bookingId } });
    if (!booking || booking.providerOwnerId !== user.id) return NextResponse.json({ error: "You are not the provider for this booking." }, { status: 403 });
    if (booking.status !== "accepted") return NextResponse.json({ error: "Booking is not active." }, { status: 409 });
    const nonceHash = crypto.createHash("sha256").update(result.payload.nonce).digest("hex");
    const attendanceId = crypto.createHash("sha256").update(`${result.payload.bookingId}:${result.payload.nonce}`).digest("hex");
    try {
      const attendance = await prisma.attendance.create({ data: { id: attendanceId, bookingId: booking.id, customerId: booking.userId, scannedById: user.id, providerProfileId: result.payload.coachId, nonceHash, location, status: "marked" } });
      return NextResponse.json({ attendanceId: attendance.id, bookingId: booking.id, scannedAt: attendance.scannedAt, attendanceStatus: attendance.status });
    } catch (error: any) {
      if (error?.code === "P2002") return NextResponse.json({ error: "Attendance already marked for this QR." }, { status: 409 });
      throw error;
    }
  } catch (error) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Attendance scan failed." }, { status: 500 });
  }
}
