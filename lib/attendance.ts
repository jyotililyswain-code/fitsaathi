import crypto from "crypto";

const QR_TTL_MS = 2 * 60 * 1000;

export type AttendanceTokenPayload = {
  bookingId: string;
  coachId: string;
  customerId: string;
  classStartIso: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

export function createAttendanceToken(payload: Omit<AttendanceTokenPayload, "issuedAt" | "expiresAt" | "nonce">, secret: string) {
  const issuedAt = Date.now();
  const body: AttendanceTokenPayload = {
    ...payload,
    issuedAt,
    expiresAt: issuedAt + QR_TTL_MS,
    nonce: crypto.randomUUID()
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
}

export function verifyAttendanceToken(token: string, secret: string, now = Date.now()) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || sign(encoded, secret) !== signature) {
    return { ok: false as const, reason: "Invalid attendance QR." };
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AttendanceTokenPayload;
  if (payload.expiresAt < now) {
    return { ok: false as const, reason: "Attendance QR expired. Generate a fresh code." };
  }

  const classTime = new Date(payload.classStartIso).getTime();
  const allowedStart = classTime - 30 * 60 * 1000;
  const allowedEnd = classTime + 90 * 60 * 1000;
  if (Number.isFinite(classTime) && (now < allowedStart || now > allowedEnd)) {
    return { ok: false as const, reason: "Attendance can only be marked near the active class timing." };
  }

  return { ok: true as const, payload };
}

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}
