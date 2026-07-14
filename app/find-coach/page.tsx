import { Suspense } from "react";
import CoachDirectory from "@/components/CoachDirectory";
import { JsonLd } from "@/components/JsonLd";
import { coachBookingServiceJsonLd, generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Find Fitness Coaches and Dojos Near You - FitSaathi",
  description:
    "Search and book home fitness coaches, personal trainers, yoga trainers, martial arts teachers, and sports coaches near you with FitSaathi.",
  path: "/find-coach",
  keywords: [
    "find coach",
    "fitness coach near me",
    "home fitness coach",
    "personal trainer at home",
    "yoga trainer",
    "martial arts coach",
  ],
});

export default function FindCoachPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...coachBookingServiceJsonLd,
        }}
      />
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <p className="text-sm font-medium text-acid">Find training near you</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Find Fitness Coaches, Gyms and Dojos Near You
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-300">
          Search FitSaathi for personal trainers, martial arts coaches, active gyms and approved sports academies by specialty and city.
        </p>
      </section>
      <Suspense fallback={<DirectoryLoading label="coaches, gyms and dojos" />}>
        <CoachDirectory includeDojos />
      </Suspense>
    </>
  );
}

function DirectoryLoading({ label }: { label: string }) {
  return (
    <p className="mx-auto max-w-7xl px-4 py-12 text-zinc-400 sm:px-6 lg:px-8">
      Loading {label}…
    </p>
  );
}
