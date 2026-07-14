import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { isSafeNotificationAction, pushSubscriptionSchema, safeNotificationAction } from "../lib/notifications/validation";

test("notification actions accept only approved internal dashboard routes", () => {
  assert.equal(isSafeNotificationAction("/coach-dashboard?booking=123"), true);
  assert.equal(isSafeNotificationAction("/dojo-dashboard"), true);
  assert.equal(isSafeNotificationAction("https://attacker.example"), false);
  assert.equal(isSafeNotificationAction("//attacker.example/path"), false);
  assert.equal(isSafeNotificationAction("/dashboard\\evil"), false);
  assert.equal(safeNotificationAction("https://attacker.example"), "/dashboard");
});

test("push subscription validation rejects unsafe or incomplete payloads", () => {
  assert.equal(pushSubscriptionSchema.safeParse({ endpoint: "http://push.example.test", keys: { p256dh: "a".repeat(30), auth: "b".repeat(12) } }).success, false);
  assert.equal(pushSubscriptionSchema.safeParse({ endpoint: "https://push.example.test/subscription", keys: { p256dh: "bad key with spaces", auth: "valid_auth_key" } }).success, false);
  assert.equal(pushSubscriptionSchema.safeParse({ endpoint: "https://push.example.test/subscription", keys: { p256dh: "A".repeat(40), auth: "B".repeat(20) } }).success, true);
});

test("booking creation derives recipients and uses database idempotency", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/bookings/create/route.ts"), "utf8");
  assert.match(source, /idempotencyKey: z\.string\(\)\.uuid\(\)/);
  assert.match(source, /user\.role !== "customer"/);
  assert.match(source, /recipientUserId: provider\.ownerId/);
  assert.doesNotMatch(source, /providerOwnerId:\s*input\./);
  assert.match(source, /provider\.availableDays/);
  assert.match(source, /deliverNotifications/);
});

test("booking updates and outbox delivery use optimistic atomic claims", () => {
  const status = fs.readFileSync(path.join(process.cwd(), "app/api/bookings/status/route.ts"), "utf8");
  const delivery = fs.readFileSync(path.join(process.cwd(), "lib/notifications/send-push.ts"), "utf8");
  assert.match(status, /updateMany\(\{[\s\S]*updatedAt: booking\.updatedAt/);
  assert.match(delivery, /notificationOutbox\.updateMany/);
  assert.match(delivery, /attemptCount: \{ lt: 8 \}/);
  assert.match(delivery, /status: "processing"[\s\S]*lastAttemptAt/);
});

test("service worker handles push without caching private traffic", () => {
  const worker = fs.readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");
  assert.match(worker, /addEventListener\("push"/);
  assert.match(worker, /addEventListener\("notificationclick"/);
  assert.doesNotMatch(worker, /addEventListener\("fetch"/);
  assert.doesNotMatch(worker, /caches\.open/);
});

test("production migration restricts notification data and enables realtime", () => {
  const migration = fs.readFileSync(path.join(process.cwd(), "server/prisma/migrations/20260714160000_email_verification_booking_notifications/migration.sql"), "utf8");
  assert.match(migration, /ALTER TABLE public\.notifications ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /notifications_read_own/);
  assert.match(migration, /REVOKE ALL ON public\.notification_outbox/);
  assert.match(migration, /push_subscriptions_payload_check/);
  assert.match(migration, /users_set_updated_at/);
  assert.match(migration, /supabase_realtime ADD TABLE public\.notifications/);
  assert.match(migration, /DROP COLUMN IF EXISTS "passwordHash"/);
});
