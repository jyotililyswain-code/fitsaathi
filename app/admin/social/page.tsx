"use client";

import { BadgeCheck, BarChart3, Crown, FileWarning, MessageSquare, ShieldAlert, WalletCards } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { formatPaise, socialApi, socialAsset } from "@/lib/social";

type Overview = {
  users: number;
  pendingVerification: number;
  wallets: { _count: number; _sum: { balancePaise: number | null } };
  reports: number;
  conversations: number;
  premium: number;
  moderation: number;
  emergency: number;
};

export default function SocialAdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [moderation, setModeration] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [premium, setPremium] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [overview, verifications, moderation, reports, wallets, conversations, premium, analytics] = await Promise.all([
        socialApi<Overview>("/admin/overview"),
        socialApi<any[]>("/admin/verifications"),
        socialApi<any[]>("/admin/moderation"),
        socialApi<any[]>("/admin/reports"),
        socialApi<any[]>("/admin/wallets"),
        socialApi<any[]>("/admin/conversations"),
        socialApi<any[]>("/admin/premium"),
        socialApi<any>("/admin/analytics")
      ]);
      setOverview(overview);
      setVerifications(verifications);
      setModeration(moderation);
      setReports(reports);
      setWallets(wallets);
      setConversations(conversations);
      setPremium(premium);
      setAnalytics(analytics);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load social admin.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function reviewVerification(id: string, status: "approved" | "rejected" | "needs_review") {
    const rejectionReason = status === "rejected" ? window.prompt("Reason shown to the user:") || "Verification rejected." : undefined;
    await socialApi(`/admin/verifications/${id}`, { method: "PATCH", body: JSON.stringify({ status, rejectionReason }) });
    await load();
  }

  async function resolveModeration(id: string, status: "clean" | "blocked") {
    await socialApi(`/admin/moderation/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }

  async function updateReport(id: string, status: string) {
    await socialApi(`/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  }

  return (
    <AuthGuard role="admin">
      <main className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">PostgreSQL social operations</p>
        <h1 className="mt-2 text-4xl font-black text-white">FitSaathi Life Admin</h1>
        <p className="mt-3 max-w-3xl text-zinc-400">Manage verified users, reports, wallets, chats, premium and safety queues. Private verification files are encrypted at rest and only available here to admins.</p>
        {message ? <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-950/20 p-4 text-red-300">{message}</p> : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Metric icon={<BadgeCheck />} label="Users" value={overview?.users ?? "..."} />
          <Metric icon={<FileWarning />} label="Verify queue" value={overview?.pendingVerification ?? "..."} />
          <Metric icon={<WalletCards />} label="Wallet balance" value={overview ? formatPaise(overview.wallets._sum.balancePaise || 0) : "..."} />
          <Metric icon={<ShieldAlert />} label="Open reports" value={overview?.reports ?? "..."} />
          <Metric icon={<MessageSquare />} label="Active chats" value={overview?.conversations ?? "..."} />
          <Metric icon={<Crown />} label="Premium" value={overview?.premium ?? "..."} />
          <Metric icon={<BarChart3 />} label="Flagged" value={overview?.moderation ?? "..."} />
          <Metric icon={<ShieldAlert />} label="Emergency" value={overview?.emergency ?? "..."} />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <Panel title="Verification queue">
            {verifications.length ? verifications.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{item.user?.name} <span className="text-xs capitalize text-acid">{item.status}</span></p>
                    <p className="text-sm text-zinc-400">{item.user?.email} · {item.user?.city || "No city"} · risk {item.riskScore}</p>
                    <p className="mt-1 text-xs text-zinc-500">Payment {item.paymentStatus || "unpaid"}{item.expiresAt ? ` - expires ${new Date(item.expiresAt).toLocaleDateString()}` : ""}</p>
                    <p className="mt-2 text-xs text-zinc-500">{item.automatedNotes || "No automated notes."}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {["government", "aadhaarBack", "age", "selfie", "video"].map((kind) => (
                      <a key={kind} href={socialAsset(`/api/social/admin/verifications/${item.id}/file/${kind}`)} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">{kind}</a>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => reviewVerification(item.id, "approved")} className="rounded-full bg-acid px-4 py-2 text-sm font-bold text-ink">Approve</button>
                  <button onClick={() => reviewVerification(item.id, "needs_review")} className="rounded-full border border-amber-400/30 px-4 py-2 text-sm text-amber-200">Needs review</button>
                  <button onClick={() => reviewVerification(item.id, "rejected")} className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-200">Reject</button>
                </div>
              </article>
            )) : <EmptyLine text="No verification submissions yet." />}
          </Panel>

          <Panel title="AI moderation and reports">
            <div className="grid gap-3">
              {moderation.slice(0, 8).map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-semibold text-white">{item.category} · risk {item.riskScore}</p>
                  <p className="text-xs text-zinc-500">{item.targetType} · {item.status}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => resolveModeration(item.id, "clean")} className="rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-200">Mark clean</button>
                    <button onClick={() => resolveModeration(item.id, "blocked")} className="rounded-full border border-red-400/30 px-3 py-1 text-xs text-red-200">Block</button>
                  </div>
                </article>
              ))}
              {reports.slice(0, 8).map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-semibold text-white">{item.type} report · {item.status}</p>
                  <p className="text-sm text-zinc-400">{item.reason}</p>
                  <div className="mt-3 flex gap-2">
                    {["reviewing", "resolved", "dismissed"].map((status) => <button key={status} onClick={() => updateReport(item.id, status)} className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-zinc-300">{status}</button>)}
                  </div>
                </article>
              ))}
              {!moderation.length && !reports.length ? <EmptyLine text="No moderation or report records." /> : null}
            </div>
          </Panel>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <Panel title="Wallets">
            {wallets.slice(0, 12).map((item) => <Row key={item.id} title={item.user?.name || "Member"} meta={item.user?.email || item.userId} value={formatPaise(item.balancePaise)} />)}
            {!wallets.length ? <EmptyLine text="No wallets yet." /> : null}
          </Panel>
          <Panel title="Chats">
            {conversations.slice(0, 12).map((item) => <Row key={item.id} title={`${item.userOne?.name} ↔ ${item.userTwo?.name}`} meta={`${item._count?.messages || 0} messages`} value={item.active ? "Active" : "Closed"} />)}
            {!conversations.length ? <EmptyLine text="No accepted chats yet." /> : null}
          </Panel>
          <Panel title="Premium and analytics">
            <div className="grid gap-3 text-sm text-zinc-300">
              <Row title="30-day new users" meta="Analytics" value={analytics?.newUsers ?? "..."} />
              <Row title="30-day messages" meta="Analytics" value={analytics?.messages ?? "..."} />
              <Row title="Wallet volume" meta="30 days" value={analytics ? formatPaise(analytics.walletVolumePaise) : "..."} />
              <Row title="Premium revenue" meta="30 days" value={analytics ? formatPaise(analytics.premiumRevenuePaise) : "..."} />
              <Row title="Active subscriptions" meta="Current" value={premium.length} />
            </div>
          </Panel>
        </section>
      </main>
    </AuthGuard>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="text-acid">{icon}</div><p className="mt-3 truncate text-2xl font-black text-white">{value}</p><p className="text-xs text-zinc-400">{label}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-white/10 bg-white/[.04] p-5"><h2 className="mb-4 text-xl font-black text-white">{title}</h2><div className="space-y-3">{children}</div></section>;
}

function Row({ title, meta, value }: { title: string; meta: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 p-3"><span className="min-w-0"><strong className="block truncate text-white">{title}</strong><span className="text-xs text-zinc-500">{meta}</span></span><span className="shrink-0 text-sm font-semibold text-acid">{value}</span></div>;
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-2xl border border-white/10 p-4 text-sm text-zinc-500">{text}</p>;
}
