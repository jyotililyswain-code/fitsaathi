import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Clock3, MapPin, Star, UserRound } from "lucide-react";
import { AttendancePill } from "@/components/AttendancePill";
import { BadgePill } from "@/components/BadgePill";
import type { Coach, Dojo } from "@/lib/types";

export function CoachCard({ coach }: { coach: Coach }) {
  return (
    <Link
      href={`/coaches/${coach.id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] transition hover:-translate-y-1 hover:border-acid/40 hover:shadow-glow"
    >
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-acid/10 via-white/[0.03] to-royal/10">
        {coach.photoUrl ? (
          <Image
            src={coach.photoUrl}
            alt={`${coach.name} fitness coach on FitSaathi`}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <UserRound className="h-14 w-14 text-white/25" aria-hidden="true" />
        )}
        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${coach.verified ? "border-acid/30 bg-acid/15 text-acid" : "border-amber-300/30 bg-amber-300/10 text-amber-200"}`}
        >
          {coach.verified ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <Clock3 className="h-3 w-3" />
          )}
          {coach.verified ? "Verified" : "Pending verification"}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {coach.name || "Unnamed coach"}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {coach.category || "Category not set"}
            </p>
          </div>
          <BadgePill badge={coach.badge} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <AttendancePill
            percent={coach.attendancePercent}
            cancellations={coach.cancellations}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4 text-acid" />
            {coach.city || "City not set"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 text-legendary" />
            {coach.rating ?? "No rating"}
          </span>
          <span className="font-semibold text-acid">Free booking</span>
        </div>
      </div>
    </Link>
  );
}

export function DojoCard({ dojo }: { dojo: Dojo }) {
  return (
    <Link
      href={`/dojos/${dojo.id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] transition hover:-translate-y-1 hover:border-royal/50"
    >
      {dojo.imageUrl ? <div className="relative h-36 bg-white/[0.03]"><Image src={dojo.imageUrl} alt={`${dojo.name} business photo`} fill unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /></div> : null}
      <div className="p-5">
      <span className={`mb-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${dojo.verified ? "border-acid/30 bg-acid/15 text-acid" : "border-white/10 bg-white/[0.04] text-zinc-300"}`}>{dojo.verified ? <CheckCircle2 className="h-3 w-3" /> : null}{dojo.verified ? "Verified" : "Active"}</span>
      <h3 className="text-lg font-semibold text-white">
        {dojo.name || "Unnamed dojo"}
      </h3>
      <p className="mt-1 text-sm text-zinc-400">
        {dojo.category || "Category not set"}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-4 w-4 text-acid" />
          {dojo.city || "City not set"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Star className="h-4 w-4 text-legendary" />
          {dojo.rating ?? "No rating"}
        </span>
        <span className="font-semibold text-acid">Free booking</span>
      </div>
      </div>
    </Link>
  );
}
