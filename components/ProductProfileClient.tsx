"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { EmptyState } from "@/components/EmptyState";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { useProduct } from "@/lib/hooks";
import { customerProductPrice } from "@/lib/marketplace";
import type { Product } from "@/lib/marketplace";

export default function ProductProfileClient({
  id,
  initialProduct,
}: {
  id: string;
  initialProduct: Product;
}) {
  const product = useProduct(id, initialProduct);
  const cart = useCart();
  const [message, setMessage] = useState("");
  if (product.loading && !product.data) return <main className="mx-auto max-w-7xl px-4 py-12"><div className="h-[32rem] animate-pulse rounded-3xl bg-white/[0.04]" /></main>;
  if (product.error) return <main className="mx-auto max-w-5xl px-4 py-16"><EmptyState title="Product could not be loaded" body={product.error} action={<button onClick={product.reload} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">Try again</button>} /></main>;
  if (!product.data) return <main className="mx-auto max-w-5xl px-4 py-16"><EmptyState title="Product not found" body="This product may have been removed or is awaiting approval." /></main>;
  const item = product.data;
  async function addToCart() { setMessage(""); try { await cart.add(item); setMessage("Added to your cart."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not add this product."); } }
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="grid gap-10 lg:grid-cols-2">
    <section><div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">{item.imageUrls?.[0] ? <Image src={item.imageUrls[0]} alt={item.title} fill unoptimized priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /> : <div className="grid h-full place-items-center text-zinc-600">Product image unavailable</div>}</div><div className="mt-3 grid grid-cols-3 gap-3">{item.imageUrls?.slice(0, 3).map((url, index) => <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-white/10"><Image src={url} alt={`${item.title} view ${index + 1}`} fill unoptimized sizes="180px" className="object-cover" /></div>)}</div></section>
    <section className="lg:py-4"><div className="flex flex-wrap gap-2">{item.sellerStatus === "trusted" ? <Badge text="Trusted Seller" /> : item.sellerStatus === "verified" ? <Badge text="Verified Seller" /> : null}{item.bestseller ? <Badge text="Bestseller" /> : null}</div><p className="mt-5 text-sm uppercase tracking-wider text-zinc-500">{item.brand} · {item.category}</p><h1 className="mt-2 text-4xl font-bold text-white">{item.title}</h1><div className="mt-4 flex items-center gap-3 text-zinc-300"><Star className="h-5 w-5 text-legendary" />{item.rating || "New product"}<span>·</span>{item.salesCount || 0} sold</div><p className="mt-6 text-4xl font-bold text-white">{formatMoney(customerProductPrice(item))}</p><p className="mt-2 text-sm text-zinc-500">Inclusive of platform pricing. Taxes and delivery are shown at checkout.</p><button type="button" disabled={item.stock < 1 || cart.loading} onClick={() => void addToCart()} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-acid px-5 py-4 font-semibold text-ink disabled:bg-zinc-700"><ShoppingCart />{item.stock < 1 ? "Out of stock" : "Add to cart"}</button>{message ? <p role="status" className="mt-3 text-sm text-zinc-300">{message}</p> : null}<div className="mt-8 grid gap-3 sm:grid-cols-2"><Feature icon={<Truck />} title={item.deliveryTime || "Delivery estimate"} body="Track after dispatch" /><Feature icon={<ShieldCheck />} title="Buyer protection" body={item.returnPolicy || "Return policy applies"} /></div><div className="mt-8 border-t border-white/10 pt-8"><h2 className="text-xl font-semibold text-white">About this product</h2><p className="mt-3 whitespace-pre-line leading-7 text-zinc-300">{item.description}</p>{item.specifications ? <><h3 className="mt-6 font-semibold text-white">Ingredients / specifications</h3><p className="mt-2 leading-7 text-zinc-400">{item.specifications}</p></> : null}<Link href={`/sellers/${item.sellerId}`} className="mt-6 inline-flex text-acid">Visit {item.sellerName || "seller store"} →</Link></div></section>
  </div></main>;
}
function Badge({ text }: { text: string }) { return <span className="inline-flex items-center gap-1 rounded-full border border-acid/30 bg-acid/10 px-3 py-1 text-xs font-semibold text-acid"><BadgeCheck className="h-4 w-4" />{text}</span>; }
function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white"><div className="text-acid">{icon}</div><p className="mt-3 font-semibold">{title}</p><p className="text-sm text-zinc-400">{body}</p></div>; }
