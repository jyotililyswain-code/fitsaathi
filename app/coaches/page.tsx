"use client";

import Link from "next/link";
import {
  AlertCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserPlus,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CoachCard } from "@/components/Card";
import { CategorySelect } from "@/components/CategorySelect";
import { EmptyState } from "@/components/EmptyState";
import { useCoaches } from "@/lib/hooks";

export default function CoachesPage() {
  const params = useSearchParams();
  const initialCategory = params?.get("category") || "";
  const initialSearch = params?.get("search") || params?.get("q") || "";
  const coaches = useCoaches();
  const [filtersOpen, setFiltersOpen] = useState(
    Boolean(initialCategory || initialSearch),
  );
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [city, setCity] = useState("");

  const visibleCoaches = useMemo(
    () =>
      coaches.data.filter((coach) => {
        const matchesCategory =
          !category ||
          coach.category?.toLowerCase().includes(category.toLowerCase());
        const matchesSearch =
          !search ||
          `${coach.name} ${coach.category} ${coach.bio || ""}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesCity =
          !city || coach.city?.toLowerCase().includes(city.toLowerCase());
        return matchesCategory && matchesSearch && matchesCity;
      }),
    [category, city, coaches.data, search],
  );

  function resetFilters() {
    setCategory("");
    setSearch("");
    setCity("");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-acid/[0.06] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-acid">Explore coaches</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Find your next fitness coach
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-zinc-300">
              Browse registered trainers by specialty and city. Verification
              status and activity metrics come directly from PostgreSQL records.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2.5 text-sm font-medium text-white transition hover:border-acid/40"
            >
              <SlidersHorizontal className="h-4 w-4" />{" "}
              {filtersOpen ? "Hide filters" : "Filters"}
            </button>
            <Link
              href="/become-a-coach"
              className="inline-flex items-center gap-2 rounded-full bg-acid px-5 py-2.5 text-sm font-semibold text-ink shadow-glow transition hover:bg-white"
            >
              <UserPlus className="h-4 w-4" /> Register as a coach
            </Link>
          </div>
        </div>
      </section>

      {filtersOpen ? (
        <section
          className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
          aria-label="Coach filters"
        >
          <label className="relative">
            <span className="sr-only">Search coaches</span>
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or specialty"
              className="field pl-11"
            />
          </label>
          <CategorySelect
            includeAll
            initialValue={initialCategory}
            onCategoryChange={setCategory}
          />
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Filter by city"
            className="field"
            aria-label="Filter by city"
          />
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </section>
      ) : null}

      <section className="mt-8" aria-live="polite">
        {coaches.loading ? (
          <CoachGridSkeleton />
        ) : coaches.error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-300" />
            <h2 className="mt-3 text-lg font-semibold text-white">
              Coaches could not be loaded
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{coaches.error}</p>
            <button
              type="button"
              onClick={coaches.reload}
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              Try again
            </button>
          </div>
        ) : visibleCoaches.length ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                Showing{" "}
                <strong className="text-white">{visibleCoaches.length}</strong>{" "}
                coach{visibleCoaches.length === 1 ? "" : "es"}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleCoaches.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={
              coaches.data.length
                ? "No coaches match these filters"
                : "No coaches registered yet"
            }
            body={
              coaches.data.length
                ? "Try clearing a filter or searching another specialty or city."
                : "Be the first coach to submit a profile. New registrations appear here immediately with a pending-verification badge."
            }
            action={
              coaches.data.length ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-white"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  href="/become-a-coach"
                  className="rounded-full bg-acid px-5 py-2.5 text-sm font-semibold text-ink"
                >
                  Register as a coach
                </Link>
              )
            }
          />
        )}
      </section>

      <nav
        className="mt-10 flex flex-wrap gap-3 border-t border-white/10 pt-7"
        aria-label="Coach support links"
      >
        <Link
          href="/booking"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
        >
          Book a fitness coach
        </Link>
        <Link
          href="/faq"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
        >
          Read coach booking FAQ
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

function CoachGridSkeleton() {
  return (
    <div
      className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      aria-label="Loading coaches"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
        />
      ))}
    </div>
  );
}
