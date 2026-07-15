import { Suspense } from "react";
import CoachDirectory from "@/components/CoachDirectory";
import { generateSeoMetadata, hasSearchParameters } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return generateSeoMetadata({
    title: "Browse Fitness Coach Profiles in India",
    description:
      "Browse approved TheFitSaathi coach profiles by specialty and city, including personal trainers, yoga teachers, martial arts coaches and sports instructors.",
    path: "/coaches",
    noIndex: hasSearchParameters(await searchParams),
  });
}

export default function CoachesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <p className="text-sm font-medium text-acid">TheFitSaathi coach directory</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Browse Fitness Coach Profiles in India
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-300">
          Compare approved personal trainers, yoga teachers, martial arts coaches and sports instructors by specialty and city.
        </p>
      </section>
      <Suspense fallback={<p className="mx-auto max-w-7xl px-4 py-12 text-zinc-400 sm:px-6 lg:px-8">Loading fitness coaches…</p>}>
        <CoachDirectory />
      </Suspense>
    </>
  );
}
