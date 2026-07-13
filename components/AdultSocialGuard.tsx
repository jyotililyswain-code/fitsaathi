"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { MATCH_MAKING_AGE_MESSAGE } from "@/lib/age-eligibility";
import { socialApi } from "@/lib/social";
import { AuthGuard } from "@/components/AuthGuard";

type Eligibility = { eligible: boolean; age: number | null; minimumAge: number };

export function AdultSocialGuard({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <EligibilityBoundary>{children}</EligibilityBoundary>
    </AuthGuard>
  );
}

function EligibilityBoundary({ children }: { children: ReactNode }) {
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    socialApi<Eligibility>("/eligibility")
      .then((result) => setEligible(result.eligible))
      .catch((requestError) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not check Match Making eligibility.",
        ),
      );
  }, []);

  if (error) {
    return <AccessMessage message={error} />;
  }
  if (eligible == null) {
    return <main className="mx-auto max-w-3xl px-4 py-12 text-zinc-300">Checking Match Making eligibility...</main>;
  }
  if (!eligible) {
    return <AccessMessage message={MATCH_MAKING_AGE_MESSAGE} />;
  }
  return <>{children}</>;
}

function AccessMessage({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <section className="rounded-2xl border border-amber-400/20 bg-white/[0.05] p-6">
        <h1 className="text-3xl font-bold text-white">Match Making unavailable</h1>
        <p role="alert" className="mt-3 leading-7 text-zinc-300">{message}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">Your FitSaathi account and all other website features remain available.</p>
      </section>
    </main>
  );
}
