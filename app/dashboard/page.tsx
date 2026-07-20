"use client";

import Link from "next/link";
import { Bell, Calendar, CheckCircle2, Heart, MapPin, MessageCircle, QrCode, Star, Store } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { ReportProblemButton } from "@/components/ReportProblem";
import { useCollectionCount, useUserBookings } from "@/lib/hooks";
import { useSessionUser } from "@/lib/auth-client";
import { NotificationPermissionCard } from "@/components/notifications/NotificationPermissionCard";
import { BookingRealtimeListener } from "@/components/notifications/BookingRealtimeListener";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { readJsonResponse } from "@/lib/http";

export default function CustomerDashboardPage() {
  const { user } = useSessionUser();
  const bookings = useUserBookings(user?.id ?? null);
  const favorites = useCollectionCount("favorites");
  const reviews = useCollectionCount("reviews");
  const attendance = useCollectionCount("attendance");
  const notifications = useNotifications();
  const [message, setMessage] = useState("");

  async function cancelBooking(bookingId: string) {
    try {
      const response = await fetch("/api/bookings/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, status: "cancelled" }) });
      await readJsonResponse(response, "Could not cancel this booking.");
      setMessage("Booking cancelled. The provider was notified.");
      bookings.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not cancel this booking."); }
  }

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <BookingRealtimeListener onRefresh={bookings.reload} />
        <h1 className="text-4xl font-bold text-white">Customer dashboard</h1>
        <p className="mt-3 text-zinc-400">Bookings and registration are free with no platform or hidden charges.</p>
        {message ? <p role="status" className="mt-4 rounded-xl border border-acid/30 bg-acid/10 p-3 text-sm text-acid">{message}</p> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Tile icon={<Calendar />} label="My bookings" value={bookings.data.length} />
          <Tile icon={<Heart />} label="Saved favorites" value={favorites.data} />
          <Tile icon={<CheckCircle2 />} label="Free bookings" value={bookings.data.length} />
          <Tile icon={<Star />} label="Reviews written" value={reviews.data} />
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          <Tile icon={<QrCode />} label="Attendance history" value={attendance.data} />
          <Tile icon={<Bell />} label="Unread notifications" value={notifications.unreadCount} />
          <ActionTile icon={<MapPin />} title="Manage addresses" href="/dashboard#addresses" />
          <ActionTile icon={<MessageCircle />} title="Contact coach" href="/contact" />
        </div>
        <div className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ActionTile icon={<Store />} title="Register as Seller" href="/seller/register" />
            <ReportProblemButton variant="dashboard" />
          </div>
        </div>
        <div className="mt-8">
          <NotificationPermissionCard audience="customer" />
        </div>
        <div className="mt-8">
          {bookings.loading ? (
            <p className="text-sm text-zinc-400">Loading your bookings...</p>
          ) : bookings.data.length ? (
            <div className="grid gap-3">
              {bookings.data.map((booking) => (
                <article key={booking.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-semibold text-white">{booking.classType || "Class booking"}</p>
                      <p className="mt-1 text-sm text-zinc-400">{booking.preferredDate || "Date pending"} {booking.preferredTime || ""}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        Owner contact: {["accepted", "completed"].includes(booking.status || "") ? booking.providerPhone || "Owner number pending" : "Visible after the provider accepts"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-acid">Free booking · ₹0 FitSaathi charge</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{booking.status || "pending"}</span>
                  </div>
                  {["pending", "confirmed", "accepted"].includes(booking.status || "") ? <button type="button" onClick={() => void cancelBooking(booking.id)} className="mt-3 rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-300">Cancel booking</button> : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="0 bookings" body="Your booking requests will appear here after real bookings are created." />
          )}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/coaches" className="inline-flex rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink">
            Explore coaches
          </Link>
        </div>
      </main>
    </AuthGuard>
  );
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white">
      <div className="text-acid">{icon}</div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}

function ActionTile({ icon, title, href }: { icon: ReactNode; title: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white transition hover:border-acid/40">
      <div className="text-acid">{icon}</div>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="text-sm text-zinc-400">Open</p>
    </Link>
  );
}
