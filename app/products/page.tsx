"use client";

import { AlertCircle, Filter, RotateCcw, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/lib/hooks";

export default function ProductsPage() {
  const products = useProducts();
  const params = useSearchParams();
  const category = params?.get("category") || "";
  const [search, setSearch] = useState(params?.get("search") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [trusted, setTrusted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [max, setMax] = useState(100000);
  const visible = useMemo(() => products.data.filter((product) => (!category || product.category === category) && (!search || `${product.title} ${product.brand} ${product.category}`.toLowerCase().includes(search.toLowerCase())) && (!trusted || product.sellerStatus === "trusted") && (!verified || ["verified", "trusted"].includes(product.sellerStatus || "")) && Number(product.customerPrice || product.price || 0) <= max), [products.data, category, search, trusted, verified, max]);
  function reset() { setSearch(""); setTrusted(false); setVerified(false); setMax(100000); }
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <section className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-acid/[0.05] p-6 sm:p-8 lg:flex-row lg:items-end"><div><p className="text-sm font-medium text-acid">Fitness marketplace</p><h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">{category || "Equipment for your next milestone"}</h1><p className="mt-4 max-w-2xl leading-7 text-zinc-300">Trusted sellers rank first, followed by verified stores, ratings, and real sales.</p></div><button type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)} className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white"><Filter className="h-4 w-4" />{filtersOpen ? "Hide filters" : "Filters"}</button></section>
    <div className="mt-6 flex gap-2"><label className="relative min-w-0 flex-1"><span className="sr-only">Search products</span><Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-zinc-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, brands, or categories" className="field pl-11" /></label></div>
    {filtersOpen ? <section aria-label="Product filters" className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300"><label className="flex items-center gap-2"><input type="checkbox" checked={trusted} onChange={(event) => setTrusted(event.target.checked)} className="accent-acid" />Trusted sellers</label><label className="flex items-center gap-2"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="accent-acid" />Verified sellers</label><label className="flex items-center gap-2">Maximum price ₹<input aria-label="Maximum price" type="number" min="0" value={max} onChange={(event) => setMax(Number(event.target.value || 0))} className="w-28 rounded-lg border border-white/10 bg-ink px-3 py-2 text-white" /></label><button type="button" onClick={reset} className="ml-auto inline-flex items-center gap-2 text-zinc-400 hover:text-white"><RotateCcw className="h-4 w-4" />Reset</button></section> : null}
    <section className="mt-8" aria-live="polite">{products.loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map((item)=><div key={item} className="aspect-[3/4] animate-pulse rounded-2xl bg-white/[0.04]" />)}</div> : products.error ? <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6 text-center"><AlertCircle className="mx-auto text-red-300" /><p className="mt-3 text-red-200">{products.error}</p><button type="button" onClick={products.reload} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">Try again</button></div> : visible.length ? <><p className="mb-4 text-sm text-zinc-400">Showing {visible.length} product{visible.length === 1 ? "" : "s"}</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visible.map((product)=><ProductCard key={product.id} product={product} />)}</div></> : <EmptyState title="No matching products" body="Try changing your filters or check back after sellers add inventory." action={<button type="button" onClick={reset} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Clear filters</button>} />}</section>
  </main>;
}
