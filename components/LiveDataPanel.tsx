"use client";

import {
  Activity,
  CalendarCheck,
  Dumbbell,
  RefreshCw,
  Store,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePlatformStats } from "@/lib/hooks";

export function LiveDataPanel() {
  const stats = usePlatformStats();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!stats.loading && !stats.error) setLastUpdated(new Date());
  }, [stats.data, stats.error, stats.loading]);

  const items = [
    { label: "Total registered users", value: stats.data.users, icon: Users },
    {
      label: "Total registered coaches",
      value: stats.data.coaches,
      icon: Dumbbell,
    },
    {
      label: "Total registered dojos/gyms",
      value: stats.data.dojos,
      icon: Trophy,
    },
    {
      label: "Total registered sellers",
      value: stats.data.sellers,
      icon: Store,
    },
    {
      label: "Total bookings",
      value: stats.data.bookings,
      icon: CalendarCheck,
    },
  ];

  return (
    <section
      aria-labelledby="live-data-heading"
      className="rounded-[2rem] border border-white/10 bg-white/[.05] p-5 shadow-2xl shadow-black/20 sm:p-8"
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-acid">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Live from Supabase
          </p>
          <h1
            id="live-data-heading"
            className="mt-2 text-3xl font-black text-white sm:text-4xl"
          >
            FitSaathi activity
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
            Current registration and booking totals, fetched securely from the
            FitSaathi database.
          </p>
          <div
            className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500"
            aria-live="polite"
          >
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                stats.error
                  ? "border-amber-300/30 text-amber-200"
                  : "border-acid/30 text-acid"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  stats.loading
                    ? "animate-pulse bg-zinc-400"
                    : stats.error
                      ? "bg-amber-300"
                      : "bg-acid"
                }`}
                aria-hidden="true"
              />
              {stats.loading
                ? "Connecting"
                : stats.error
                  ? "Unavailable"
                  : "Live"}
            </span>
            {lastUpdated && !stats.loading && !stats.error ? (
              <span>
                Last updated{" "}
                <time dateTime={lastUpdated.toISOString()}>
                  {lastUpdated.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </time>
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={stats.reload}
          disabled={stats.loading}
          aria-label="Refresh live data"
          className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-acid/40 px-4 py-2.5 text-sm font-semibold text-acid transition hover:bg-acid hover:text-ink disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${stats.loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {stats.loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {stats.error ? (
        <div
          role="alert"
          className="mt-7 rounded-2xl border border-amber-300/25 bg-amber-300/[.07] p-5"
        >
          <h2 className="font-bold text-white">
            Live data is temporarily unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-100/80">
            We could not load the latest FitSaathi totals. Check your connection
            and try again.
          </p>
          <button
            type="button"
            onClick={stats.reload}
            className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-xl bg-acid px-5 py-2.5 text-sm font-bold text-ink"
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy={stats.loading}
          aria-label="Live FitSaathi statistics"
        >
          {stats.loading
            ? Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="min-h-36 animate-pulse rounded-2xl border border-white/10 bg-ink/60 p-5"
                  aria-hidden="true"
                >
                  <div className="h-5 w-5 rounded bg-white/10" />
                  <div className="mt-5 h-9 w-20 rounded bg-white/10" />
                  <div className="mt-3 h-4 w-36 max-w-full rounded bg-white/10" />
                </div>
              ))
            : items.map(({ label, value, icon: Icon }) => (
                <article
                  key={label}
                  className="min-h-36 rounded-2xl border border-white/10 bg-ink/60 p-5"
                >
                  <Icon className="h-5 w-5 text-acid" aria-hidden="true" />
                  <p className="mt-4 text-4xl font-black text-white">
                    {value.toLocaleString("en-IN")}
                  </p>
                  <h2 className="mt-2 text-sm leading-6 text-zinc-400">
                    {label}
                  </h2>
                </article>
              ))}
        </div>
      )}
    </section>
  );
}
