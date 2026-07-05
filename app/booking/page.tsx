"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { getCoach, getDojo } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { readJsonResponse } from "@/lib/http";
import { getCoachBaseFee, getPriceBreakdown } from "@/lib/pricing";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, handler: (response: any) => void) => void };
  }
}

export default function BookingPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const processingRef = useRef(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [coachFee, setCoachFee] = useState(0);
  const [providerReady, setProviderReady] = useState(false);
  const breakdown = getPriceBreakdown(coachFee);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const coachId = params.get("coachId");
    const dojoId = params.get("dojoId");
    const id = coachId || dojoId;
    if (!id) {
      setMessage("Choose a coach or dojo before booking.");
      return;
    }
    (coachId ? getCoach(id) : getDojo(id)).then((data) => {
      if (!data) throw new Error("Provider not found.");
      setCoachFee(coachId ? getCoachBaseFee(data) : Number(data.originalPrice ?? data.price ?? 0));
      setProviderReady(true);
    }).catch(() => setMessage("This provider is not currently available for booking."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processingRef.current) return;
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams(window.location.search);

    if (!user) return setMessage("Please log in before creating a booking request.");
    if (!acceptedTerms || !acceptedPrivacy) return setMessage("Please accept the Terms & Conditions and Privacy Policy before booking.");
    const phone = normalizePhone(String(formData.get("phone")));
    if (!isValidIndianPhone(phone)) return setMessage("Enter a valid 10 digit Indian mobile number.");

    setLoading(true);
    processingRef.current = true;
    setMessage("");

    try {
      const paymentResult = await collectPayment({
        targetType: params.get("coachId") ? "coach" : "dojo",
        targetId: params.get("coachId") || params.get("dojoId") || "",
        name: String(formData.get("name")),
        phone,
        email: user.email || ""
      });
      const bookingResponse = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: params.get("coachId") ? "coach" : "dojo",
          targetId: params.get("coachId") || params.get("dojoId"),
          customerName: String(formData.get("name")),
          city: String(formData.get("city")),
          classType: String(formData.get("classType")),
          packageType: String(formData.get("packageType")),
          preferredDate: String(formData.get("preferredDate")),
          preferredTime: String(formData.get("preferredTime")),
          notes: String(formData.get("notes")),
          acceptedTerms: true,
          acceptedPrivacy: true,
          razorpayOrderId: paymentResult.orderId,
        })
      });
      const booking = await readJsonResponse<{ bookingId: string }>(bookingResponse, "Could not create booking.");
      setMessage(`Booking request created and payment marked ${paymentResult.status}. Coach will be notified to accept or reject.`);
      router.push(`/payment-success?bookingId=${encodeURIComponent(booking.bookingId)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create booking right now.");
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-white">Booking request</h1>
      <p className="mt-3 text-zinc-400">
        Home trainer bookings include no refund and one free replacement within the first week. Dojo classes may allow a
        partial first-package refund subject to the published refund policy.
      </p>
      <form onSubmit={submit} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-6">
        <input name="name" required placeholder="Your name" className="field" />
        <input name="phone" required placeholder="Phone number" className="field mt-3" />
        <input name="city" required placeholder="City" className="field mt-3" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select name="classType" required className="field">
            <option value="">Training type</option>
            <option value="home">Home class</option>
            <option value="dojo">Dojo / academy</option>
            <option value="online">Online consultation</option>
          </select>
          <select name="packageType" required className="field">
            <option value="">Package</option>
            <option value="trial">Trial session</option>
            <option value="monthly">Monthly subscription</option>
            <option value="quarterly">Quarterly package</option>
            <option value="custom">Custom plan</option>
          </select>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="preferredDate" type="date" min={new Date().toISOString().slice(0, 10)} required className="field" aria-label="Preferred date" />
          <input name="preferredTime" type="time" required className="field" aria-label="Preferred time" />
        </div>
        <textarea
          name="notes"
          rows={4}
          placeholder="Goals, injuries, preferred schedule, or package questions"
          className="field mt-3"
        />
        <div className="mt-4 rounded-xl border border-white/10 bg-ink p-4">
          <p className="text-sm font-semibold text-white">Payment summary</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatMoney(breakdown.finalPrice)}</p>
          <p className="mt-1 text-sm text-zinc-400">Total payable. Payments are handled securely through FitSaathi.</p>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-zinc-300">
          <PolicyCheck
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            href="/policies/terms"
            label="I accept the Terms & Conditions, including platform payment and attendance rules."
          />
          <PolicyCheck
            checked={acceptedPrivacy}
            onChange={setAcceptedPrivacy}
            href="/policies/privacy"
            label="I accept the Privacy Policy for booking, payment, and contact visibility processing."
          />
        </div>
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          By creating a request, you acknowledge the{" "}
          <Link href="/policies/refunds" className="text-acid">
            Refund Policy
          </Link>
          ,{" "}
          <Link href="/policies/cancellations" className="text-acid">
            Cancellation Policy
          </Link>
          , and{" "}
          <Link href="/policies/fitness-safety" className="text-acid">
            Fitness Safety Disclaimer
          </Link>
          .
        </p>
        <button
          disabled={loading || !providerReady || !acceptedTerms || !acceptedPrivacy}
          className="mt-5 rounded-xl bg-acid px-5 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {loading ? "Processing secure payment…" : "Pay and create booking"}
        </button>
        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
      </form>
    </main>
  );
}

function PolicyCheck({
  checked,
  onChange,
  href,
  label
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  href: string;
  label: string;
}) {
  return (
    <label className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-5 w-5 accent-acid" />
      <span>
        {label}{" "}
        <Link href={href} className="text-acid underline-offset-4 hover:underline">
          Read policy
        </Link>
      </span>
    </label>
  );
}

async function collectPayment({ targetType, targetId, name, phone, email }: { targetType: "coach" | "dojo"; targetId: string; name: string; phone: string; email: string }) {
  const orderResponse = await fetch("/api/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose: "booking", targetType, targetId, receipt: `booking_${Date.now()}` })
  });
  const order = await readJsonResponse<{ id: string; razorpayKeyId: string; amount: number; currency?: string }>(orderResponse, "Could not create Razorpay order.");
  const key = String(order.razorpayKeyId || "");
  if (!key) throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart the app.");

  let verifiedPaymentId = "";
  await new Promise<void>((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Razorpay checkout script is not loaded."));
      return;
    }
    let settled = false;
    const reportFailure = async (reason: string, paymentId = "", errorCode = "") => {
      await fetch("/api/razorpay/failure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, reason, paymentId, errorCode }) }).catch(() => undefined);
    };
    const checkout = new window.Razorpay({
      key,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "FitSaathi",
      description: "Class booking",
      order_id: order.id,
      prefill: { name, email, contact: phone },
      handler: async (response: Record<string, string>) => {
        const verifyResponse = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response)
        });
        const verification = await readJsonResponse<{ verified: boolean; paymentId: string }>(verifyResponse, "Payment signature verification failed.");
        if (!verification.verified) {
          reject(new Error("Payment signature verification failed."));
          return;
        }
        verifiedPaymentId = verification.paymentId;
        settled = true;
        resolve();
      },
      modal: { ondismiss: async () => { if (settled) return; await reportFailure("checkout_dismissed"); reject(new Error("Payment was cancelled. No booking was created; you can retry safely.")); } },
      retry: { enabled: true, max_count: 2 },
      timeout: 600
    });
    checkout.on("payment.failed", async (response: any) => {
      if (settled) return;
      const reason = String(response?.error?.description || response?.error?.reason || "payment_failed");
      await reportFailure(reason, String(response?.error?.metadata?.payment_id || ""), String(response?.error?.code || ""));
    });
    checkout.open();
  });

  return { status: "paid" as const, orderId: order.id as string, paymentId: verifiedPaymentId };
}
