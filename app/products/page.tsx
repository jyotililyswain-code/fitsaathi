import { Suspense } from "react";
import ProductDirectory from "@/components/ProductDirectory";
import { generateSeoMetadata, hasSearchParameters } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return generateSeoMetadata({
    title: "Fitness Products and Sports Equipment",
    description:
      "Browse approved fitness products, gym equipment, martial arts gear and training essentials from FitSaathi sellers.",
    path: "/products",
    noIndex: hasSearchParameters(await searchParams),
    noFollow: false,
  });
}

export default function ProductsPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <p className="text-sm font-medium text-acid">FitSaathi fitness shop</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Shop Fitness Products and Sports Equipment
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-300">
          Browse approved gym equipment, martial arts gear, recovery products and training essentials from FitSaathi sellers.
        </p>
      </section>
      <Suspense fallback={<p className="mx-auto max-w-7xl px-4 py-12 text-zinc-400 sm:px-6 lg:px-8">Loading fitness products…</p>}>
        <ProductDirectory />
      </Suspense>
    </>
  );
}
