"use client";

import Link from "next/link";
import { CheckCircle2, Copy, Printer, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { FadeUp } from "@/components/Motion";
import type { Policy, PolicySection } from "@/lib/policies";
import { policies } from "@/lib/policies";

const variantClass: Record<NonNullable<PolicySection["variant"]>, string> = {
  default: "border-white/10 bg-white/[0.05]",
  success: "border-acid/30 bg-acid/[0.08]",
  warning: "border-yellow-300/30 bg-yellow-300/[0.08]",
  danger: "border-red-400/30 bg-red-400/[0.08]",
  verified: "border-verified/40 bg-verified/[0.08]",
  royal: "border-royal/40 bg-royal/[0.08]",
  legendary: "border-legendary/40 bg-legendary/[0.08]"
};

export function PolicyLayout({ policy }: { policy: Policy }) {
  const [query, setQuery] = useState("");
  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return policy.sections;
    return policy.sections.filter((section) => {
      const haystack = [section.title, ...section.body, ...(section.bullets ?? [])].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [policy.sections, query]);

  function copySection(id: string) {
    const url = `${window.location.origin}/policies/${policy.slug}#${id}`;
    void navigator.clipboard?.writeText(url);
  }

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,136,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(155,93,229,0.18),transparent_32%)]" />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <FadeUp>
          <Link href="/policies" className="text-sm font-medium text-acid">
            Policy Center
          </Link>
          <div className="mt-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-acid" />
              Last updated {policy.lastUpdated}
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">{policy.title}</h1>
            <p className="mt-4 text-lg leading-8 text-zinc-300">{policy.summary}</p>
          </div>
        </FadeUp>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search policy"
                className="focus-ring w-full rounded-xl border border-white/10 bg-ink py-3 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500"
              />
            </label>
            <nav aria-label="Policy sections" className="mt-4 grid gap-2">
              {policy.sections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white">
                  {section.title}
                </a>
              ))}
            </nav>
            <button onClick={() => window.print()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-acid/40 hover:text-acid">
              <Printer className="h-4 w-4" />
              Print policy
            </button>
          </div>
        </aside>

        <div className="space-y-5">
          {filteredSections.length ? (
            filteredSections.map((section, index) => (
              <FadeUp key={section.id} delay={Math.min(index * 0.04, 0.2)}>
                <article id={section.id} className={`scroll-mt-28 rounded-2xl border p-6 backdrop-blur-xl ${variantClass[section.variant ?? "default"]}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-acid">Section {index + 1}</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">{section.title}</h2>
                    </div>
                    <button onClick={() => copySection(section.id)} className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:border-acid/40 hover:text-acid" aria-label={`Copy link to ${section.title}`}>
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 space-y-4 text-zinc-300">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="leading-8">
                        {paragraph}
                      </p>
                    ))}
                    {section.bullets ? (
                      <ul className="grid gap-3">
                        {section.bullets.map((item) => (
                          <li key={item} className="flex gap-3">
                            <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-acid" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              </FadeUp>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 text-zinc-300">No sections match your search.</div>
          )}

          <div className="rounded-2xl border border-acid/20 bg-acid/[0.08] p-6">
            <h2 className="text-xl font-semibold text-white">Need help with this policy?</h2>
            <p className="mt-2 text-zinc-300">Contact FitSaathi support for policy questions, refund reviews, data requests, safety reports, or account issues.</p>
            <Link href="/contact" className="mt-5 inline-flex rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white">
              Contact support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export function PolicyFooterLinks() {
  return (
    <footer className="border-t border-white/10 bg-black/20 px-4 py-8">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-4 text-sm text-zinc-400">
        {policies.slice(0, 6).map((policy) => (
          <Link key={policy.slug} href={policy.slug === "privacy" ? "/privacy" : policy.slug === "terms" ? "/terms" : `/policies/${policy.slug}`} className="transition hover:text-acid">
            {policy.title}
          </Link>
        ))}
        <Link href="/contact" className="transition hover:text-acid">Support</Link>
        <Link href="/about" className="transition hover:text-acid">About TheFitSaathi</Link>
      </div>
    </footer>
  );
}
