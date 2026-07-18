"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarPlus, MessageCircle } from "lucide-react";
import { useState } from "react";
import { AttendancePill } from "@/components/AttendancePill";
import { BadgePill } from "@/components/BadgePill";
import { EmptyState } from "@/components/EmptyState";
import { useSessionUser } from "@/lib/auth-client";
import { useCoach } from "@/lib/hooks";
import { localApi } from "@/lib/local-api";

export default function CoachProfilePage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id || "";
  const coach = useCoach(id);
  const { user } = useSessionUser();
  const [message, setMessage] = useState("");

  async function requestChat() {
    if (!user) return setMessage("Please log in before requesting a chat.");
    const ownerId = coach.data?.ownerId;
    if (!ownerId) return setMessage("This coach profile is not ready for chat yet.");

    try {
      await localApi("/chats", { method: "POST", body: JSON.stringify({ coachId: id, message: "Customer requested a chat." }) });
      setMessage("Chat request created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create chat request right now.");
    }
  }

  if (!coach.data && !coach.loading) {
    return <main className="mx-auto max-w-4xl px-4 py-16"><EmptyState title="Coach not found" body="This profile does not exist in PostgreSQL." /></main>;
  }

  const data = coach.data;
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <BadgePill badge={data?.badge} />
            <h1 className="mt-4 text-4xl font-bold text-white">{data?.name || "Loading coach profile"}</h1>
            <p className="mt-2 text-zinc-400">{data?.category || "Category not set"} {data?.city ? `in ${data.city}` : ""}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/booking?coachId=${id}`} className="inline-flex items-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink">
              <CalendarPlus className="h-4 w-4" />
              Book
            </Link>
            <button onClick={requestChat} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-white">
              <MessageCircle className="h-4 w-4" />
              Chat
            </button>
          </div>
        </div>
        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Info label="TheFitSaathi booking charge" value="Free — no hidden fees" />
          <Info label="Rating" value={data?.rating ? String(data.rating) : "No reviews yet"} />
          <Info label="Location" value={data?.city || "Not set"} />
        </div>
        <div className="mt-6">
          <AttendancePill percent={data?.attendancePercent} cancellations={data?.cancellations} />
        </div>
        <p className="mt-8 leading-7 text-zinc-300">{data?.bio || "This coach has not added a bio yet."}</p>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-ink/40 p-4"><p className="text-sm text-zinc-500">{label}</p><p className="mt-1 font-semibold text-white">{value}</p></div>;
}
