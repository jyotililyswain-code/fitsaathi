"use client";

import Link from "next/link";
import { AlertCircle, Building2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { DojoCard } from "@/components/Card";
import { CategorySelect } from "@/components/CategorySelect";
import { EmptyState } from "@/components/EmptyState";
import { useDojos } from "@/lib/hooks";

export default function DojosPage() {
  const params = useSearchParams();
  const initialCategory = params?.get("category") || "";
  const initialSearch = params?.get("search") || "";
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const dojos = useDojos(false, { search, category });
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-royal/[0.08] p-6 sm:p-8">
        <p className="text-sm font-medium text-acid">Explore dojos</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Martial arts and fitness academies
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-300">
          Discover registered academies with transparent approval status and
          real activity data.
        </p>
        <Link
          href="/register-dojo"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink"
        >
          <Building2 className="h-4 w-4" />
          Register Dojo / Gym
        </Link>
      </section>
      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search dojos, city or category"
          className="field"
        />
        <CategorySelect
          includeAll
          initialValue={initialCategory}
          onCategoryChange={setCategory}
        />
      </div>
      <section className="mt-8" aria-live="polite">
        {dojos.loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-2xl bg-white/[0.04]"
              />
            ))}
          </div>
        ) : dojos.error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6 text-center">
            <AlertCircle className="mx-auto text-red-300" />
            <p className="mt-3 text-red-200">{dojos.error}</p>
            <button
              type="button"
              onClick={dojos.reload}
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              Try again
            </button>
          </div>
        ) : dojos.data.length ? (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              Showing {dojos.data.length} dojo
              {dojos.data.length === 1 ? "" : "s"}
            </p>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {dojos.data.map((dojo) => (
                <DojoCard key={dojo.id} dojo={dojo} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={
              search || category
                ? "No matching dojo found"
                : "No active dojos or gyms yet"
            }
            body={
              search || category
                ? "Try another name, city, sport, or category."
                : "Valid registrations appear here immediately after secure upload and payment checks complete."
            }
            action={
              <Link
                href="/register-dojo"
                className="rounded-full bg-acid px-5 py-2.5 text-sm font-semibold text-ink"
              >
                Register Dojo / Gym
              </Link>
            }
          />
        )}
      </section>
      <nav
        className="mt-10 flex flex-wrap gap-3 border-t border-white/10 pt-7"
        aria-label="Dojo support links"
      >
        <Link
          href="/booking"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
        >
          Book dojo classes
        </Link>
        <Link
          href="/register-dojo"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
        >
          Register your dojo or gym
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
        >
          Contact FitSaathi support
        </Link>
      </nav>
    </main>
  );
}
