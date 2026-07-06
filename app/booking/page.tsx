"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ManualUpiPayment } from "@/components/ManualUpiPayment";
import { useSessionUser } from "@/lib/auth-client";
import { getCoach, getDojo } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { readJsonResponse } from "@/lib/http";
import { getCoachBaseFee, getPriceBreakdown } from "@/lib/pricing";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

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
      formData.set("targetType", params.get("coachId") ? "coach" : "dojo");
      formData.set("targetId", params.get("coachId") || params.get("dojoId") || "");
      formData.set("phone", phone);
      formData.set("acceptedTerms", "true");
      formData.set("acceptedPrivacy", "true");
      const bookingResponse = await fetch("/api/bookings/create", {
        method: "POST",
        body: formData
      });
      const booking = await readJsonResponse<{ bookingId: string }>(bookingResponse, "Could not create booking.");
      setMessage("Payment submitted successfully. Your booking/registration is confirmed.");
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
          <p className="mt-1 text-sm text-zinc-400">Total payable. Submit the UPI reference ID after payment.</p>
        </div>
        <ManualUpiPayment amountLabel={formatMoney(breakdown.finalPrice)} className="mt-4" />
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
          {loading ? "Submitting payment..." : "I have paid"}
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
