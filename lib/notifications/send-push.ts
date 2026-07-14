import { prisma } from "@/lib/prisma";
import type { NotificationPayload, PushDeliveryResult } from "@/lib/notifications/types";
import { safeNotificationAction } from "@/lib/notifications/validation";
import { webPush, webPushConfiguration } from "@/lib/notifications/web-push";

export async function sendPushToUser(userId: string, payload: NotificationPayload): Promise<PushDeliveryResult> {
  const configuration = webPushConfiguration();
  if (!configuration.available) return { configured: false, attempted: 0, succeeded: 0, failed: 0, noSubscription: false };
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId, isActive: true }, orderBy: { createdAt: "desc" }, take: 20 });
  if (!subscriptions.length) return { configured: true, attempted: 0, succeeded: 0, failed: 0, noSubscription: true };

  const safePayload = { ...payload, actionUrl: safeNotificationAction(payload.actionUrl), body: payload.body.slice(0, 180), title: payload.title.slice(0, 100) };
  let succeeded = 0;
  let failed = 0;
  for (let index = 0; index < subscriptions.length; index += 4) {
    const batch = subscriptions.slice(index, index + 4);
    const results = await Promise.allSettled(batch.map(subscription => webPush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(safePayload),
      { TTL: 300, urgency: payload.type === "booking_created" ? "high" : "normal" },
    )));
    await Promise.all(results.map(async (result, offset) => {
      const subscription = batch[offset];
      if (result.status === "fulfilled") {
        succeeded += 1;
        await prisma.pushSubscription.update({ where: { id: subscription.id }, data: { lastSuccessAt: new Date(), failureCount: 0, lastFailureAt: null, lastFailureReason: null } });
        return;
      }
      failed += 1;
      const statusCode = Number((result.reason as { statusCode?: number })?.statusCode || 0);
      const permanent = statusCode === 404 || statusCode === 410;
      await prisma.pushSubscription.update({ where: { id: subscription.id }, data: { isActive: permanent ? false : subscription.isActive, failureCount: { increment: 1 }, lastFailureAt: new Date(), lastFailureReason: permanent ? "subscription_expired" : statusCode ? `push_http_${statusCode}` : "push_delivery_failed" } });
    }));
  }
  return { configured: true, attempted: subscriptions.length, succeeded, failed, noSubscription: false };
}

export async function deliverNotification(notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) return null;
  const outbox = await prisma.notificationOutbox.findFirst({ where: { notificationId, channel: "web_push" } });
  if (!outbox) return null;
  const now = new Date();
  const claim = await prisma.notificationOutbox.updateMany({
    where: {
      id: outbox.id,
      attemptCount: { lt: 8 },
      OR: [
        { status: "pending" },
        { status: "failed", nextAttemptAt: { lte: now } },
        { status: "processing", lastAttemptAt: { lte: new Date(now.getTime() - 10 * 60_000) } },
      ],
    },
    data: { status: "processing", attemptCount: { increment: 1 }, lastAttemptAt: now },
  });
  if (!claim.count) return null;
  let result: PushDeliveryResult;
  try {
    result = await sendPushToUser(notification.userId, {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.message,
      actionUrl: safeNotificationAction(notification.actionUrl),
      bookingId: notification.bookingId || undefined,
      tag: notification.deduplicationKey || notification.id,
      timestamp: notification.createdAt.toISOString(),
    });
  } catch {
    await prisma.notificationOutbox.update({ where: { id: outbox.id }, data: { status: "failed", lastError: "push_delivery_failed", nextAttemptAt: new Date(Date.now() + 5 * 60_000) } });
    return { configured: true, attempted: 0, succeeded: 0, failed: 1, noSubscription: false };
  }
  const delivered = result.succeeded > 0;
  const retryable = result.failed > 0 && !delivered;
  const error = !result.configured ? "push_not_configured" : result.noSubscription ? "no_active_subscription" : delivered ? null : "push_delivery_failed";
  await prisma.notificationOutbox.update({ where: { id: outbox.id }, data: { status: delivered ? "delivered" : "failed", processedAt: delivered ? new Date() : null, lastError: error, nextAttemptAt: retryable ? new Date(Date.now() + 5 * 60_000) : null } });
  return result;
}

export async function deliverNotifications(notificationIds: string[]) {
  return Promise.allSettled(notificationIds.map(id => deliverNotification(id)));
}
