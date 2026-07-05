import type { RequestHandler } from "express";
import { prisma } from "./db";

export const databaseRateLimit = (limit: number, windowMs: number): RequestHandler => async (request, response, next) => {
  try {
    const forwarded = String(request.headers["x-forwarded-for"] || "").split(",")[0]?.trim();
    const ip = forwarded || request.ip || "unknown";
    const key = `express:${ip}`;
    const now = new Date();
    const current = await prisma.rateLimitBucket.findUnique({ where: { key } });
    const bucket = !current || current.resetAt <= now
      ? await prisma.rateLimitBucket.upsert({ where: { key }, update: { count: 1, resetAt: new Date(now.getTime() + windowMs) }, create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) } })
      : await prisma.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
    const limited = bucket.count > limit;
    if (limited) return response.status(429).json({ error: "Too many requests. Please try again shortly." });
    next();
  } catch (error) {
    console.warn("rate_limit.unavailable", error instanceof Error ? error.message : error);
    next();
  }
};
