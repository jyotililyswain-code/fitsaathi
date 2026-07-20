"use client";

import { AlertCircle, BadgeCheck, Camera, FileLock2, MapPin, ShieldCheck, UserRoundPen } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { socialApi, type SocialProfile } from "@/lib/social";

export default function CompleteProfilePage() {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    socialApi<SocialProfile>("/me")
      .then(setProfile)
      .catch((error) => setError(error instanceof Error ? error.message : "Could not load profile status."));
  }, []);

  const checks = useMemo(() => {
    const photos = profile?.photos?.length || 0;
    return [
      { label: "Gender selected", done: Boolean(profile?.gender), action: "/profile/edit", helper: "Needed for opposite-gender interest matching." },
      { label: "Date of birth / age added", done: Boolean(profile?.age), action: "/profile/edit", helper: "Used for same-age and up-to-2-years-younger matching." },
      { label: "At least one interest added", done: Boolean(profile?.interests?.length), action: "/profile/edit", helper: "Karate, Gym, Yoga and similar interests power match search." },
      { label: "City and profile basics added", done: Boolean(profile?.city && profile?.profileBio && profile?.fitnessGoal), action: "/profile/edit", helper: "Only safe public details are shown on result cards." },
      { label: "Aadhaar/government ID uploaded", done: Boolean(profile?.verificationStatus === "approved"), action: "/verification", helper: "Stored encrypted and never shown publicly." },
      { label: "Birth certificate / age proof uploaded", done: Boolean(profile?.verificationStatus === "approved"), action: "/verification", helper: "Stored encrypted and used only for admin verification." },
      { label: "Minimum 4 profile photos uploaded", done: photos >= 4, action: "/verification", helper: `${photos}/4 photos uploaded.` },
      { label: "Admin verification approved", done: Boolean(profile?.verified), action: "/verification", helper: "Interest matches appear only after approval." }
    ];
  }, [profile]);

  const completed = checks.filter((item) => item.done).length;
  const percent = Math.round((completed / checks.length) * 100);

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <section className="rounded-[2rem] border border-acid/20 bg-gradient-to-br from-acid/10 via-white/[.04] to-royal/10 p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[.2em] text-acid">
            <ShieldCheck className="h-4 w-4" />
            Interest Match requirements
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">Complete your profile to find matches</h1>
          <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
            FitSaathi only shows verified registered users in Interest Match Search. Private documents stay encrypted and are never returned in public APIs.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-ink/70 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Profile readiness</span>
              <span className="text-acid">{profile ? `${percent}%` : "Checking..."}</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-acid transition-all" style={{ width: profile ? `${percent}%` : "12%" }} />
            </div>
          </div>
        </section>

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-950/20 p-4 text-red-300">{error}</p>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {checks.map((item) => (
            <Link key={item.label} href={item.action} className="group rounded-3xl border border-white/10 bg-white/[.04] p-5 transition hover:border-acid/40 hover:bg-white/[.07]">
              <div className="flex items-start gap-4">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.done ? "bg-acid text-ink" : "bg-white/5 text-zinc-400"}`}>
                  {item.done ? <BadgeCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </span>
                <div>
                  <h2 className="font-bold text-white">{item.label}</h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{item.helper}</p>
                  <span className="mt-3 inline-flex text-sm font-semibold text-acid">{item.done ? "Review" : "Complete now"}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <ActionCard icon={<UserRoundPen />} title="Edit profile" body="Set gender, birth date, city, bio, goals and interests." href="/profile/edit" />
          <ActionCard icon={<FileLock2 />} title="Upload documents" body="Submit Aadhaar/government ID, age proof and selfie securely." href="/verification" />
          <ActionCard icon={<Camera />} title="Add 4 photos" body="Upload profile photos during verification so admins can review safely." href="/verification" />
        </section>

        <p className="mt-8 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm leading-6 text-zinc-400">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
          Once these checks are complete and approved, return to the homepage and use “Find Your Fitness Partner by Interest”.
        </p>
      </main>
    </AuthGuard>
  );
}

function ActionCard({ icon, title, body, href }: { icon: ReactNode; title: string; body: string; href: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-white/10 bg-white/[.04] p-5 transition hover:border-acid/40">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-acid/10 text-acid">{icon}</span>
      <h2 className="mt-4 font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
    </Link>
  );
}
