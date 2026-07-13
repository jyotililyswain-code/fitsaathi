"use client";

import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { SocialProfileCard } from "@/components/SocialProfileCard";
import { SOCIAL_INTERESTS, socialApi, type SocialProfile } from "@/lib/social";

export default function LifePage() {
  const searchParams = useSearchParams();
  const initialInterest = searchParams?.get("interest") || "";
  const initialGender = searchParams?.get("gender") || "";
  const initialCity = searchParams?.get("city") || "";
  const initialSort = searchParams?.get("sort") || "active";
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [range, setRange] = useState({ min: 18, max: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (params = "") => {
    setLoading(true);
    setError("");
    try {
      const data = await socialApi<{ items: SocialProfile[]; suggestedAgeRange: { min: number; max: number } }>(`/discover${params ? `?${params}` : ""}`);
      setProfiles(data.items);
      setRange(data.suggestedAgeRange);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load matches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(searchParams?.toString() || ""); }, [load, searchParams]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    for (const [key, value] of form.entries()) if (String(value)) query.set(key, String(value));
    void load(query.toString());
  }

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.22em] text-acid">FitSaathi Life</p>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-6xl">Find your people.</h1>
            <p className="mt-3 text-zinc-400">Search verified members by fitness interest for free. Phone numbers stay private until an invite is accepted.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 text-sm text-zinc-300">
            Suggested age <strong className="text-white">{range.min}–{range.max}</strong>
          </div>
        </div>
        <form onSubmit={submit} className="mt-8 rounded-3xl border border-white/10 bg-white/[.04] p-5">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <label className="relative lg:col-span-2">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
              <input name="interest" list="fitness-interest-options" defaultValue={initialInterest} placeholder="Search interest, e.g. Karate or Kho Kho" className="field pl-10" />
              <datalist id="fitness-interest-options">
                {SOCIAL_INTERESTS.map((item) => <option key={item} value={item} />)}
              </datalist>
            </label>
            <select name="gender" defaultValue={initialGender} className="field">
              <option value="">Any gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input name="city" defaultValue={initialCity} placeholder="City" className="field" />
            <select name="sort" defaultValue={initialSort} className="field">
              <option value="active">Most active</option>
              <option value="nearest">Nearest</option>
              <option value="newest">Newest</option>
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-acid px-4 font-bold text-ink">
              <Filter className="h-4 w-4" />Search
            </button>
          </div>
          <details className="mt-4">
            <summary className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400"><SlidersHorizontal className="h-4 w-4" />Advanced filters</summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input name="ageMin" type="number" min="18" max="100" defaultValue={searchParams?.get("ageMin") || ""} placeholder="Min age" className="field" />
              <input name="ageMax" type="number" min="18" max="100" defaultValue={searchParams?.get("ageMax") || ""} placeholder="Max age" className="field" />
              <input name="distance" type="number" min="1" max="1000" defaultValue={searchParams?.get("distance") || ""} placeholder="Distance km" className="field" />
              <div className="rounded-xl border border-acid/20 bg-acid/5 px-4 py-3 text-sm text-acid">Verified members · free access</div>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-zinc-300"><input name="online" value="true" defaultChecked={searchParams?.get("online") === "true"} type="checkbox" />Online now</label>
            </div>
          </details>
        </form>
        {error ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 p-5 text-red-300">{error}</div>
        ) : loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[30rem] animate-pulse rounded-3xl bg-white/[.04]" />)}</div>
        ) : profiles.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{profiles.map((profile) => <SocialProfileCard key={profile.id} profile={profile} />)}</div>
        ) : (
          <div className="mt-8"><EmptyState title="No matches yet" body="Try a broader interest, age range or city. Only profiles that meet your current safety filters appear." /></div>
        )}
      </main>
    </AuthGuard>
  );
}
