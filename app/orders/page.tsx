"use client";

import { PackageCheck, Truck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { formatMoney } from "@/lib/format";
import { localApi } from "@/lib/local-api";

type Order = { id: string; status?: string; total?: number; items?: Array<{ quantity: number; product?: { title: string } }>; createdAt?: string; trackingNumber?: string };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const placed = useSearchParams()?.get("placed");
  useEffect(() => { localApi<Order[]>("/orders").then(setOrders).catch(() => setOrders([])); }, []);

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white">Your marketplace orders</h1>
        <p className="mt-3 text-zinc-400">Track product orders from confirmation through delivery.</p>
        {placed ? <p className="mt-5 rounded-2xl border border-acid/30 bg-acid/10 p-4 text-sm text-acid">Order #{placed.slice(0, 8)} was submitted successfully.</p> : null}
        <div className="mt-8 space-y-4">
          {orders.length ? orders.map(order => (
            <article key={order.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="font-semibold text-white">Order #{order.id.slice(0, 8)}</p><p className="mt-1 text-sm text-zinc-400">{order.items?.map(item => `${item.quantity}× ${item.product?.title || "Product"}`).join(", ")}</p></div>
                <span className="rounded-full border border-acid/30 bg-acid/10 px-3 py-1 text-xs font-semibold text-acid">{order.status || "pending"}</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3"><Info icon={<PackageCheck />} label="Total" value={formatMoney(order.total)} /><Info icon={<Truck />} label="Tracking" value={order.trackingNumber || "Pending dispatch"} /><Info icon={<PackageCheck />} label="Placed" value={order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recently"} /></div>
            </article>
          )) : <EmptyState title="No marketplace orders" body="Your product orders will appear here." />}
        </div>
      </main>
    </AuthGuard>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-ink/40 p-3"><div className="text-acid">{icon}</div><p className="mt-2 text-xs text-zinc-500">{label}</p><p className="text-sm font-medium text-white">{value}</p></div>;
}
