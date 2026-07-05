"use client";

import { Bell, CalendarDays, CheckCircle2, Clock, IndianRupee, Star, Users, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { useSessionUser } from "@/lib/auth-client";
import { formatMoney } from "@/lib/format";
import { readJsonResponse } from "@/lib/http";
import { useCollectionCount, useProviderBookings, useReviews } from "@/lib/hooks";
import type { Booking } from "@/lib/types";

export default function CoachDashboardPage() {
  const { user } = useSessionUser();
  const bookings = useProviderBookings(user?.id || null);
  const reviews = useReviews();
  const students = useCollectionCount("students");
  const attendance = useCollectionCount("attendance");
  const notifications = useCollectionCount("notifications");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected" | "completed">("pending");
  const earnings = bookings.data.filter((booking) => ["accepted", "completed"].includes(booking.status || "")).reduce((sum, booking) => sum + (booking.coachPayout || booking.payoutAmount || booking.originalPrice || 0), 0);
  const visibleBookings = bookings.data.filter((booking) => (booking.status || "pending") === activeTab);

  async function setBookingStatus(id: string, status: "accepted" | "rejected") {
    if (!user) return setMessage("Please sign in again.");
    try {
      const response = await fetch("/api/bookings/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: id, status }) });
      await readJsonResponse(response, "Could not update booking.");
      bookings.reload();
      setMessage(status === "accepted" ? "Booking accepted. The customer was notified and contact numbers are now visible." : "Booking rejected. The customer was notified.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reach the booking service. Please try again.");
    }
  }
  return (
    <AuthGuard role="coach">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-white">Coach dashboard</h1>
      <p className="mt-3 text-zinc-400">Earnings, requests, attendance, schedule, students, and reviews stay at zero until real records exist.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Tile icon={<IndianRupee />} label="Earnings" value={formatMoney(earnings)} />
        <Tile icon={<CalendarDays />} label="Booking requests" value={String(bookings.data.length)} />
        <Tile icon={<Users />} label="Students" value={String(students.data)} />
        <Tile icon={<Star />} label="Reviews" value={String(reviews.data.length)} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <Tile icon={<Wallet />} label="Monthly payouts" value={formatMoney(earnings)} />
        <Tile icon={<CheckCircle2 />} label="Attendance scans" value={String(attendance.data)} />
        <Tile icon={<Clock />} label="Available days" value="Set on profile" />
        <Tile icon={<Bell />} label="Notifications" value={String(notifications.data)} />
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Panel title="Booking requests">
          {message ? <p className="mb-3 rounded-xl border border-acid/30 bg-acid/10 p-3 text-sm text-acid">{message}</p> : null}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {(["pending", "accepted", "rejected", "completed"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold capitalize ${activeTab === tab ? "bg-acid text-ink" : "border border-white/10 text-zinc-300"}`}>
                {tab} ({bookings.data.filter((booking) => (booking.status || "pending") === tab).length})
              </button>
            ))}
          </div>
          {visibleBookings.length ? (
            <div className="space-y-3">
              {visibleBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} onStatus={setBookingStatus} />
              ))}
            </div>
          ) : (
            <EmptyState title={`0 ${activeTab} bookings`} body="Bookings update here automatically when their status changes." />
          )}
        </Panel>
        <Panel title="Schedule management"><EmptyState title="0 scheduled sessions" body="Confirmed classes appear here with calendar timing." /></Panel>
        <Panel title="Attendance tracking"><EmptyState title="No attendance records" body="Attendance percent is hidden until real attendance documents exist." /></Panel>
      </div>
      </main>
    </AuthGuard>
  );
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white"><div className="text-acid">{icon}</div><p className="mt-4 text-3xl font-semibold">{value}</p><p className="text-sm text-zinc-400">{label}</p></div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>{children}</section>;
}

function BookingCard({ booking, onStatus }: { booking: Booking; onStatus: (id: string, status: "accepted" | "rejected") => void }) {
  const accepted = booking.status === "accepted" || booking.status === "completed";
  const pending = !booking.status || booking.status === "pending" || booking.status === "requested";
  return (
    <article className="rounded-2xl border border-white/10 bg-ink/40 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-semibold text-white">{booking.customerName || "Customer booking"}</p>
          <p className="mt-1 text-sm text-zinc-400">{booking.classType || "Class"} · {booking.preferredDate || "Date pending"} {booking.preferredTime || ""}</p>
          <p className="mt-1 text-sm text-zinc-400">Service: {booking.classType || "Home coaching"}</p>
          <p className="mt-1 text-sm text-zinc-400">Phone: {accepted ? booking.customerPhone || "Not provided" : "Hidden until accepted"}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{booking.status || "pending"}</span>
      </div>
      {pending ? <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => onStatus(booking.id, "accepted")} className="rounded-full bg-acid px-4 py-2 text-xs font-semibold text-ink">
          Accept
        </button>
        <button onClick={() => onStatus(booking.id, "rejected")} className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300">
          Reject
        </button>
      </div> : null}
    </article>
  );
}
