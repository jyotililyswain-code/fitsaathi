"use client";

import Image from "next/image";
import { BadgeCheck, MapPin, Star, Store } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/lib/hooks";
import type { Seller } from "@/lib/marketplace";

export default function SellerProfileClient({
  id,
  initialSeller,
}: {
  id: string;
  initialSeller: Seller;
}) {
  const seller = initialSeller;
  const products = useProducts();
  const inventory = products.data.filter((product) => product.sellerId === id);
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-acid/[0.05] p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center">{seller.profileImage ? <div className="relative h-24 w-24 overflow-hidden rounded-2xl"><Image src={seller.profileImage} alt={seller.storeName} fill unoptimized sizes="96px" className="object-cover" /></div> : <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/10"><Store className="h-10 w-10 text-zinc-500" /></div>}<div><div className="flex flex-wrap gap-2">{seller.trusted ? <Badge text="Trusted Seller" /> : seller.verified ? <Badge text="Verified Seller" /> : null}</div><h1 className="mt-3 text-4xl font-bold text-white">{seller.storeName}</h1><div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400"><span className="inline-flex gap-1"><Star className="h-4 w-4 text-legendary" />{seller.rating || "New"}</span><span>{seller.salesCount || 0} sales</span><span className="inline-flex gap-1"><MapPin className="h-4 w-4" />{seller.address || "India"}</span></div></div></div></section><section className="py-10"><h2 className="text-2xl font-bold text-white">Products from this seller</h2>{products.loading ? <div className="mt-6 h-64 animate-pulse rounded-2xl bg-white/[0.04]" /> : products.error ? <p className="mt-6 text-red-300">{products.error}</p> : inventory.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{inventory.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-6"><EmptyState title="No products yet" body="This seller has no approved products available." /></div>}</section></main>;
}
function Badge({ text }: { text: string }) { return <span className="inline-flex items-center gap-1 rounded-full border border-legendary/30 bg-legendary/10 px-3 py-1 text-xs font-semibold text-legendary"><BadgeCheck className="h-4 w-4" />{text}</span>; }
