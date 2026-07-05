"use client";

import { Crown, CreditCard, History, IndianRupee, ShieldCheck, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { useSessionUser } from "@/lib/auth-client";
import { localApi } from "@/lib/local-api";
import { formatPaise, socialApi } from "@/lib/social";

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

type VerificationStatus = {
  paid: boolean;
  validUntil?: string | null;
  verificationStatus: string;
  idempotent?: boolean;
};

type WalletData = {
  wallet: { balancePaise: number; active: boolean };
  balancePaise: number;
  transactions: WalletTransaction[];
  verification?: VerificationStatus;
  verificationFeePaise: number;
  minimumRechargePaise: number;
  dailyConnectionFeePaise: number;
};

type RazorpayOrder = {
  razorpayKeyId: string;
  orderId: string;
  amount: number;
  currency: string;
  transactionId: string;
};

type LegacyRazorpayOrder = {
  id: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
};

type RazorpayCheckout = new (options: Record<string, unknown>) => { open: () => void; on: (event: string, handler: (response: any) => void) => void };

declare global {
  interface Window {
    Razorpay?: RazorpayCheckout;
  }
}

const quickAmounts = [50, 100, 300, 500, 1000];

export default function WalletPage() {
  const { user } = useSessionUser();
  const [data, setData] = useState<WalletData | null>(null);
  const [message, setMessage] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("100");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const busy = useRef(false);

  const load = useCallback(async () => {
    try {
      setData(await localApi<WalletData>("/wallet"));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load wallet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function startWalletRecharge(amount: number) {
    if (!Number.isInteger(amount) || amount < 10 || amount > 10000) {
      setMessage("Wallet recharge must be between Rs. 10 and Rs. 10,000.");
      return;
    }
    await guardedPayment(async () => {
      const order = await localApi<RazorpayOrder>("/payments/wallet/create-order", {
        method: "POST",
        body: JSON.stringify({ amount })
      });
      await openCheckout({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        orderId: order.orderId,
        name: "FitSaathi Wallet",
        description: "Wallet recharge",
        verify: (response) => localApi("/payments/wallet/verify", {
          method: "POST",
          body: JSON.stringify({ ...response, transactionId: order.transactionId })
        })
      });
      setMessage("Wallet recharged successfully.");
      await load();
    });
  }

  async function payVerificationFee() {
    await guardedPayment(async () => {
      const order = await localApi<RazorpayOrder>("/payments/verification/create-order", { method: "POST" });
      await openCheckout({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        orderId: order.orderId,
        name: "FitSaathi Verification",
        description: "Yearly verification",
        verify: (response) => localApi("/payments/verification/verify", {
          method: "POST",
          body: JSON.stringify({ ...response, transactionId: order.transactionId })
        })
      });
      setMessage("Yearly verification payment recorded. Admin approval controls the final badge.");
      await load();
    });
  }

  async function payPremium(plan: "monthly" | "quarterly" | "annual") {
    await guardedPayment(async () => {
      const orderResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "premium", plan, receipt: `premium_${Date.now()}` })
      });
      const order = await orderResponse.json() as LegacyRazorpayOrder & { error?: string };
      if (!orderResponse.ok) throw new Error(order.error || "Could not create payment order.");
      const paymentId = await openCheckout({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        orderId: order.id,
        name: "FitSaathi Premium",
        description: "Premium membership",
        verify: async (response) => {
          const verified = await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) });
          const result = await verified.json();
          if (!verified.ok) throw new Error(result.error || "Payment verification failed.");
          return result;
        }
      });
      await socialApi("/premium", { method: "POST", body: JSON.stringify({ razorpayOrderId: order.id, razorpayPaymentId: paymentId, plan }) });
      setMessage("Premium activated successfully.");
      await load();
    });
  }

  async function guardedPayment(action: () => Promise<void>) {
    if (busy.current) return;
    if (!user) return setMessage("Please sign in first.");
    if (!window.Razorpay) return setMessage("Razorpay checkout script is not loaded. Restart the app after configuring payment keys.");
    busy.current = true;
    setProcessing(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment failed.");
    } finally {
      busy.current = false;
      setProcessing(false);
    }
  }

  async function openCheckout({
    key,
    amount,
    currency,
    orderId,
    name,
    description,
    verify
  }: {
    key: string;
    amount: number;
    currency: string;
    orderId: string;
    name: string;
    description: string;
    verify: (response: Record<string, string>) => Promise<unknown>;
  }) {
    if (!key) throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart the app.");
    return new Promise<string>((resolve, reject) => {
      const Razorpay = window.Razorpay;
      if (!Razorpay) return reject(new Error("Razorpay checkout script is not loaded."));
      const checkout = new Razorpay({
        key,
        amount,
        currency: currency || "INR",
        name,
        description,
        order_id: orderId,
        prefill: { name: user?.name, email: user?.email },
        retry: { enabled: true, max_count: 2 },
        handler: async (response: Record<string, string>) => {
          try {
            await verify(response);
            resolve(response.razorpay_payment_id);
          } catch (error) {
            reject(error);
          }
        }
      });
      checkout.on("payment.failed", (response: any) => reject(new Error(String(response?.error?.description || "Payment failed."))));
      checkout.open();
    });
  }

  const parsedAmount = Math.round(Number(rechargeAmount));
  const verification = data?.verification;

  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[.04] p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-acid/10 text-acid"><Wallet /></span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">FitSaathi Wallet</p>
                <h1 className="text-4xl font-black text-white">Connection wallet</h1>
              </div>
            </div>
            <div className="mt-8 rounded-3xl border border-acid/20 bg-gradient-to-br from-acid/15 to-royal/10 p-7">
              <p className="text-sm text-zinc-400">Available balance</p>
              <p className="mt-2 text-5xl font-black text-white">{loading ? "..." : formatPaise(data?.wallet.balancePaise || 0)}</p>
              <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-zinc-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
                Daily chat access charges are {formatPaise(data?.dailyConnectionFeePaise || 500)} for active accepted connections.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[.03] p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-[.18em] text-zinc-500">Recharge amount</span>
                  <input
                    type="number"
                    min={10}
                    max={10000}
                    step={1}
                    value={rechargeAmount}
                    onChange={(event) => setRechargeAmount(event.target.value)}
                    className="field mt-2"
                  />
                </label>
                <button disabled={processing} onClick={() => startWalletRecharge(parsedAmount)} className="mt-5 rounded-2xl bg-acid px-6 py-3 font-bold text-ink disabled:opacity-50 sm:mt-6">
                  Recharge wallet
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-5">
                {quickAmounts.map((amount) => (
                  <button key={amount} disabled={processing} onClick={() => { setRechargeAmount(String(amount)); void startWalletRecharge(amount); }} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-left transition hover:border-acid/40">
                    <IndianRupee className="h-5 w-5 text-acid" />
                    <p className="mt-2 text-xl font-bold text-white">Rs. {amount}</p>
                  </button>
                ))}
              </div>
            </div>
            {message ? <p className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-zinc-300">{message}</p> : null}
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[.04] p-7">
            <div className="rounded-3xl border border-acid/20 bg-acid/5 p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-acid" />
                <h2 className="text-2xl font-black text-white">Yearly verification</h2>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 p-4 text-sm text-zinc-300">
                <p>Payment <span className="float-right capitalize text-acid">{verification?.paid ? "paid" : "unpaid"}</span></p>
                <p className="mt-2">Review <span className="float-right capitalize text-zinc-300">{verification?.verificationStatus?.replace(/_/g, " ") || "not submitted"}</span></p>
                <p className="mt-2">Valid until <span className="float-right text-zinc-400">{verification?.validUntil ? new Date(verification.validUntil).toLocaleDateString() : "Not paid"}</span></p>
              </div>
              <button disabled={processing} onClick={payVerificationFee} className="mt-4 w-full rounded-2xl bg-acid px-4 py-3 text-sm font-bold text-ink disabled:opacity-50">
                Pay Rs. 300 verification fee
              </button>
            </div>

            <div className="mt-7">
              <div className="flex items-center gap-3">
                <Crown className="text-acid" />
                <h2 className="text-2xl font-black text-white">Premium</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  ["monthly", "Monthly", "Rs. 199"],
                  ["quarterly", "Quarterly", "Rs. 499"],
                  ["annual", "Annual", "Rs. 1499"]
                ].map(([plan, label, price]) => (
                  <button key={plan} disabled={processing} onClick={() => payPremium(plan as "monthly" | "quarterly" | "annual")} className="flex items-center justify-between rounded-2xl border border-white/10 p-4 text-left transition hover:border-acid/40">
                    <span><strong className="block text-white">{label}</strong><span className="text-sm text-zinc-400">FitSaathi Premium</span></span>
                    <span className="font-bold text-acid">{price}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-950/10 p-4 text-sm leading-6 text-amber-100">
                Payment activation requires Razorpay keys in <code>.env</code>. Wallet history remains available without live keys.
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.04] p-7">
          <div className="mb-4 flex items-center gap-3">
            <History className="text-acid" />
            <h2 className="text-2xl font-black text-white">Transaction history</h2>
          </div>
          <div className="grid gap-3">
            {data?.transactions.length ? data.transactions.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
                <div>
                  <p className="font-semibold capitalize text-white">{transactionTitle(item)}</p>
                  <p className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleString()}</p>
                  <p className="mt-1 text-xs uppercase tracking-[.16em] text-zinc-500">{item.purpose || item.type}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full border px-3 py-1 text-xs capitalize ${item.status === "pending" || item.status === "processing" ? "border-amber-300/30 text-amber-200" : item.status === "failed" ? "border-red-300/30 text-red-200" : "border-emerald-300/30 text-emerald-200"}`}>
                    {item.status || "success"}
                  </span>
                  <p className={item.amountPaise >= 0 ? "mt-2 font-bold text-emerald-300" : "mt-2 font-bold text-red-300"}>{item.amountPaise >= 0 ? "+" : ""}{formatPaise(item.amountPaise)}</p>
                  <p className="text-xs text-zinc-500">Balance {formatPaise(item.balanceAfterPaise)}</p>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-white/10 p-6 text-zinc-400"><CreditCard className="mb-3 text-acid" />No wallet transactions yet.</div>
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
