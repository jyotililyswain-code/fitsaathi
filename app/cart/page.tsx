"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { customerProductPrice } from "@/lib/marketplace";

export default function CartPage() {
  const cart = useCart();
  const total = cart.items.reduce((sum, item) => sum + (item.product ? customerProductPrice(item.product) * item.quantity : 0), 0);
  if (cart.loading) return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><div className="h-10 w-48 animate-pulse rounded-xl bg-white/10" /><div className="mt-8 h-40 animate-pulse rounded-2xl bg-white/[0.04]" /></main>;
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-acid">Marketplace</p><h1 className="mt-1 text-4xl font-bold text-white">Your cart</h1></div>{cart.items.length ? <button type="button" onClick={() => void cart.clear()} className="text-sm text-zinc-400 hover:text-white">Clear cart</button> : null}</div>
    {cart.error ? <div role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200">{cart.error} <button type="button" onClick={() => void cart.reload()} className="ml-2 underline">Retry</button></div> : null}
    {cart.items.length ? <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"><div className="space-y-3">{cart.items.map((item) => <article key={item.productId} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      {item.product?.imageUrls?.[0] ? <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl"><Image src={item.product.imageUrls[0]} alt={item.product.title} fill unoptimized sizes="96px" className="object-cover" /></div> : <div className="h-24 w-24 shrink-0 rounded-xl bg-white/5" />}
      <div className="min-w-0 flex-1"><Link href={`/products/${item.productId}`} className="font-semibold text-white hover:text-acid">{item.product?.title || item.productId}</Link><p className="mt-1 text-sm text-zinc-400">{formatMoney(item.product ? customerProductPrice(item.product) : 0)}</p><div className="mt-3 flex items-center gap-2"><button type="button" aria-label={`Decrease ${item.product?.title || "item"} quantity`} disabled={item.quantity <= 1} onClick={() => void cart.update(item.productId, item.quantity - 1)} className="rounded-lg border border-white/10 p-2 text-white disabled:opacity-40"><Minus className="h-3 w-3" /></button><span className="w-8 text-center text-white">{item.quantity}</span><button type="button" aria-label={`Increase ${item.product?.title || "item"} quantity`} onClick={() => void cart.update(item.productId, item.quantity + 1)} className="rounded-lg border border-white/10 p-2 text-white"><Plus className="h-3 w-3" /></button><button type="button" aria-label={`Remove ${item.product?.title || "item"}`} onClick={() => void cart.remove(item.productId)} className="ml-auto rounded-lg p-2 text-red-400 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></button></div></div>
    </article>)}</div><aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.05] p-6"><h2 className="text-xl font-semibold text-white">Order summary</h2><div className="mt-5 flex justify-between text-zinc-300"><span>Items</span><span>{cart.items.reduce((sum, item) => sum + item.quantity, 0)}</span></div><div className="mt-3 flex justify-between text-zinc-300"><span>Delivery</span><span>At checkout</span></div><div className="mt-5 flex justify-between border-t border-white/10 pt-5 text-xl font-bold text-white"><span>Total</span><span>{formatMoney(total)}</span></div><Link href="/checkout" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-acid px-5 py-4 font-semibold text-ink"><ShoppingBag />Secure checkout</Link></aside></div> : <div className="mt-8"><EmptyState title="Your cart is empty" body="Explore trusted fitness products and add what you need." action={<Link href="/products" className="rounded-full bg-acid px-5 py-3 font-semibold text-ink">Browse products</Link>} /></div>}
  </main>;
}
