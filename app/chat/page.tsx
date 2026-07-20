"use client";

/* eslint-disable @next/next/no-img-element -- social photos are served by the local API */
import { MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { socialApi, socialAsset, type SocialProfile } from "@/lib/social";

type Conversation = {
  id: string;
  partner: SocialProfile;
  lastMessage?: { content?: string | null; type: string; createdAt: string } | null;
  lastActivityAt: string;
};

export default function ChatPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const conversations = await socialApi<Conversation[]>("/conversations");
      setItems(conversations);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-acid/10 text-acid"><MessageCircle /></span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">Safe chat</p>
            <h1 className="text-4xl font-black text-white">Accepted connections</h1>
          </div>
        </div>
        <p className="mt-4 flex max-w-2xl items-start gap-2 text-sm leading-6 text-zinc-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
          Chats unlock only after mutual invite acceptance. Images, voice notes and workout shares are encrypted on disk when uploaded.
        </p>

        {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-950/20 p-4 text-red-300">{error}</p> : null}
        <div className="mt-8 grid gap-4">
          {loading ? (
            [1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-white/[.04]" />)
          ) : items.length ? (
            items.map((item) => (
              <Link key={item.id} href={`/chat/${item.id}`} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4 transition hover:border-acid/40 hover:bg-white/[.07]">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white/5 text-xl font-bold text-white/30">
                  {item.partner.photos?.[0] ? <img src={socialAsset(item.partner.photos[0])} alt="" className="h-full w-full object-cover" /> : item.partner.name?.[0] || "F"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-white">{item.partner.name}</p>
                    {item.partner.verified ? <span className="rounded-full bg-acid/10 px-2 py-0.5 text-xs text-acid">Verified</span> : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-400">
                    {item.lastMessage?.content || (item.lastMessage ? `New ${item.lastMessage.type} message` : "Say hello and plan a workout.")}
                  </p>
                </div>
                <span className="hidden text-xs text-zinc-500 sm:block">{new Date(item.lastActivityAt).toLocaleString()}</span>
              </Link>
            ))
          ) : (
            <EmptyState title="No chats yet" body="Accept an invite from FitSaathi Life to unlock your first safe chat." />
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
