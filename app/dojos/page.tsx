import { Suspense } from "react";
import DojoDirectory from "@/components/DojoDirectory";
import { generateSeoMetadata, hasSearchParameters } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return generateSeoMetadata({
    title: "Find Dojos and Martial Arts Academies",
    description:
      "Explore public dojo, gym and martial arts academy profiles for supported training options on FitSaathi.",
    path: "/dojos",
    noIndex: hasSearchParameters(await searchParams),
    noFollow: false,
  });
}

export default function DojosPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <p className="text-sm font-medium text-acid">FitSaathi academy directory</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Discover Dojos, Gyms and Sports Academies
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-300">
          Explore active martial arts schools, gyms, yoga studios and fitness academies with accurate, approved profiles.
        </p>
      </section>
      <Suspense fallback={<p className="mx-auto max-w-7xl px-4 py-12 text-zinc-400 sm:px-6 lg:px-8">Loading dojos, gyms and academies…</p>}>
        <DojoDirectory />
      </Suspense>
    </>
  );
}
