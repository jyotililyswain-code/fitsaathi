"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { localApi } from "@/lib/local-api";
import { safeNotificationAction } from "@/lib/notifications/validation";
import { supabase } from "@/lib/supabase";

export type DashboardNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId?: string | null;
  actionUrl?: string | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
};

type NotificationContextValue = {
  items: DashboardNotification[];
  unreadCount: number;
  loading: boolean;
  reload: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const { user } = useSessionUser();
  const [items, setItems] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<DashboardNotification | null>(null);
  const seenIds = useRef(new Set<string>());

  const reload = useCallback(async () => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const result = await localApi<{ items: DashboardNotification[]; unreadCount: number }>("/notifications?limit=10");
      result.items.forEach(item => seenIds.current.add(item.id));
      setItems(result.items);
      setUnreadCount(Math.max(0, result.unreadCount));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    if (!user || !supabase) return;
    const client = supabase;
    const channel = client.channel(`notifications:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `userId=eq.${user.id}` }, payload => {
        const item = payload.new as DashboardNotification;
        if (!item?.id || seenIds.current.has(item.id)) return;
        seenIds.current.add(item.id);
        setItems(current => [item, ...current.filter(existing => existing.id !== item.id)].slice(0, 10));
        setUnreadCount(current => Math.max(0, current + (item.read ? 0 : 1)));
        if (item.type === "booking_created" && ["/coach-dashboard", "/dojo-dashboard"].some(prefix => pathname.startsWith(prefix))) setToast(item);
        window.dispatchEvent(new CustomEvent("fitsaathi:notification", { detail: item }));
      })
      .subscribe(status => { if (status === "SUBSCRIBED") void reload(); });
    return () => { void client.removeChannel(channel); };
  }, [pathname, reload, user]);

  async function markRead(id: string) {
    const result = await localApi<{ unreadCount: number }>("/notifications", { method: "PATCH", body: JSON.stringify({ notificationId: id }) });
    setItems(current => current.map(item => item.id === id ? { ...item, read: true, readAt: new Date().toISOString() } : item));
    setUnreadCount(Math.max(0, result.unreadCount));
  }

  async function markAllRead() {
    const result = await localApi<{ unreadCount: number }>("/notifications", { method: "PATCH", body: JSON.stringify({ all: true }) });
    setItems(current => current.map(item => ({ ...item, read: true, readAt: item.readAt || new Date().toISOString() })));
    setUnreadCount(Math.max(0, result.unreadCount));
  }

  return (
    <NotificationContext.Provider value={{ items, unreadCount, loading, reload, markRead, markAllRead }}>
      {children}
      {toast ? (
        <aside role="status" aria-live="polite" className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[80] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-acid/30 bg-zinc-950 p-4 shadow-2xl">
          <p className="font-bold text-white">New booking received</p>
          <p className="mt-1 text-sm text-zinc-400">Open bookings to review the customer request.</p>
          <div className="mt-4 flex gap-2">
            <Link href={safeNotificationAction(toast.actionUrl)} onClick={() => setToast(null)} className="inline-flex min-h-11 items-center rounded-full bg-acid px-4 py-2 text-xs font-bold text-ink">View booking</Link>
            <button type="button" onClick={() => setToast(null)} className="min-h-11 rounded-full border border-white/15 px-4 py-2 text-xs text-zinc-300">Close</button>
          </div>
        </aside>
      ) : null}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error("useNotifications must be used inside NotificationProvider.");
  return value;
}
