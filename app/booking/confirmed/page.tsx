import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function BookingConfirmedPage({ searchParams }: { searchParams: Promise<{ bookingId?: string; provider?: string }> }) {
  const { bookingId = "", provider = "your selected provider" } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-acid/30 bg-acid/10 p-6 sm:p-8">
        <CheckCircle2 className="h-11 w-11 text-acid" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[.18em] text-acid">Free booking confirmed</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Your request is with {provider}</h1>
        <p className="mt-3 leading-7 text-zinc-300">TheFitSaathi charged ₹0. There is no payment step, platform fee, or hidden booking charge. The provider can now accept your requested session.</p>
        {bookingId ? <p className="mt-5 break-all rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300"><span className="text-zinc-500">Booking ID</span><br /><strong className="text-white">{bookingId}</strong></p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink">View my bookings</Link>
          <Link href="/find-coach" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white">Explore providers</Link>
        </div>
      </section>
    </main>
  );
}
