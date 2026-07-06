"use client";

import { CreditCard, Crown, History, IndianRupee, ShieldCheck, Wallet } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ManualUpiPayment } from "@/components/ManualUpiPayment";
import { useSessionUser } from "@/lib/auth-client";
import { localApi } from "@/lib/local-api";
import { formatPaise } from "@/lib/social";

type WalletTransaction = {
  id: string;
  type: string;
  purpose?: string | null;
  amountPaise: number;
  balanceAfterPaise: number;
  status?: string;
  description?: string | null;
  createdAt: string;
};

type WalletData = {
  wallet: { balancePaise: number; active: boolean };
  transactions: WalletTransaction[];
  verification?: { paid: boolean; validUntil?: string | null; verificationStatus: string };
  dailyConnectionFeePaise: number;
};

const quickAmounts = [50, 100, 300, 500, 1000];

export default function WalletPage() {
  const { user } = useSessionUser();
  const [data, setData] = useState<WalletData | null>(null);
  const [message, setMessage] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("100");
  const [premiumPlan, setPremiumPlan] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await localApi<WalletData>("/wallet"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load wallet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submitPayment(event: FormEvent<HTMLFormElement>, purpose: "WALLET_RECHARGE" | "YEARLY_VERIFICATION" | "premium") {
    event.preventDefault();
    if (processing) return;
    if (!user) return setMessage("Please sign in first.");
    const form = new FormData(event.currentTarget);
    form.set("purpose", purpose);
    if (purpose === "WALLET_RECHARGE") form.set("amount", String(Math.round(Number(rechargeAmount))));
    if (purpose === "premium") form.set("plan", premiumPlan);
    setProcessing(true);
    setMessage("");
    try {
      await localApi("/payments/manual", {
        method: "POST",
        body: form
      });
      event.currentTarget.reset();
      setMessage("Payment submitted successfully. Your booking/registration is confirmed.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit payment.");
    } finally {
      setProcessing(false);
    }
  }

  const rechargeRupees = Math.max(0, Math.round(Number(rechargeAmount) || 0));
  const premiumPrice = premiumPlan === "monthly" ? 199 : premiumPlan === "quarterly" ? 499 : 1499;
  const verification = data?.verification;

  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-white/10 bg-white/[.04] p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-acid/10 text-acid"><Wallet /></span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">FitSaathi Wallet</p>
                <h1 className="text-3xl font-black text-white sm:text-4xl">Connection wallet</h1>
              </div>
            </div>
            <div className="mt-8 rounded-2xl border border-acid/20 bg-acid/10 p-6">
              <p className="text-sm text-zinc-400">Available balance</p>
              <p className="mt-2 text-4xl font-black text-white sm:text-5xl">{loading ? "..." : formatPaise(data?.wallet.balancePaise || 0)}</p>
              <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-zinc-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
                Daily chat access charges are {formatPaise(data?.dailyConnectionFeePaise || 500)} for active accepted connections.
              </p>
            </div>

            <form onSubmit={event => submitPayment(event, "WALLET_RECHARGE")} className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-5">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[.18em] text-zinc-500">Recharge amount</span>
                <input type="number" min={10} max={10000} step={1} value={rechargeAmount} onChange={event => setRechargeAmount(event.target.value)} className="field mt-2" />
              </label>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {quickAmounts.map(amount => (
                  <button key={amount} type="button" onClick={() => setRechargeAmount(String(amount))} className="rounded-xl border border-white/10 p-3 text-sm font-semibold text-white hover:border-acid/40">
                    Rs. {amount}
                  </button>
                ))}
              </div>
              <ManualUpiPayment amountLabel={`Rs. ${rechargeRupees}`} className="mt-4" />
              <button disabled={processing} className="mt-4 w-full rounded-xl bg-acid px-5 py-3 font-bold text-ink disabled:opacity-50">I have paid</button>
            </form>
            {message ? <p className="mt-5 rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm text-zinc-300">{message}</p> : null}
          </section>

          <aside className="space-y-6">
            <form onSubmit={event => submitPayment(event, "YEARLY_VERIFICATION")} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-acid" />
                <h2 className="text-2xl font-black text-white">Yearly verification</h2>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-zinc-300">
                <p>Payment <span className="float-right capitalize text-acid">{verification?.paid ? "paid" : "unpaid"}</span></p>
                <p className="mt-2">Review <span className="float-right capitalize text-zinc-300">{verification?.verificationStatus?.replace(/_/g, " ") || "not submitted"}</span></p>
                <p className="mt-2">Valid until <span className="float-right text-zinc-400">{verification?.validUntil ? new Date(verification.validUntil).toLocaleDateString() : "Not paid"}</span></p>
              </div>
              <ManualUpiPayment amountLabel="Rs. 300" className="mt-4" />
              <button disabled={processing} className="mt-4 w-full rounded-xl bg-acid px-4 py-3 text-sm font-bold text-ink disabled:opacity-50">I have paid</button>
            </form>

            <form onSubmit={event => submitPayment(event, "premium")} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
              <div className="flex items-center gap-3">
                <Crown className="text-acid" />
                <h2 className="text-2xl font-black text-white">Premium</h2>
              </div>
              <label className="mt-4 block text-sm font-medium text-zinc-300">
                Plan
                <select value={premiumPlan} onChange={event => setPremiumPlan(event.target.value as typeof premiumPlan)} className="field mt-2">
                  <option value="monthly">Monthly - Rs. 199</option>
                  <option value="quarterly">Quarterly - Rs. 499</option>
                  <option value="annual">Annual - Rs. 1499</option>
                </select>
              </label>
              <ManualUpiPayment amountLabel={`Rs. ${premiumPrice}`} className="mt-4" />
              <button disabled={processing} className="mt-4 w-full rounded-xl bg-acid px-4 py-3 text-sm font-bold text-ink disabled:opacity-50">I have paid</button>
            </form>
          </aside>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.04] p-6 sm:p-7">
          <div className="mb-4 flex items-center gap-3">
            <History className="text-acid" />
            <h2 className="text-2xl font-black text-white">Transaction history</h2>
          </div>
          <div className="grid gap-3">
            {data?.transactions.length ? data.transactions.map(item => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
                <div>
                  <p className="font-semibold capitalize text-white">{transactionTitle(item)}</p>
                  <p className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-zinc-300">{item.status || "success"}</span>
                  <p className={item.amountPaise >= 0 ? "mt-2 font-bold text-emerald-300" : "mt-2 font-bold text-red-300"}>{item.amountPaise >= 0 ? "+" : ""}{formatPaise(item.amountPaise)}</p>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-white/10 p-6 text-zinc-400"><CreditCard className="mb-3 text-acid" />No wallet transactions yet.</div>
            )}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}

function transactionTitle(item: WalletTransaction) {
  return (item.description || item.purpose || item.type).replace(/_/g, " ").toLowerCase();
}
