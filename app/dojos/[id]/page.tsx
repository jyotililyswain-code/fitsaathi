"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarPlus, CircleCheck, Pencil } from "lucide-react";
import { DojoProfileImage } from "@/components/DojoProfileImage";
import { EmptyState } from "@/components/EmptyState";
import { isAdminRole } from "@/lib/admin";
import { useSessionUser } from "@/lib/auth-client";
import { useDojo, useMyDojoStatus } from "@/lib/hooks";

export default function DojoProfilePage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id || "";
  const { user } = useSessionUser();
  const dojo = useDojo(id);
  const admin = isAdminRole(user?.role);
  const ownedDojo = useMyDojoStatus(user && !admin ? user.id : null);
  const canManage = Boolean(admin || ownedDojo.data?.id === id);
  const editHref = canManage ? `/owner/dojos/${id}/edit` : undefined;
  if (!dojo.data && !dojo.loading) {
    return <main className="mx-auto max-w-4xl px-4 py-16"><EmptyState title="Dojo not found" body="This profile does not exist in PostgreSQL." /></main>;
  }
  const data = dojo.data;
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:p-6 lg:p-8">
        <div className="mb-7">
          <DojoProfileImage
            dojoName={data?.name || "Dojo"}
            imageUrl={data?.imageUrl}
            imageFit={data?.imageFit}
            imagePosition={data?.imagePosition}
            editHref={editHref}
            loading={dojo.loading}
            priority
          />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-acid">{data?.verified ? "Verified dojo" : "Active dojo"}</p>
            <h1 className="mt-3 break-words text-3xl font-bold text-white sm:text-4xl">{data?.name || "Loading dojo profile"}</h1>
          </div>
          {editHref ? (
            <Link href={editHref} className="focus-ring inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-acid/40 px-4 py-2.5 text-sm font-semibold text-acid transition hover:bg-acid hover:text-ink sm:w-auto">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit profile
            </Link>
          ) : null}
        </div>
        <p className="mt-2 text-zinc-400">{data?.category || "Category not set"} {data?.city ? `in ${data.city}` : ""}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Info label="TheFitSaathi booking charge" value="Free — no hidden fees" />
          <Info label="Rating" value={data?.rating ? String(data.rating) : "No reviews yet"} />
          <Info label="City" value={data?.city || "Not set"} />
        </div>
        <p className="mt-8 leading-7 text-zinc-300">{data?.description || "This dojo has not added a description yet."}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/booking?dojoId=${id}`} className="inline-flex items-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink">
            <CalendarPlus className="h-4 w-4" />
            Book trial
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-acid/30 px-5 py-3 text-sm text-acid">
            <CircleCheck className="h-4 w-4" />
            ₹0 platform charge
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-ink/40 p-4"><p className="text-sm text-zinc-500">{label}</p><p className="mt-1 font-semibold text-white">{value}</p></div>;
}
