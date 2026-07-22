"use client";

import Link from "next/link";
import { Bell, Calendar, CheckCircle2, Heart, MapPin, MessageCircle, QrCode, Star, Store, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { ReportProblemButton } from "@/components/ReportProblem";
import { useCollectionCount, useUserBookings } from "@/lib/hooks";
import { useSessionUser } from "@/lib/auth-client";
import { NotificationPermissionCard } from "@/components/notifications/NotificationPermissionCard";
import { BookingRealtimeListener } from "@/components/notifications/BookingRealtimeListener";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { readJsonResponse } from "@/lib/http";
import { localApi } from "@/lib/local-api";
import type { Booking } from "@/lib/types";
import { formatBookingMoney } from "@/lib/booking-pricing";
import { isPaymentInfoEligible } from "@/lib/booking-status";

export default function CustomerDashboardPage() {
  const { user } = useSessionUser();
  const bookings = useUserBookings(user?.id ?? null);
  const favorites = useCollectionCount("favorites");
  const reviews = useCollectionCount("reviews");
  const attendance = useCollectionCount("attendance");
  const notifications = useNotifications();
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Record<string, { name: string; phone: string }>>({});
  const [contactLoading, setContactLoading] = useState<string | null>(null);
  const contactRequests = useRef(new Set<string>());

  const loadContact = useCallback(async (bookingId: string) => {
    if (contactRequests.current.has(bookingId) || contacts[bookingId]) return;
    contactRequests.current.add(bookingId);
    setContactLoading(current => current || bookingId);
    try {
      const result = await localApi<{ contact: { name: string; phone: string } }>(`/bookings/${encodeURIComponent(bookingId)}/contact`);
      setContacts(current => ({ ...current, [bookingId]: result.contact }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load the provider contact."); }
    finally {
      contactRequests.current.delete(bookingId);
      setContactLoading(current => current === bookingId ? null : current);
    }
  }, [contacts]);

  useEffect(() => {
    for (const booking of bookings.data) {
      if (isFreeBooking(booking) && ["confirmed", "accepted", "completed"].includes(booking.status || "")) {
        void loadContact(booking.id);
      }
    }
  }, [bookings.data, loadContact]);

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
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 md:pb-20 lg:px-8">
        <BookingRealtimeListener onRefresh={bookings.reload} />
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Customer dashboard</h1>
        <p className="mt-3 text-zinc-400">Bookings and registration are free with no platform or hidden charges.</p>
        <section aria-label="Signed-in profile" className="mt-6 flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-acid/10 text-acid" aria-hidden="true">
            <UserRound className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-zinc-500">Signed in as</p>
            <p className="mt-1 break-words font-semibold text-white">{user?.name || "TheFitSaathi customer"}</p>
            <p className="mt-1 break-all text-sm text-zinc-400">{user?.email}</p>
          </div>
        </section>
        {message ? <p role="status" className="mt-4 rounded-xl border border-acid/30 bg-acid/10 p-3 text-sm text-acid">{message}</p> : null}
        <div data-dashboard-grid className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile icon={<Calendar />} label="My bookings" value={bookings.data.length} />
          <Tile icon={<Heart />} label="Saved favorites" value={favorites.data} />
          <Tile icon={<CheckCircle2 />} label="Free bookings" value={bookings.data.length} />
          <Tile icon={<Star />} label="Reviews written" value={reviews.data} />
          <Tile icon={<QrCode />} label="Attendance history" value={attendance.data} />
          <Tile icon={<Bell />} label="Unread notifications" value={notifications.unreadCount} />
          <ActionTile icon={<MapPin />} title="Manage addresses" href="/dashboard#addresses" />
          <ActionTile icon={<MessageCircle />} title="Contact coach" href="/contact" />
          <ActionTile icon={<Store />} title="Register as Seller" href="/seller/register" />
          <ReportProblemButton variant="dashboard" />
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
                <article key={booking.id} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{booking.classType || "Class booking"}</p>
                      <p className="mt-1 text-sm text-zinc-400">{booking.preferredDate || "Date pending"} {booking.preferredTime || ""}</p>
                      {isFreeBooking(booking) && ["confirmed", "accepted", "completed"].includes(booking.status || "") ? (contacts[booking.id] ? <p className="mt-1 text-sm text-acid">Owner contact: <a href={`tel:${contacts[booking.id].phone}`} className="underline">{contacts[booking.id].phone}</a> · {contacts[booking.id].name}</p> : <button type="button" disabled={contactLoading === booking.id || booking.status === "cancelled"} onClick={() => void loadContact(booking.id)} className="mt-2 rounded-full border border-acid/40 px-3 py-1.5 text-xs font-semibold text-acid disabled:opacity-50">{contactLoading === booking.id ? "Loading contact…" : "View Contact Number"}</button>) : <p className="mt-1 text-sm text-zinc-400">Owner contact: {["accepted", "completed"].includes(booking.status || "") ? booking.providerPhone || "Owner number pending" : "Visible after the provider accepts"}</p>}
                      <p className="mt-1 text-xs font-semibold text-acid">Booking charge: ₹0. Training fees are paid separately to the dojo, gym, or coach.</p>
                    </div>
                    <span className="shrink-0 self-start rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{booking.status || "pending"}</span>
                  </div>
                  <BookingPaymentPlan booking={booking} />
                  {["pending", "confirmed", "accepted"].includes(booking.status || "") ? <button type="button" onClick={() => void cancelBooking(booking.id)} className="mt-3 rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-300">Cancel booking</button> : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="0 bookings" body="Your booking requests will appear here after real bookings are created." />
          )}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/coaches" className="focus-ring inline-flex min-h-11 items-center rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white">
            Explore coaches
          </Link>
        </div>
      </main>
    </AuthGuard>
  );
}

function BookingPaymentPlan({ booking }: { booking: Booking }) {
  if (!isPaymentInfoEligible(booking.status)) return null;
  const monthlyFee = formatBookingMoney(booking.monthlyFeeSnapshotPaise);
  const firstMonthPayment = formatBookingMoney(booking.firstMonthPaymentPaise);
  const remainingBalance = formatBookingMoney(booking.firstMonthRemainingBalancePaise);
  const continuationPayment = formatBookingMoney(booking.continuationPaymentPaise);
  if (!monthlyFee || !firstMonthPayment || !remainingBalance || !continuationPayment) {
    return <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">Training fee information is currently unavailable. Please contact the provider or TheFitSaathi support.</p>;
  }
  return (
    <section className="mt-4 rounded-2xl border border-acid/25 bg-acid/5 p-4 text-sm text-zinc-200" aria-label="First-month payment information">
      <p className="font-semibold text-acid">First-month payment information</p>
      <p className="mt-2 leading-6">You only need to pay 50% of the monthly fee for your first month.</p>
      <p className="mt-1 leading-6">If you continue for the next month, you will pay the remaining half of your first-month fee together with the full next-month fee. If you do not continue after the first month, the next-month fee will not be charged.</p>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div><dt className="text-zinc-500">Monthly training fee</dt><dd className="font-semibold text-white">{monthlyFee}</dd></div>
        <div><dt className="text-zinc-500">First-month payment</dt><dd className="font-semibold text-white">{firstMonthPayment}</dd></div>
        <div><dt className="text-zinc-500">Remaining first-month balance</dt><dd className="font-semibold text-white">{remainingBalance}</dd></div>
        <div><dt className="text-zinc-500">Pay if continuing next month</dt><dd className="font-semibold text-acid">{continuationPayment}</dd></div>
      </dl>
      <details className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
        <summary className="cursor-pointer font-semibold text-white">How is {continuationPayment} calculated?</summary>
        <p className="mt-2 leading-6 text-zinc-300">{remainingBalance} remaining first-month balance + {monthlyFee} next-month fee = {continuationPayment} total.</p>
      </details>
    </section>
  );
}

function isFreeBooking(booking: Booking) {
  return booking.packageType === "trial" || booking.amount === 0;
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <article className="flex min-h-36 min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white">
      <div className="text-acid">{icon}</div>
      <div className="mt-4 min-w-0">
        <p className="break-words text-3xl font-semibold">{value}</p>
        <p className="break-words text-sm text-zinc-400">{label}</p>
      </div>
    </article>
  );
}

function ActionTile({ icon, title, href }: { icon: ReactNode; title: string; href: string }) {
  return (
    <Link href={href} className="focus-ring flex min-h-36 min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white transition hover:border-acid/50 hover:bg-white/[0.06]">
      <div className="text-acid">{icon}</div>
      <div className="mt-4 min-w-0">
        <p className="break-words text-lg font-semibold">{title}</p>
        <p className="text-sm text-zinc-400">Open</p>
      </div>
    </Link>
  );
}
