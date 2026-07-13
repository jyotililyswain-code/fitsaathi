"use client";

/* eslint-disable @next/next/no-img-element -- profile images are served by the local API */
import { BadgeCheck, CheckCircle2, Circle, Edit3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { socialApi, socialAsset, type SocialProfile } from "@/lib/social";

export default function ProfilePage() {
  const [profile, setProfile] = useState<(SocialProfile & { email?: string; phone?: string }) | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    socialApi<SocialProfile & { email?: string; phone?: string }>("/me")
      .then(setProfile)
      .catch((error) => setError(error instanceof Error ? error.message : "Could not load profile."));
  }, []);

  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {error ? (
          <p className="text-red-300">{error}</p>
        ) : !profile ? (
          <div className="h-80 animate-pulse rounded-3xl bg-white/[.04]" />
        ) : (
          <>
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04]">
              <div className="h-32 bg-gradient-to-r from-acid/20 via-royal/10 to-legendary/20" />
              <div className="px-6 pb-7 sm:px-8">
                <div className="-mt-14 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div className="flex items-end gap-4">
                    <div className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-ink bg-zinc-900">
                      {profile.photos?.[0] ? <img src={socialAsset(profile.photos[0])} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="pb-2">
                      <h1 className="flex items-center gap-2 text-3xl font-black text-white">{profile.name}{profile.verified ? <BadgeCheck className="text-acid" /> : null}</h1>
                      <p className="text-zinc-400">{profile.city || "Location pending"} - {profile.fitnessLevel || "Fitness level pending"}</p>
                    </div>
                  </div>
                  <Link href="/profile/edit" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white"><Edit3 className="h-4 w-4" />Edit profile</Link>
                </div>
                <p className="mt-6 max-w-3xl leading-7 text-zinc-300">{profile.profileBio || "Add a bio to help people understand your fitness journey."}</p>
                {profile.interests?.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {profile.interests.map((interest) => <span key={interest} className="rounded-full border border-acid/20 bg-acid/5 px-3 py-1.5 text-sm text-acid">{interest}</span>)}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-zinc-400">Profile completion</p><p className="mt-1 text-3xl font-black text-white">{profile.profileCompletion?.percent || 0}%</p></div>
                  <ShieldCheck className="h-8 w-8 text-acid" />
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"><div style={{ width: `${profile.profileCompletion?.percent || 0}%` }} className="h-full rounded-full bg-acid transition-all" /></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["photo", "Photo"],
                    ["bio", "Bio"],
                    ["verification", "Identity verification"],
                    ["interests", "Interests"],
                    ["location", "Location"],
                    ["fitnessGoals", "Fitness goals"]
                  ].map(([key, label]) => {
                    const done = Boolean(profile.profileCompletion?.[key]);
                    return <div key={key} className="flex items-center gap-2 text-sm text-zinc-300">{done ? <CheckCircle2 className="h-5 w-5 text-acid" /> : <Circle className="h-5 w-5 text-zinc-600" />}{label}</div>;
                  })}
                </div>
                {!profile.verified ? <Link href="/verification" className="mt-6 inline-flex rounded-full bg-acid px-5 py-3 text-sm font-bold text-ink">Complete verification</Link> : null}
              </div>

              <aside className="rounded-3xl border border-white/10 bg-white/[.04] p-6">
                <div className="flex items-center gap-3"><ShieldCheck className="text-acid" /><h2 className="text-xl font-black text-white">Identity verification</h2></div>
                <p className="mt-4 text-sm leading-6 text-zinc-400">Verification is free. Admin approval unlocks discovery and invitations, with no charges or hidden fees.</p>
                <div className="mt-4 rounded-2xl border border-white/10 p-4 text-sm text-zinc-300">
                  <p>Admin status <span className="float-right capitalize text-acid">{profile.verificationStatus?.replace(/_/g, " ") || "not submitted"}</span></p>
                </div>
                <Link href={profile.verified ? "/life" : "/verification"} className="mt-5 inline-flex w-full justify-center rounded-xl border border-acid/30 px-5 py-3 text-sm font-bold text-acid">{profile.verified ? "Explore verified members" : "Submit verification"}</Link>
              </aside>
            </section>
          </>
        )}
      </main>
    </AuthGuard>
  );
}
