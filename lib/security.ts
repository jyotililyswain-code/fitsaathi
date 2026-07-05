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
