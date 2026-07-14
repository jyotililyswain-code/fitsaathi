"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { relativeTime } from "@/components/notifications/NotificationBell";
import type { DashboardNotification } from "@/components/notifications/NotificationProvider";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { localApi } from "@/lib/local-api";
import { safeNotificationAction } from "@/lib/notifications/validation";

export default function NotificationsPage() {
  const shared = useNotifications();
  const [items, setItems] = useState<DashboardNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await localApi<{ items: DashboardNotification[]; total: number }>(`/notifications?page=${page}&limit=${limit}${filter === "unread" ? "&unread=true" : ""}`);
      setItems(result.items);
      setTotal(result.total);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load notifications."); }
    finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { void load(); }, [load, shared.unreadCount]);

  async function markRead(item: DashboardNotification) {
    if (!item.read) await shared.markRead(item.id);
    setItems(current => current.map(value => value.id === item.id ? { ...value, read: true } : value));
  }

  async function markAll() {
    await shared.markAllRead();
    await load();
  }

  return (
    <AuthGuard>
      <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-acid">Your updates</p><h1 className="mt-2 text-4xl font-black text-white">Notifications</h1><p className="mt-2 text-zinc-400">{shared.unreadCount} unread notification{shared.unreadCount === 1 ? "" : "s"}</p></div><button type="button" onClick={() => void markAll()} disabled={!shared.unreadCount} className="rounded-full border border-acid/40 px-5 py-2.5 text-sm font-semibold text-acid disabled:opacity-40">Mark all as read</button></div>
        <div className="mt-7 flex gap-2">{(["all", "unread"] as const).map(value => <button key={value} type="button" onClick={() => { setFilter(value); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${filter === value ? "bg-acid text-ink" : "border border-white/10 text-zinc-300"}`}>{value}</button>)}</div>
        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
          {loading ? <p className="p-8 text-center text-zinc-400">Loading notifications…</p> : error ? <div className="p-8 text-center"><p className="text-red-300">{error}</p><button type="button" onClick={() => void load()} className="mt-4 rounded-full bg-acid px-4 py-2 text-sm font-semibold text-ink">Try again</button></div> : items.length ? items.map(item => (
            <Link key={item.id} href={safeNotificationAction(item.actionUrl)} onClick={() => void markRead(item)} className={`block border-b border-white/5 p-5 transition hover:bg-white/[.05] ${item.read ? "opacity-65" : "bg-acid/[.04]"}`}>
              <div className="flex gap-3"><span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${item.read ? "bg-zinc-700" : "bg-acid"}`} /><div><p className="font-semibold text-white">{item.title}</p><p className="mt-1 text-sm leading-6 text-zinc-400">{item.message}</p><p className="mt-2 text-xs text-zinc-600">{relativeTime(item.createdAt)}</p></div></div>
            </Link>
          )) : <p className="p-10 text-center text-zinc-400">You do not have any notifications yet.</p>}
        </section>
        {total > limit ? <div className="mt-5 flex items-center justify-center gap-3"><button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-40">Previous</button><span className="text-sm text-zinc-400">Page {page}</span><button type="button" onClick={() => setPage(value => value + 1)} disabled={page * limit >= total} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-40">Next</button></div> : null}
      </main>
    </AuthGuard>
  );
}
