import { ArrowRight, LayoutDashboard, Store } from "lucide-react";
import Link from "next/link";

export default function SellerPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[.04] p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[.22em] text-acid">Seller center</p>
        <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">Sell trusted fitness products on FitSaathi.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
          Register as a seller, submit verification details, then manage products and orders from your seller dashboard.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/seller/register" className="rounded-3xl border border-acid/30 bg-acid px-6 py-5 font-bold text-ink transition hover:bg-white">
            <Store className="mb-4 h-7 w-7" />
            Register as Seller
            <span className="mt-3 flex items-center gap-2 text-sm">Start seller onboarding <ArrowRight className="h-4 w-4" /></span>
          </Link>
          <Link href="/seller-dashboard" className="rounded-3xl border border-white/10 bg-white/[.04] px-6 py-5 font-bold text-white transition hover:border-acid/40">
            <LayoutDashboard className="mb-4 h-7 w-7 text-acid" />
            Seller Dashboard
            <span className="mt-3 flex items-center gap-2 text-sm text-zinc-400">Manage store, products and orders <ArrowRight className="h-4 w-4" /></span>
          </Link>
        </div>
      </section>
    </main>
  );
}
