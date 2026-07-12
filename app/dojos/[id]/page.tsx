"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { CalendarPlus, ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { formatMoney } from "@/lib/format";
import { useDojo } from "@/lib/hooks";

export default function DojoProfilePage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id || "";
  const dojo = useDojo(id);
  if (!dojo.data && !dojo.loading) {
    return <main className="mx-auto max-w-4xl px-4 py-16"><EmptyState title="Dojo not found" body="This profile does not exist in PostgreSQL." /></main>;
  }
  const data = dojo.data;
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8">
        {data?.imageUrl ? <div className="relative mb-7 h-64 overflow-hidden rounded-2xl bg-white/[0.03]"><Image src={data.imageUrl} alt={`${data.name} business photo`} fill unoptimized sizes="(max-width: 1024px) 100vw, 64rem" className="object-cover" /></div> : null}
        <p className="text-sm text-acid">{data?.verified ? "Verified dojo" : "Active dojo"}</p>
        <h1 className="mt-3 text-4xl font-bold text-white">{data?.name || "Loading dojo profile"}</h1>
        <p className="mt-2 text-zinc-400">{data?.category || "Category not set"} {data?.city ? `in ${data.city}` : ""}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Info label="Package price" value={formatMoney(data?.price)} />
          <Info label="Rating" value={data?.rating ? String(data.rating) : "No reviews yet"} />
          <Info label="City" value={data?.city || "Not set"} />
        </div>
        <p className="mt-8 leading-7 text-zinc-300">{data?.description || "This dojo has not added a description yet."}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/booking?dojoId=${id}`} className="inline-flex items-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink">
            <CalendarPlus className="h-4 w-4" />
            Book trial
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300">
            <ReceiptText className="h-4 w-4" />
            First package partial refund eligible
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-ink/40 p-4"><p className="text-sm text-zinc-500">{label}</p><p className="mt-1 font-semibold text-white">{value}</p></div>;
}
