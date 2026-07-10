import { NextResponse } from "next/server";
import { hashAttendanceCode, isSixDigitAttendanceCode } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { getClientIp, isRateLimited, sanitizeText } from "@/lib/security";

const invalidMessage = "Invalid or expired attendance code";

export async function POST(request: Request) {
  if (await isRateLimited(`attendance-verify:${getClientIp(request)}`, 15, 60_000)) return NextResponse.json({ error: "Too many attendance code attempts." }, { status: 429 });
  try {
    const user = await requireApiUser(request);
    const body = await request.json();
    const bookingId = sanitizeText(body.bookingId, 80);
    const code = sanitizeText(body.code, 6);
    if (!bookingId || !isSixDigitAttendanceCode(code)) return NextResponse.json({ error: invalidMessage }, { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.providerOwnerId !== user.id) return NextResponse.json({ error: invalidMessage }, { status: 400 });
    if (booking.status !== "accepted") return NextResponse.json({ error: invalidMessage }, { status: 400 });

    const now = new Date();
    const codeHash = hashAttendanceCode(code);
    const result = await prisma.$transaction(async tx => {
      const attendanceCode = await tx.attendanceCode.findFirst({
        where: {
          bookingId: booking.id,
          customerId: booking.userId,
          providerOwnerId: user.id,
          providerProfileId: booking.coachId || booking.dojoId || "",
          sessionDate: booking.preferredDate,
          codeHash,
          status: "active",
          usedAt: null,
          expiresAt: { gt: now }
        },
        orderBy: { createdAt: "desc" }
      });
      if (!attendanceCode) return null;

      const existing = await tx.attendance.findFirst({ where: { bookingId: booking.id, sessionDate: booking.preferredDate, status: "marked" } });
      if (existing) return { attendance: existing, reused: true };

      const attendance = await tx.attendance.create({
        data: {
          bookingId: booking.id,
          customerId: booking.userId,
          scannedById: user.id,
          providerProfileId: attendanceCode.providerProfileId,
          sessionDate: booking.preferredDate,
          status: "marked",
          method: "OTP_CODE"
        }
      });
      await tx.attendanceCode.update({ where: { id: attendanceCode.id }, data: { usedAt: now, status: "used" } });
      return { attendance, reused: false };
    });

    if (!result) return NextResponse.json({ error: invalidMessage }, { status: 400 });
    if (result.reused) return NextResponse.json({ error: invalidMessage }, { status: 409 });
    return NextResponse.json({ attendanceId: result.attendance.id, bookingId: booking.id, markedAt: result.attendance.scannedAt, attendanceStatus: "marked", message: "Attendance marked successfully" });
  } catch (error: any) {
    if (error instanceof ApiAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error?.code === "P2002") return NextResponse.json({ error: invalidMessage }, { status: 409 });
    return NextResponse.json({ error: "Attendance verification failed." }, { status: 500 });
  }
}
