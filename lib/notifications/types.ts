export type NotificationPayload = {
  notificationId: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string;
  bookingId?: string;
  icon?: string;
  badge?: string;
  tag: string;
  timestamp: string;
};

export type PushDeliveryResult = {
  configured: boolean;
  attempted: number;
  succeeded: number;
  failed: number;
  noSubscription: boolean;
};
