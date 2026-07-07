"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CustomerCareButton } from "@/components/CustomerCareModal";
import { ReportProblemButton } from "@/components/ReportProblem";

export function Footer() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/super-admin-dashboard")) return null;

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <Link href="/home" className="text-lg font-bold text-white">Fit<span className="text-acid">Saathi</span></Link>
          <p className="mt-2 text-sm text-zinc-500">Fitness support, safety, and trusted connections.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-3" aria-label="Footer navigation">
          <Link href="/contact" className="text-sm text-zinc-400 transition hover:text-acid">Contact</Link>
          <Link href="/faq" className="text-sm text-zinc-400 transition hover:text-acid">FAQ</Link>
          <Link href="/policies/privacy" className="text-sm text-zinc-400 transition hover:text-acid">Privacy</Link>
          <Link href="/policies/terms" className="text-sm text-zinc-400 transition hover:text-acid">Terms</Link>
          <CustomerCareButton />
          <ReportProblemButton />
        </nav>
      </div>
    </footer>
  );
}
