"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
      <section className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6">
        <AlertTriangle className="h-8 w-8 text-red-300" />
        <h1 className="mt-4 text-3xl font-bold text-white">Something went wrong</h1>
        <p className="mt-3 leading-7 text-zinc-300">FitSaathi could not finish loading this view. You can retry or contact support if it keeps happening.</p>
        {error.digest ? <p className="mt-3 text-xs text-zinc-500">Error reference: {error.digest}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={reset} className="min-h-11 rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white">
            Retry
          </button>
          <Link href="/contact" className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-acid/40 hover:text-acid">
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}
