import { Prisma, type Notification } from "@prisma/client";
import { safeNotificationAction } from "@/lib/notifications/validation";

export type CreateNotificationInput = {
  recipientUserId: string;
  actorUserId?: string | null;
  type: string;
  title: string;
  message: string;
  bookingId?: string | null;
  orderId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  actionUrl: string;
  deduplicationKey: string;
  metadata?: Prisma.InputJsonValue;
  expiresAt?: Date | null;
};

export async function createNotification(tx: Prisma.TransactionClient, input: CreateNotificationInput): Promise<Notification> {
  const actionUrl = safeNotificationAction(input.actionUrl);
  const notification = await tx.notification.upsert({
    where: { deduplicationKey: input.deduplicationKey },
    update: {},
    create: {
      userId: input.recipientUserId,
      actorUserId: input.actorUserId,
      type: input.type,
      title: input.title,
      message: input.message,
      bookingId: input.bookingId,
      orderId: input.orderId,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      actionUrl,
      deduplicationKey: input.deduplicationKey,
      metadata: input.metadata ?? {},
      expiresAt: input.expiresAt,
    },
  });
  await tx.notificationOutbox.upsert({
    where: { deduplicationKey: `web_push:${input.deduplicationKey}` },
    update: {},
    create: {
      notificationId: notification.id,
      recipientUserId: input.recipientUserId,
      channel: "web_push",
      deduplicationKey: `web_push:${input.deduplicationKey}`,
    },
  });
  return notification;
}
