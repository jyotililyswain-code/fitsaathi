"use client";

import {
  Building2,
  Dumbbell,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSessionUser } from "@/lib/auth-client";

type JoinAction = {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  icon: LucideIcon;
};

const joinActions: JoinAction[] = [
  {
    title: "Register Dojo or Gym",
    description:
      "List your dojo, gym, academy or sports training centre and allow customers to discover your services.",
    buttonLabel: "Register Dojo/Gym",
    href: "/register-dojo",
    icon: Building2,
  },
  {
    title: "Become a Coach",
    description:
      "Create your professional coach profile and provide home or personal fitness training.",
    buttonLabel: "Become a Coach",
    href: "/become-a-coach",
    icon: Dumbbell,
  },
  {
    title: "Register as a Seller",
    description:
      "Sell approved fitness equipment, sports products and related items through TheFitSaathi.",
    buttonLabel: "Register as a Seller",
    href: "/register-seller",
    icon: ShoppingBag,
  },
];

export function JoinTheFitSaathi() {
  const { user, checking } = useSessionUser();
  const [pendingPath, setPendingPath] = useState("");

  return (
    <section
      aria-labelledby="join-thefitsaathi-heading"
      className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[.07] via-white/[.04] to-acid/[.08] p-5 shadow-2xl shadow-black/20 sm:p-6"
    >
      <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
        Build with us
      </p>
      <h2
        id="join-thefitsaathi-heading"
        className="mt-2 text-3xl font-black text-white"
      >
        Join TheFitSaathi
      </h2>
      <p className="mt-2 max-w-xl leading-7 text-zinc-300">
        Grow your fitness business and connect with customers across India.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {joinActions.map((action) => {
          const Icon = action.icon;
          const destination = user
            ? action.href
            : `/login?next=${encodeURIComponent(action.href)}`;
          const navigating = pendingPath === action.href;

          return (
            <article key={action.href} className="min-w-0">
              <Link
                href={destination}
                aria-label={`${action.title}: ${action.description}`}
                aria-busy={navigating}
                aria-disabled={checking}
                onClick={(event) => {
                  if (checking) {
                    event.preventDefault();
                    return;
                  }
                  setPendingPath(action.href);
                }}
                className="focus-ring group flex h-full min-h-44 min-w-0 flex-col rounded-2xl border border-white/10 bg-ink/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-acid/45 hover:bg-white/[.06] active:translate-y-0 sm:p-5"
              >
                <span className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-acid/25 bg-acid/10 text-acid transition group-hover:bg-acid group-hover:text-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-lg font-bold text-white">
                      {action.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-zinc-400">
                      {action.description}
                    </span>
                  </span>
                </span>
                <span className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-acid px-4 py-2.5 text-center text-sm font-bold text-ink transition group-hover:bg-white">
                  {checking
                    ? "Checking access..."
                    : navigating
                      ? "Opening..."
                      : action.buttonLabel}
                </span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
