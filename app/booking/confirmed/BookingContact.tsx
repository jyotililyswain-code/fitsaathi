"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJsonResponse } from "@/lib/http";

type ContactResult = { success: boolean; contact: { name: string; phone: string }; booking: { id: string; status: string; providerName: string; service: string; date: string; time?: string | null; address?: string } };

export default function BookingContact({ bookingId }: { bookingId: string }) {
  const [result, setResult] = useState<ContactResult | null>(null);
  const [message, setMessage] = useState("Loading your provider contact...");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${encodeURIComponent(bookingId)}/contact`, { credentials: "include", cache: "no-store" })
      .then(response => readJsonResponse<ContactResult>(response, "Could not load the provider contact."))
      .then(value => { setResult(value); setMessage(""); })
      .catch(error => setMessage(error instanceof Error ? error.message : "Could not load the provider contact."));
  }, [bookingId]);
  if (message) return <p className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">{message}</p>;
  if (!result) return null;
  const copy = async () => { await navigator.clipboard?.writeText(result.contact.phone); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  return <section className="mt-5 rounded-2xl border border-acid/30 bg-black/20 p-5"><h2 className="text-lg font-semibold text-white">Contact the provider</h2><dl className="mt-4 grid gap-2 text-sm text-zinc-300"><div><dt className="text-zinc-500">Provider</dt><dd>{result.booking.providerName}</dd></div><div><dt className="text-zinc-500">Contact person</dt><dd>{result.contact.name}</dd></div><div><dt className="text-zinc-500">Phone</dt><dd className="text-lg font-semibold text-acid">{result.contact.phone}</dd></div><div><dt className="text-zinc-500">Trial</dt><dd>{result.booking.date} {result.booking.time || ""} · {result.booking.service}</dd></div>{result.booking.address ? <div><dt className="text-zinc-500">Location</dt><dd>{result.booking.address}</dd></div> : null}</dl><div className="mt-5 flex flex-wrap gap-2"><a href={`tel:${result.contact.phone}`} className="rounded-full bg-acid px-4 py-2 text-sm font-semibold text-ink">Call Now</a><button type="button" onClick={() => void copy()} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">{copied ? "Copied" : "Copy Number"}</button>{result.booking.address ? <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.booking.address)}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Get Directions</a> : null}<Link href={`/dashboard?booking=${encodeURIComponent(result.booking.id)}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">View Booking</Link></div></section>;
}
