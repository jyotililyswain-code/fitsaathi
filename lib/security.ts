import { prisma } from "@/lib/prisma";

export async function isRateLimited(key: string, limit = 12, windowMs = 60_000) {
  const now = new Date();
  return prisma.$transaction(async tx => {
    const current = await tx.rateLimitBucket.findUnique({ where: { key } });
    const bucket = !current || current.resetAt <= now
      ? await tx.rateLimitBucket.upsert({ where: { key }, update: { count: 1, resetAt: new Date(now.getTime() + windowMs) }, create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) } })
      : await tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
    return bucket.count > limit;
  });
}

export function sanitizeText(value: unknown, maxLength = 120) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function assertSameOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new RequestSecurityError("Cross-site request blocked.");
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const forwardedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  if (origin !== requestOrigin && origin !== forwardedOrigin) throw new RequestSecurityError("Request origin is not allowed.");
}

export class RequestSecurityError extends Error {}
