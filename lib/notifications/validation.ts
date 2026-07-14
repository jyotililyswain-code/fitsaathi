import { z } from "zod";

const allowedActionPrefixes = [
  "/dashboard",
  "/coach-dashboard",
  "/dojo-dashboard",
  "/seller-dashboard",
  "/orders",
] as const;

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048).refine(value => value.startsWith("https://"), "Push endpoint must use HTTPS."),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(20).max(512).regex(/^[A-Za-z0-9_-]+={0,2}$/),
    auth: z.string().min(8).max(256).regex(/^[A-Za-z0-9_-]+={0,2}$/),
  }),
  deviceName: z.string().trim().max(100).optional(),
  browserName: z.string().trim().max(100).optional(),
  platform: z.string().trim().max(100).optional(),
});

export function isSafeNotificationAction(value: string | null | undefined): value is string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return false;
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { return false; }
  if (decoded.startsWith("//") || decoded.includes("\\") || decoded.includes("://")) return false;
  const pathname = decoded.split(/[?#]/, 1)[0];
  return allowedActionPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function safeNotificationAction(value: string | null | undefined, fallback = "/dashboard") {
  return isSafeNotificationAction(value) ? value : fallback;
}
