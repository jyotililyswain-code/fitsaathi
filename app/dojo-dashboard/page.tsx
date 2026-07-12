"use client";

import { BarChart3, CalendarDays, Clock, IndianRupee, Users, WalletCards } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { useSessionUser } from "@/lib/auth-client";
import { formatMoney } from "@/lib/format";
import { readJsonResponse } from "@/lib/http";
import { useCollectionCount, useMyDojoStatus, useProviderBookings } from "@/lib/hooks";
import type { Booking } from "@/lib/types";

export default function DojoDashboardPage() {
  const { user } = useSessionUser();
  const bookings = useProviderBookings(user?.id || null);
  const registration = useMyDojoStatus(user?.id || null);
  const customers = useCollectionCount("students");
  const memberships = useCollectionCount("memberships");
  const [message, setMessage] = useState("");
  const earnings = bookings.data.reduce((sum, booking) => sum + (booking.originalPrice || booking.amount || 0), 0);

  async function setBookingStatus(id: string, status: "accepted" | "rejected") {
    if (!user) return setMessage("Please sign in again.");
    try {
      const response = await fetch("/api/bookings/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: id, status }) });
      await readJsonResponse(response, "Could not update booking.");
      bookings.reload();
      setMessage(status === "accepted" ? "Dojo booking accepted. Contact info is visible." : "Dojo booking rejected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reach the booking service. Please try again.");
    }
  }

  return (
    <AuthGuard role="dojo">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white">Dojo dashboard</h1>
        <p className="mt-3 text-zinc-400">Manage academy profile, classes, timings, bookings, customers, earnings, analytics, and memberships.</p>
        {registration.data?.status === "pending" ? <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"><strong className="block text-white">Dojo pending approval</strong>Your registration is saved but will not appear in public search until an administrator approves it.</div> : null}
        {registration.data?.status === "rejected" ? <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100"><strong className="block text-white">Registration needs attention</strong>Your dojo is not publicly listed. Contact support for review details.</div> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Tile icon={<CalendarDays />} label="Bookings" value={String(bookings.data.length)} />
          <Tile icon={<Users />} label="Customers" value={String(customers.data)} />
          <Tile icon={<IndianRupee />} label="Earnings" value={formatMoney(earnings)} />
          <Tile icon={<WalletCards />} label="Memberships" value={String(memberships.data)} />
        </div>
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
              <EmptyState title="0 dojo bookings" body="Paid dojo booking requests appear here." />
            )}
          </Panel>
          <Panel title="Classes"><EmptyState title="No classes added" body="Add classes and batch capacity from your profile management flow." /></Panel>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Timings"><EmptyState title="No timings added" body="Morning, evening, and weekend timings appear here after setup." /></Panel>
          <Panel title="Analytics"><div className="flex items-center gap-3 text-zinc-400"><BarChart3 className="text-acid" /> Revenue and attendance charts populate from real activity.</div></Panel>
        </div>
      </main>
    </AuthGuard>
  );
}

function BookingCard({ booking, onStatus }: { booking: Booking; onStatus: (id: string, status: "accepted" | "rejected") => void }) {
  const confirmed = booking.status === "accepted" || booking.status === "completed";
  const pending = !booking.status || booking.status === "pending" || booking.status === "requested";
  return (
    <article className="rounded-2xl border border-white/10 bg-ink/40 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-semibold text-white">{booking.customerName || "Customer booking"}</p>
          <p className="mt-1 text-sm text-zinc-400">{booking.preferredDate || "Date pending"} {booking.preferredTime || ""}</p>
          <p className="mt-1 text-sm text-zinc-400">Phone: {confirmed ? booking.customerPhone || "Not provided" : "Hidden until accepted"}</p>
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
