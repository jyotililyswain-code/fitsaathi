"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { getCoach, getDojo } from "@/lib/data";
import { todayInIndia } from "@/lib/date";
import { readJsonResponse } from "@/lib/http";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

type CreatedBooking = {
  bookingId: string;
  providerName: string;
  status: string;
  packageType?: string;
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
  const [packageType, setPackageType] = useState("");

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
      router.push(`/booking/confirmed?bookingId=${encodeURIComponent(booking.bookingId)}&provider=${encodeURIComponent(booking.providerName)}&type=${encodeURIComponent(booking.packageType || String(form.get("packageType") || ""))}`);
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
      <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Book {providerName || "your fitness session"}</h1>
      <p className="mt-3 text-zinc-400">Submit your preferred session details. FitSaathi charges nothing for this booking—no payment step, platform fee, or hidden charge.</p>
      <form onSubmit={submitBooking} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-5 sm:p-6">
        <div className="rounded-xl border border-acid/30 bg-acid/10 p-4">
          <p className="text-sm font-semibold text-white">Total booking charge</p>
          <p className="mt-1 text-3xl font-bold text-acid">Free</p>
          <p className="mt-1 text-sm text-zinc-300">₹0 today and no hidden platform charges later.</p>
        </div>
        <label className="mt-4 block text-sm text-zinc-300">Your name<input name="name" required autoComplete="name" placeholder="Enter your name" className="field mt-1" /></label>
        <label className="mt-3 block text-sm text-zinc-300">Phone number<input name="phone" type="tel" required autoComplete="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" placeholder="10 digit mobile number" className="field mt-1" /></label>
        <label className="mt-3 block text-sm text-zinc-300">City<input name="city" required autoComplete="address-level2" placeholder="Your city" className="field mt-1" /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-zinc-300">Training type<select name="classType" required className="field mt-1"><option value="">Choose training type</option><option value="home">Home class</option><option value="dojo">Dojo / academy / gym</option><option value="online">Online consultation</option></select></label>
          <label className="block text-sm text-zinc-300">Session plan<select name="packageType" value={packageType} onChange={event => setPackageType(event.target.value)} required className="field mt-1"><option value="">Choose session plan</option><option value="trial">Trial session</option><option value="monthly">Monthly plan</option><option value="quarterly">Quarterly plan</option><option value="custom">Custom plan</option></select></label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-zinc-300">Preferred date<input name="preferredDate" type="date" min={todayInIndia()} required className="field mt-1" /></label>
          <label className="block text-sm text-zinc-300">Preferred time<input name="preferredTime" type="time" required className="field mt-1" /></label>
        </div>
        <label className="mt-3 block text-sm text-zinc-300">Notes (optional)<textarea name="notes" rows={4} placeholder="Goals, injuries, or preferred schedule" className="field mt-1" /></label>
        {packageType === "trial" ? <p className="mt-4 rounded-xl border border-acid/30 bg-acid/10 p-4 text-sm leading-6 text-zinc-200">After booking this trial, the provider&apos;s contact number will be shared with you so you can coordinate the session.</p> : null}
        <div className="mt-4 grid gap-3 text-sm text-zinc-300">
          <PolicyCheck checked={acceptedTerms} onChange={setAcceptedTerms} href="/terms" label="I accept the Terms & Conditions and attendance rules." />
          <PolicyCheck checked={acceptedPrivacy} onChange={setAcceptedPrivacy} href="/privacy" label="I accept the Privacy Policy for booking and contact processing." />
        </div>
        <button disabled={loading || !providerReady || !acceptedTerms || !acceptedPrivacy} className="mt-5 w-full rounded-xl bg-acid px-5 py-3 font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">{loading ? packageType === "trial" ? "Booking Trial…" : "Confirming free booking…" : packageType === "trial" ? "Book Trial" : "Confirm free booking"}</button>
        {message ? <p role="alert" className="mt-4 text-sm text-zinc-300">{message}</p> : null}
      </form>
    </main>
  );
}

function PolicyCheck({ checked, onChange, href, label }: { checked: boolean; onChange: (value: boolean) => void; href: string; label: string }) {
  return <label className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-1 h-5 w-5 accent-acid" /><span>{label} <Link href={href} className="text-acid underline-offset-4 hover:underline">Read policy</Link></span></label>;
}
