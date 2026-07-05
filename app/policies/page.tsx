import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { FadeUp } from "@/components/Motion";
import { PolicyFooterLinks } from "@/components/PolicyLayout";
import { policies, POLICY_VERSION, requiredAgreementPolicies } from "@/lib/policies";

export default function PoliciesPage() {
  return (
    <>
      <main className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,136,0.18),transparent_34%),radial-gradient(circle_at_75%_5%,rgba(155,93,229,0.18),transparent_30%)]" />
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-acid" />
              Policy version {POLICY_VERSION}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">FitSaathi Policy Center</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
              Clear rules for customers, coaches, dojo owners, payments, safety, refunds, conduct, and community trust.
            </p>
          </FadeUp>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {policies.map((policy, index) => (
              <FadeUp key={policy.slug} delay={Math.min(index * 0.04, 0.24)}>
                <Link href={`/policies/${policy.slug}`} className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-acid/40 hover:shadow-glow">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-semibold text-white">{policy.title}</h2>
                    <ArrowRight className="h-5 w-5 flex-none text-zinc-500 transition group-hover:text-acid" />
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">{policy.summary}</p>
                  <p className="mt-5 text-xs text-zinc-500">Updated {policy.lastUpdated}</p>
                </Link>
              </FadeUp>
            ))}
          </div>

          <section className="mt-10 rounded-2xl border border-acid/20 bg-acid/[0.08] p-6">
            <h2 className="text-xl font-semibold text-white">Policies required during signup</h2>
            <p className="mt-2 text-zinc-300">New users must agree to these policies before an account is created.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {requiredAgreementPolicies.map((policy) => (
                <Link key={policy.slug} href={`/policies/${policy.slug}`} className="rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-acid/40 hover:text-acid">
                  {policy.title}
                </Link>
              ))}
            </div>
          </section>
        </section>
      </main>
      <PolicyFooterLinks />
    </>
  );
}
