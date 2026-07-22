"use client";

import Link from "next/link";
import { BarChart3, Bell, CalendarDays, CheckCircle2, Clock, Pencil, Users, WalletCards } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { useSessionUser } from "@/lib/auth-client";
import { todayInIndia } from "@/lib/date";
import { readJsonResponse } from "@/lib/http";
import { useCollectionCount, useMyDojoStatus, useProviderBookings } from "@/lib/hooks";
import type { Booking } from "@/lib/types";
import { NotificationPermissionCard } from "@/components/notifications/NotificationPermissionCard";
import { BookingRealtimeListener } from "@/components/notifications/BookingRealtimeListener";
import { useNotifications } from "@/components/notifications/NotificationProvider";

export default function DojoDashboardPage() {
  const { user } = useSessionUser();
  const bookings = useProviderBookings(user?.id || null);
  const registration = useMyDojoStatus(user?.id || null);
  const customers = useCollectionCount("students");
  const memberships = useCollectionCount("memberships");
  const notifications = useNotifications();
  const [message, setMessage] = useState("");
  const pendingBookings = bookings.data.filter((booking) => booking.status === "pending" || (booking.status === "confirmed" && booking.packageType !== "trial")).length;

  async function setBookingStatus(id: string, status: "accepted" | "rejected" | "completed" | "cancelled" | "rescheduled", schedule?: { preferredDate: string; preferredTime: string }) {
    if (!user) return setMessage("Please sign in again.");
    try {
      const response = await fetch("/api/bookings/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: id, status, ...schedule }) });
      await readJsonResponse(response, "Could not update booking.");
      bookings.reload();
      setMessage(status === "accepted" ? "Booking accepted. Contact info is visible." : status === "rejected" ? "Booking rejected." : `Booking ${status}. The customer was notified.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reach the booking service. Please try again.");
    }
  }

  return (
    <AuthGuard role="dojo">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <BookingRealtimeListener onRefresh={bookings.reload} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">{registration.data?.establishmentType === "GYM" ? "Gym owner dashboard" : "Dojo owner dashboard"}</h1>
            <p className="mt-3 text-zinc-400">Manage your academy, classes, timings, and free FitSaathi bookings. Registration and bookings have no platform or hidden charges.</p>
            <p className="mt-2 text-xs text-zinc-500">Your registered contact number is shared only with logged-in customers after they successfully book a trial.</p>
          </div>
          {registration.data?.id ? (
            <Link href={`/owner/dojos/${registration.data.id}/edit`} className="focus-ring inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-acid/40 px-4 py-2.5 text-sm font-semibold text-acid transition hover:bg-acid hover:text-ink sm:w-auto">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit profile
            </Link>
          ) : null}
        </div>
        {registration.data?.status === "active" && !registration.data.verified ? <div className="mt-5 rounded-2xl border border-acid/30 bg-acid/10 p-4 text-sm text-emerald-100"><strong className="block text-white">Your dojo is live</strong>Your profile appears in public search. The verified badge remains under document review.</div> : null}
        {registration.data?.status === "inactive" || registration.data?.status === "suspended" ? <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"><strong className="block text-white">Dojo listing is not public</strong>Contact support if you need help restoring this registration.</div> : null}
        {registration.data?.status === "rejected" ? <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"><strong className="block text-white">Registration needs attention</strong>Your dojo is not publicly listed. Contact support for review details.</div> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Tile icon={<CalendarDays />} label="Pending bookings" value={String(pendingBookings)} />
          <Tile icon={<Users />} label="Customers" value={String(customers.data)} />
          <Tile icon={<CheckCircle2 />} label="Free bookings" value={String(bookings.data.length)} />
          <Tile icon={<WalletCards />} label="Memberships" value={String(memberships.data)} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4"><Tile icon={<Bell />} label="Unread notifications" value={String(notifications.unreadCount)} /></div>
        <div className="mt-8"><NotificationPermissionCard /></div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Panel title="Booking Requests">
            {message ? <p className="mb-3 rounded-xl border border-acid/30 bg-acid/10 p-3 text-sm text-acid">{message}</p> : null}
            {bookings.data.length ? (
              <div className="space-y-3">
                {bookings.data.slice(0, 6).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} onStatus={setBookingStatus} />
                ))}
              </div>
            ) : (
              <EmptyState title="0 dojo bookings" body="New free booking requests will appear here." />
            )}
          </Panel>
          <Panel title="Classes"><EmptyState title="No classes added" body="Add classes and batch capacity from your profile management flow." /></Panel>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Timings"><EmptyState title="No timings added" body="Morning, evening, and weekend timings appear here after setup." /></Panel>
          <Panel title="Analytics"><div className="flex items-center gap-3 text-zinc-400"><BarChart3 className="text-acid" /> Booking and attendance charts populate from real activity.</div></Panel>
        </div>
      </main>
    </AuthGuard>
  );
}

function BookingCard({ booking, onStatus }: { booking: Booking; onStatus: (id: string, status: "accepted" | "rejected" | "completed" | "cancelled" | "rescheduled", schedule?: { preferredDate: string; preferredTime: string }) => void }) {
  const confirmed = booking.status === "accepted" || booking.status === "completed";
  const contactVisible = confirmed || (booking.packageType === "trial" && booking.status === "confirmed");
  const pending = booking.status === "confirmed" && booking.packageType !== "trial";
  const [date, setDate] = useState(booking.preferredDate || "");
  const [time, setTime] = useState(booking.preferredTime || "");
  return (
    <article className="rounded-2xl border border-white/10 bg-ink/40 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-semibold text-white">{booking.customerName || "Customer booking"}</p>
          <p className="mt-1 text-sm text-zinc-400">{booking.preferredDate || "Date pending"} {booking.preferredTime || ""}</p>
          <p className="mt-1 text-sm text-zinc-400">Phone: {contactVisible ? booking.customerPhone || "Not provided" : "Hidden until accepted"}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{booking.packageType === "trial" && booking.status === "confirmed" ? "Confirmed automatically" : booking.status || "pending"}</span>
      </div>
      {pending ? <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => onStatus(booking.id, "accepted")} className="rounded-full bg-acid px-4 py-2 text-xs font-semibold text-ink">
          Accept
        </button>
        <button onClick={() => onStatus(booking.id, "rejected")} className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300">
          Reject
        </button>
      </div> : null}
      {["confirmed", "accepted"].includes(booking.status || "") ? <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-[1fr_1fr_auto]"><input type="date" min={todayInIndia()} value={date} onChange={event => setDate(event.target.value)} className="field" aria-label="New booking date" /><input type="time" value={time} onChange={event => setTime(event.target.value)} className="field" aria-label="New booking time" /><button type="button" disabled={!date || !time || (date === booking.preferredDate && time === booking.preferredTime)} onClick={() => onStatus(booking.id, "rescheduled", { preferredDate: date, preferredTime: time })} className="min-h-11 rounded-xl border border-acid/40 px-4 py-2 text-xs font-semibold text-acid disabled:opacity-40">Reschedule</button></div> : null}
      {booking.status === "accepted" ? <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onStatus(booking.id, "completed")} className="rounded-full bg-acid px-4 py-2 text-xs font-semibold text-ink">Mark completed</button><button type="button" onClick={() => onStatus(booking.id, "cancelled")} className="rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-300">Cancel booking</button></div> : null}
    </article>
  );
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white">
      <div className="text-acid">{icon}</div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-acid" />
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
