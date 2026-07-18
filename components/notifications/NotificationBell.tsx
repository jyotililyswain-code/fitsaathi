"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarCheck2, CheckCheck, CircleX, Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { safeNotificationAction } from "@/lib/notifications/validation";
import { useNotifications } from "@/components/notifications/NotificationProvider";

export function NotificationBell() {
  const { user } = useSessionUser();
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const previousLocationRef = useRef(`${pathname}:${user?.id || ""}`);

  useEffect(() => {
    const location = `${pathname}:${user?.id || ""}`;
    if (previousLocationRef.current !== location) setOpen(false);
    previousLocationRef.current = location;
  }, [pathname, user?.id]);

  useEffect(() => {
    if (!open) return;

    function closePopup(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") setOpen(false);
        return;
      }
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", closePopup);
    document.addEventListener("keydown", closePopup);
    return () => {
      document.removeEventListener("mousedown", closePopup);
      document.removeEventListener("keydown", closePopup);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button id="notification-menu-button" type="button" onClick={() => setOpen(value => !value)} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={open} aria-controls="notification-menu" aria-haspopup="dialog" className="focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-zinc-200 hover:border-acid/40 hover:text-acid">
        <Bell className="h-5 w-5" />
        {unreadCount ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-acid px-1.5 py-0.5 text-center text-[10px] font-black text-ink">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
      </button>
      {open ? (
        <section id="notification-menu" role="dialog" aria-modal="false" aria-labelledby="notification-menu-title" className="absolute right-[-3.25rem] top-[calc(100%+0.5rem)] z-[70] flex max-h-[calc(100dvh-5.5rem)] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl 2xl:right-0">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div><p id="notification-menu-title" className="font-bold text-white">Notifications</p><p className="text-xs text-zinc-500">{unreadCount} unread</p></div>
            <button type="button" onClick={() => void markAllRead()} disabled={!unreadCount} className="inline-flex min-h-11 items-center gap-1 px-1 text-xs font-semibold text-acid disabled:opacity-40"><CheckCheck className="h-4 w-4" />Mark all read</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {loading && !items.length ? <p className="p-5 text-sm text-zinc-400">Loading notifications…</p> : items.length ? items.map(item => (
              <Link key={item.id} href={safeNotificationAction(item.actionUrl)} onClick={() => { setOpen(false); if (!item.read) void markRead(item.id); }} className={`block border-b border-white/5 p-4 transition hover:bg-white/[.05] ${item.read ? "opacity-65" : "bg-acid/[.04]"}`}>
                <div className="flex gap-3"><NotificationTypeIcon type={item.type} read={item.read} /><div className="min-w-0"><p className="break-words text-sm font-semibold text-white">{item.title}</p><p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-zinc-400">{item.message}</p><p className="mt-2 text-[11px] text-zinc-600">{relativeTime(item.createdAt)}</p></div></div>
              </Link>
            )) : <p className="p-6 text-center text-sm text-zinc-400">You do not have any notifications yet.</p>}
          </div>
          <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center p-3 text-center text-sm font-semibold text-acid">View all notifications</Link>
        </section>
      ) : null}
    </div>
  );
}

function NotificationTypeIcon({ type, read }: { type: string; read: boolean }) {
  const className = `mt-0.5 h-4 w-4 shrink-0 ${read ? "text-zinc-600" : "text-acid"}`;
  if (type.includes("cancelled") || type.includes("rejected")) return <CircleX className={className} aria-hidden="true" />;
  if (type.includes("rescheduled")) return <Clock3 className={className} aria-hidden="true" />;
  return <CalendarCheck2 className={className} aria-hidden="true" />;
}

export function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`;
  return new Date(value).toLocaleDateString();
}
