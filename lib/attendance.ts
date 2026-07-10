import crypto from "crypto";

export const ATTENDANCE_CODE_TTL_SECONDS = 5 * 60;

export function generateAttendanceCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashAttendanceCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function isSixDigitAttendanceCode(value: string) {
  return /^\d{6}$/.test(value);
}

type AttendanceTokenPayload = {
  bookingId: string;
  coachId: string;
  customerId: string;
  classStartIso: string;
};

export function createAttendanceToken(payload: AttendanceTokenPayload, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyAttendanceToken(token: string, secret: string, now = Date.now()) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return { ok: false as const };
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (signature.length !== expected.length) return { ok: false as const };
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return { ok: false as const };
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AttendanceTokenPayload;
    const classStart = Date.parse(payload.classStartIso);
    if (!Number.isFinite(classStart) || Math.abs(now - classStart) > 120_000) return { ok: false as const };
    return { ok: true as const, payload };
  } catch {
    return { ok: false as const };
  }
}
