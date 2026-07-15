"use client";

import Link from "next/link";
import {
  ArrowRight,
  Dumbbell,
  HeartPulse,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { FadeUp } from "@/components/Motion";
import { useProducts, useSellers } from "@/lib/hooks";

const categories = [
  "Gym Equipment",
  "Supplements",
  "Protein",
  "Healthy Foods",
  "Accessories",
  "Yoga",
  "Recovery",
  "Wearables",
];

export default function MarketplacePage() {
  const products = useProducts();
  const sellers = useSellers();
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
        <FadeUp>
          <p className="inline-flex rounded-full border border-acid/30 bg-acid/10 px-4 py-2 text-sm text-acid">
            TheFitSaathi Marketplace
          </p>
          <h1 className="mt-5 text-5xl font-bold leading-tight text-white sm:text-6xl">
            Stronger gear.
            <br />
            <span className="text-acid">Trusted sellers.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
            Shop verified fitness equipment, nutrition, recovery tools, yoga
            essentials and smart wearables.
          </p>
          <div className="mt-8 flex max-w-2xl gap-2 rounded-2xl border border-white/10 bg-white/[.05] p-2">
            <Search className="ml-3 mt-3 h-5 w-5 text-zinc-500" />
            <input
              className="min-w-0 flex-1 bg-transparent px-2 text-white outline-none"
              placeholder="Search products, brands and categories"
            />
            <Link
              href="/products"
              className="rounded-xl bg-acid px-5 py-3 font-semibold text-ink"
            >
              Search
            </Link>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="grid h-full grid-cols-2 gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-acid/15 to-royal/10 p-6">
            <HeroStat
              icon={<ShieldCheck />}
              value={sellers.data.filter((s) => s.verified || s.trusted).length}
              label="Verified sellers"
            />
            <HeroStat
              icon={<Dumbbell />}
              value={products.data.length}
              label="Fitness products"
            />
            <HeroStat
              icon={<HeartPulse />}
              value="Manual UPI"
              label="Admin verified"
            />
            <HeroStat
              icon={<Sparkles />}
              value="Curated"
              label="Quality marketplace"
            />
          </div>
        </FadeUp>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-acid">Shop by goal</p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              Fitness categories
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-2 text-sm text-acid sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/products?category=${encodeURIComponent(category)}`}
              className="rounded-2xl border border-white/10 bg-white/[.04] p-5 font-medium text-white transition hover:border-acid/40 hover:bg-acid/10"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-acid">Ranked by trust and quality</p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              Featured products
            </h2>
          </div>
          <Link href="/products" className="text-sm text-acid">
            Browse marketplace
          </Link>
        </div>
        <div className="mt-6">
          {products.data.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.data.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Marketplace products are coming"
              body="Approved seller products will appear here automatically."
            />
          )}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-acid/20 bg-acid/10 p-8 sm:p-12">
          <h2 className="text-3xl font-bold text-white">
            Sell fitness products on TheFitSaathi
          </h2>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Build your store, get verified and manage products, inventory,
            orders and earnings from one dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register-seller"
              className="inline-flex rounded-full bg-acid px-6 py-3 font-semibold text-ink"
            >
              Register as a fitness seller
            </Link>
            <Link
              href="/contact"
              className="inline-flex rounded-full border border-white/15 px-6 py-3 font-semibold text-white transition hover:border-acid/50 hover:text-acid"
            >
              Contact seller support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
function HeroStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink/60 p-5 text-white">
      <div className="text-acid">{icon}</div>
      <p className="mt-5 text-2xl font-bold">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}
