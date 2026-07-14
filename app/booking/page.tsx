"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { getCoach, getDojo } from "@/lib/data";
import { readJsonResponse } from "@/lib/http";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

type CreatedBooking = {
  bookingId: string;
  providerName: string;
  status: string;
};

export default function BookingPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const processingRef = useRef(false);
  const idempotencyKeyRef = useRef("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [providerReady, setProviderReady] = useState(false);
  const [providerName, setProviderName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const coachId = params.get("coachId");
    const dojoId = params.get("dojoId");
    const id = coachId || dojoId;
    if (!id) return setMessage("Choose a coach, dojo, or gym before booking.");

    (coachId ? getCoach(id) : getDojo(id))
      .then((provider) => {
        if (!provider) throw new Error("Provider not found.");
        setProviderName(provider.name);
        setProviderReady(true);
      })
      .catch(() => setMessage("This provider is not currently available for booking."));
  }, []);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processingRef.current) return;
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(window.location.search);
    if (!user) return setMessage("Please log in before creating a booking request.");
    if (!acceptedTerms || !acceptedPrivacy) return setMessage("Please accept the Terms & Conditions and Privacy Policy before booking.");
    const phone = normalizePhone(String(form.get("phone")));
    if (!isValidIndianPhone(phone)) return setMessage("Enter a valid 10 digit Indian mobile number.");

    setLoading(true);
    processingRef.current = true;
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
    setMessage("");
    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: params.get("coachId") ? "coach" : "dojo",
          targetId: params.get("coachId") || params.get("dojoId") || "",
          name: String(form.get("name") || ""),
          phone,
          city: String(form.get("city") || ""),
          classType: String(form.get("classType") || ""),
          packageType: String(form.get("packageType") || ""),
          preferredDate: String(form.get("preferredDate") || ""),
          preferredTime: String(form.get("preferredTime") || ""),
          notes: String(form.get("notes") || ""),
          acceptedTerms: true,
          acceptedPrivacy: true,
          idempotencyKey: idempotencyKeyRef.current,
        })
      });
      const booking = await readJsonResponse<CreatedBooking>(response, "Could not create this booking.");
      router.push(`/booking/confirmed?bookingId=${encodeURIComponent(booking.bookingId)}&provider=${encodeURIComponent(booking.providerName)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create this booking.");
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold text-acid">Free booking</p>
      <h1 className="mt-2 text-4xl font-bold text-white">Book {providerName || "your fitness session"}</h1>
      <p className="mt-3 text-zinc-400">Submit your preferred session details. FitSaathi charges nothing for this booking—no payment step, platform fee, or hidden charge.</p>
      <form onSubmit={submitBooking} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-6">
        <div className="rounded-xl border border-acid/30 bg-acid/10 p-4">
          <p className="text-sm font-semibold text-white">Total booking charge</p>
          <p className="mt-1 text-3xl font-bold text-acid">Free</p>
          <p className="mt-1 text-sm text-zinc-300">₹0 today and no hidden platform charges later.</p>
        </div>
        <input name="name" required placeholder="Your name" className="field mt-4" />
        <input name="phone" type="tel" required placeholder="Phone number" className="field mt-3" />
        <input name="city" required placeholder="City" className="field mt-3" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select name="classType" required className="field"><option value="">Training type</option><option value="home">Home class</option><option value="dojo">Dojo / academy / gym</option><option value="online">Online consultation</option></select>
          <select name="packageType" required className="field"><option value="">Session plan</option><option value="trial">Trial session</option><option value="monthly">Monthly plan</option><option value="quarterly">Quarterly plan</option><option value="custom">Custom plan</option></select>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="preferredDate" type="date" min={new Date().toISOString().slice(0, 10)} required className="field" aria-label="Preferred date" />
          <input name="preferredTime" type="time" required className="field" aria-label="Preferred time" />
        </div>
        <textarea name="notes" rows={4} placeholder="Goals, injuries, or preferred schedule" className="field mt-3" />
        <div className="mt-4 grid gap-3 text-sm text-zinc-300">
          <PolicyCheck checked={acceptedTerms} onChange={setAcceptedTerms} href="/policies/terms" label="I accept the Terms & Conditions and attendance rules." />
          <PolicyCheck checked={acceptedPrivacy} onChange={setAcceptedPrivacy} href="/policies/privacy" label="I accept the Privacy Policy for booking and contact processing." />
        </div>
        <button disabled={loading || !providerReady || !acceptedTerms || !acceptedPrivacy} className="mt-5 w-full rounded-xl bg-acid px-5 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">{loading ? "Confirming free booking…" : "Confirm free booking"}</button>
        {message ? <p role="alert" className="mt-4 text-sm text-zinc-300">{message}</p> : null}
      </form>
    </main>
  );
}

function PolicyCheck({ checked, onChange, href, label }: { checked: boolean; onChange: (value: boolean) => void; href: string; label: string }) {
  return <label className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-1 h-5 w-5 accent-acid" /><span>{label} <Link href={href} className="text-acid underline-offset-4 hover:underline">Read policy</Link></span></label>;
}
