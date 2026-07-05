"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Check, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { formatMoney } from "@/lib/format";
import { localApi } from "@/lib/local-api";
import { customerProductPrice, type Product } from "@/lib/marketplace";

export function ProductCard({ product }: { product: Product }) {
  const { user } = useSessionUser();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");

  async function addToCart() {
    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent(`/products/${product.id}`)}`);
      return;
    }
    setAdding(true);
    setMessage("");
    try {
      await localApi("/cart", { method: "POST", body: JSON.stringify({ productId: product.id, quantity: 1 }) });
      setAdded(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add this product.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] transition hover:-translate-y-1 hover:border-acid/40">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square bg-white/[0.03]">
          {product.imageUrls?.[0] ? <Image src={product.imageUrls[0]} alt={product.title} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-zinc-600">Product image</div>}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">{product.sellerStatus === "trusted" ? <Tag tone="gold">Trusted Seller</Tag> : product.sellerStatus === "verified" ? <Tag>Verified Seller</Tag> : null}{product.bestseller ? <Tag tone="acid">Bestseller</Tag> : null}</div>
          <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">{product.brand || product.category}</p>
          <h3 className="mt-1 line-clamp-2 font-semibold text-white">{product.title}</h3>
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xl font-bold text-white">{formatMoney(customerProductPrice(product))}</span><span className="inline-flex items-center gap-1 text-sm text-zinc-400"><Star className="h-4 w-4 text-legendary" />{product.rating || "New"}</span></div>
          <p className="mt-2 text-xs text-zinc-500">{product.deliveryTime || "Delivery estimate at checkout"}</p>
        </div>
      </Link>
      <button type="button" disabled={product.stock < 1 || adding || added} onClick={addToCart} className="m-4 mt-0 inline-flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl bg-acid px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:bg-zinc-700 disabled:text-zinc-300">
        {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />} {product.stock < 1 ? "Out of stock" : adding ? "Adding..." : added ? "Added to cart" : "Add to cart"}
      </button>
      {message ? <p role="alert" className="mx-4 mb-4 text-xs text-red-300">{message}</p> : null}
    </article>
  );
}

function Tag({ children, tone = "verified" }: { children: React.ReactNode; tone?: "verified" | "gold" | "acid" }) {
  const style = tone === "gold" ? "border-legendary/30 bg-legendary/10 text-legendary" : tone === "acid" ? "border-acid/30 bg-acid/10 text-acid" : "border-verified/30 bg-verified/10 text-verified";
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${style}`}><BadgeCheck className="h-3 w-3" />{children}</span>;
}
