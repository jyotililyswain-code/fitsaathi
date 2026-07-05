import type { RequestHandler } from "express";
import { prisma } from "./db";

export const databaseRateLimit = (limit: number, windowMs: number): RequestHandler => async (request, response, next) => {
  try {
    const forwarded = String(request.headers["x-forwarded-for"] || "").split(",")[0]?.trim();
    const ip = forwarded || request.ip || "unknown";
    const key = `express:${ip}`;
    const now = new Date();
    const limited = await prisma.$transaction(async tx => {
      const current = await tx.rateLimitBucket.findUnique({ where: { key } });
      const bucket = !current || current.resetAt <= now
        ? await tx.rateLimitBucket.upsert({ where: { key }, update: { count: 1, resetAt: new Date(now.getTime() + windowMs) }, create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) } })
        : await tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
      return bucket.count > limit;
    });
    if (limited) return response.status(429).json({ error: "Too many requests. Please try again shortly." });
    next();
  } catch (error) {
    next(error);
  }
};
