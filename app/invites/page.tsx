"use client";

/* eslint-disable @next/next/no-img-element -- social photos are served by the local API */
import { Check, Clock3, UserRoundCheck, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { useSessionUser } from "@/lib/auth-client";
import { socialApi, socialAsset } from "@/lib/social";

type Invite = {
  id: string;
  senderId: string;
  recipientId: string;
  status: "pending" | "accepted" | "rejected" | "blocked" | "disconnected";
  message?: string | null;
  sender?: { id: string; name: string; profilePhotos?: Array<{ path: string }> };
  recipient?: { id: string; name: string; profilePhotos?: Array<{ path: string }> };
};

export default function InvitesPage() {
  const { user } = useSessionUser();
  const [items, setItems] = useState<Invite[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    return socialApi<Invite[]>("/invites").then(setItems).catch((error) => setError(error instanceof Error ? error.message : "Could not load invites."));
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function respond(id: string, status: "accepted" | "rejected") {
    try {
      await socialApi(`/invites/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update invite.");
    }
  }

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">Connections</p>
        <h1 className="mt-2 text-4xl font-black text-white">Fitness invites</h1>
        <p className="mt-3 text-zinc-400">Chat unlocks only after an invite is accepted.</p>
        {error ? <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-950/20 p-4 text-red-300">{error}</p> : null}
        <div className="mt-8 grid gap-4">
          {items.length ? items.map((item) => {
            const incoming = item.recipientId === user?.id;
            const person = incoming ? item.sender : item.recipient;
            return (
              <article key={item.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white/5 text-lg font-bold text-white/30">
                    {person?.profilePhotos?.[0]?.path ? <img src={socialAsset(person.profilePhotos[0].path)} alt="" className="h-full w-full object-cover" /> : person?.name?.[0] || "F"}
                  </div>
                  <div>
                    <p className="font-bold text-white">{person?.name || "TheFitSaathi member"}</p>
                    <p className="text-sm text-zinc-400">{item.message || "Fitness connection invite"}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs capitalize text-acid">
                      <Clock3 className="h-3 w-3" />
                      {incoming ? "Incoming" : "Sent"} · {item.status}
                    </p>
                  </div>
                </div>
                {incoming && item.status === "pending" ? (
                  <div className="flex gap-2">
                    <button onClick={() => respond(item.id, "accepted")} className="inline-flex items-center gap-1 rounded-full bg-acid px-4 py-2 text-sm font-bold text-ink">
                      <Check className="h-4 w-4" />Accept
                    </button>
                    <button onClick={() => respond(item.id, "rejected")} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                      <X className="h-4 w-4" />Reject
                    </button>
                  </div>
                ) : item.status === "accepted" ? (
                  <Link href="/chat" className="inline-flex items-center gap-2 text-sm font-semibold text-acid">
                    <UserRoundCheck className="h-4 w-4" />Open chat
                  </Link>
                ) : null}
              </article>
            );
          }) : (
            <EmptyState title="No invites yet" body="Explore TheFitSaathi Life and invite someone with shared interests." />
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
