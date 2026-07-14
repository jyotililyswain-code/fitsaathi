"use client";

import { useEffect, useRef } from "react";
import type { DashboardNotification } from "@/components/notifications/NotificationProvider";

export function BookingRealtimeListener({ onRefresh }: { onRefresh: () => void }) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  useEffect(() => {
    const seen = new Set<string>();
    const handler = (event: Event) => {
      const notification = (event as CustomEvent<DashboardNotification>).detail;
      if (!notification?.id || seen.has(notification.id) || !notification.type.includes("booking")) return;
      seen.add(notification.id);
      onRefreshRef.current();
    };
    window.addEventListener("fitsaathi:notification", handler);
    return () => window.removeEventListener("fitsaathi:notification", handler);
  }, []);
  return null;
}
