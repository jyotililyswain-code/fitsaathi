"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Compass,
  Dumbbell,
  HeartHandshake,
  LayoutDashboard,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Trophy,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; /*important */
import { Children, type FormEvent, type ReactNode, useState } from "react";
import { CoachCard, DojoCard } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { readJsonResponseBody } from "@/lib/http";
import { API_URL } from "@/lib/local-api";
import { socialApi, socialAsset } from "@/lib/social";
import { useCoaches, useDojos, usePlatformStats } from "@/lib/hooks";
import { generalSearchTargetFor } from "@/lib/search-routing";

const generalSearches = [
  "Coaches",
  "Dojos",
  "Classes",
  "Shop",
  "Seller",
  "Booking",
];
const interestSearches = [
  "Karate",
  "Gym",
  "Yoga",
  "Running",
  "Boxing",
  "Dance",
];

const featureCards = [
  {
    title: "Find Fitness Partner",
    body: "Match with verified people who share your sport, goal, age preference and city.",
    href: "/life",
    icon: UsersRound,
  },
  {
    title: "Find Coach",
    body: "Browse trainers by specialty, city, pricing and verification status.",
    href: "/find-coach",
    icon: Search,
  },
  {
    title: "Become a Coach",
    body: "Register your coaching profile, submit documents and start receiving bookings.",
    href: "/become-a-coach",
    icon: Dumbbell,
  },
  {
    title: "Register as Seller",
    body: "Open a trusted seller profile and list fitness products for approval.",
    href: "/register-seller",
    icon: Store,
  },
  {
    title: "Browse Dojos",
    body: "Discover active academies for karate, martial arts, yoga and group training.",
    href: "/dojos",
    icon: Trophy,
  },
  {
    title: "Book Classes",
    body: "Book coach or dojo sessions and track attendance securely.",
    href: "/booking",
    icon: CalendarCheck,
  },
  {
    title: "Fitness Shop",
    body: "Shop equipment, supplements, recovery tools and verified seller products.",
    href: "/shop",
    icon: ShoppingBag,
  },
  {
    title: "Chat After Invite Accept",
    body: "Safe chat unlocks only after both members accept the connection.",
    href: "/chat",
    icon: MessageCircle,
  },
  {
    title: "User Dashboard",
    body: "Track bookings, orders, account status and activity from your dashboard.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Coach Dashboard",
    body: "Manage coaching requests, bookings, attendance and profile status.",
    href: "/coach-dashboard",
    icon: BadgeCheck,
  },
  {
    title: "Seller Dashboard",
    body: "Manage store verification, products, inventory and marketplace orders.",
    href: "/seller-dashboard",
    icon: Store,
  },
];

const oldUiBlocks = [
  [
    "Verified community",
    "Private ID review keeps documents hidden while showing trust badges publicly.",
  ],
  [
    "Trusted marketplace",
    "Coaches, dojos, sellers, bookings and product listings stay connected across the platform.",
  ],
  [
    "Safe connections",
    "Invite acceptance gates chat, with report, block and emergency safety options.",
  ],
  [
    "One fitness hub",
    "Partners, coaches, dojos, bookings, shop, cart, checkout and dashboards stay connected.",
  ],
];

const seoServiceSections = [
  [
    "Find Trusted Fitness Coaches",
    "Search for home fitness coaches, personal trainers, martial arts coaches, yoga trainers, and sports instructors based on your needs.",
  ],
  [
    "Book Home Fitness Training",
    "FitSaathi makes it easier to connect with coaches for home training, fitness guidance, martial arts practice, and personal workout support.",
  ],
  [
    "Register Your Dojo or Academy",
    "Dojos, martial arts academies, yoga centers, and fitness trainers can register on FitSaathi to reach more students.",
  ],
  [
    "Join as a Coach",
    "Fitness coaches, personal trainers, yoga teachers, karate coaches, boxing coaches, and martial arts instructors can join FitSaathi and grow their coaching work.",
  ],
  [
    "Fitness Marketplace for India",
    "FitSaathi is built for people in India who want easier access to fitness coaching, martial arts classes, dojos, and fitness products.",
  ],
] as const;

const seoBenefits = [
  "Easy coach discovery",
  "Home training support",
  "Dojo and academy registration",
  "Fitness product marketplace",
  "Customer care support",
  "Simple booking system",
] as const;

type InterestMatch = {
  id: string;
  name: string;
  age: number | null;
  gender: string;
  interests: string[];
  city?: string | null;
  photos: string[];
  shortBio?: string;
};

export default function HomePage({ brandSection }: { brandSection: ReactNode }) {
  const router = useRouter();
  const stats = usePlatformStats();
  const coaches = useCoaches(true);
  const dojos = useDojos(true);
  const [interestQuery, setInterestQuery] = useState("");
  const [matchResults, setMatchResults] = useState<InterestMatch[]>([]);
  const [matchMessage, setMatchMessage] = useState("");
  const [matchLoading, setMatchLoading] = useState(false);

  function submitGeneralSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("query") || "").trim();
    if (!query) return router.push("/get-started");
    router.push(generalSearchTargetFor(query));
  }

  async function submitInterestSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const interest = String(form.get("interest") || "").trim();
    await runInterestSearch(interest);
  }

  async function runInterestSearch(rawInterest: string) {
    const interest = rawInterest.trim();
    if (!interest) return setMatchMessage("Enter a fitness interest first.");
    setInterestQuery(interest);
    setMatchLoading(true);
    setMatchMessage("");
    setMatchResults([]);
    try {
      const response = await fetch(
        `${API_URL}/matches/interests?interest=${encodeURIComponent(interest)}`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );
      const body = await readJsonResponseBody<{
        items?: InterestMatch[];
        error?: string;
        code?: string;
        redirectTo?: string;
      }>(response, "Could not search interest matches.");
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/")}`);
        return;
      }
      if (response.status === 409 && body?.code === "PROFILE_INCOMPLETE") {
        router.push(body.redirectTo || "/complete-profile");
        return;
      }
      if (!response.ok)
        throw new Error(body?.error || "Could not search interest matches.");
      setMatchResults(body.items || []);
      setMatchMessage(
        body.items?.length
          ? `Showing verified ${interest} matches.`
          : `No verified ${interest} matches found yet.`,
      );
    } catch (error) {
      setMatchMessage(
        error instanceof Error
          ? error.message
          : "Could not search interest matches.",
      );
    } finally {
      setMatchLoading(false);
    }
  }

  async function sendInvite(userId: string) {
    try {
      await socialApi("/invites", {
        method: "POST",
        body: JSON.stringify({
          recipientId: userId,
          message: "Let's connect through FitSaathi Interest Match.",
        }),
      });
      setMatchMessage("Invite sent. Chat will unlock after they accept.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send invite.";
      if (/authentication/i.test(message))
        router.push(`/login?next=${encodeURIComponent("/")}`);
      else setMatchMessage(message);
    }
  }

  return (
    <main className="overflow-hidden">
      <section className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.06fr_.94fr] lg:px-8">
        <div className="absolute left-1/3 top-10 h-72 w-72 rounded-full bg-acid/10 blur-3xl" />
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-acid/30 bg-acid/10 px-4 py-2 text-sm text-acid">
            <Sparkles className="h-4 w-4" />
            Fitness and sports discovery across India
          </p>
          <h1 className="mt-6 text-5xl font-black leading-tight text-white sm:text-7xl">
            FitSaathi: Find Fitness Coaches, Dojos and Gyms Near You
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            FitSaathi helps people discover home fitness coaches, personal
            trainers, yoga instructors, martial arts teachers, dojos, gyms and
            sports training services across India.
          </p>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
            Visit the official FitSaathi platform at{" "}
            <Link href="/" className="font-medium text-acid hover:underline">
              thefitsaathi.com
            </Link>{" "}
            to explore public coach, dojo, gym and training profiles.
          </p>

          <form
            onSubmit={submitGeneralSearch}
            className="mt-8 max-w-3xl rounded-[1.6rem] border border-white/10 bg-white/[.06] p-2 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[.18em] text-zinc-500">
              General Search
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">General search</span>
                <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-zinc-500" />
                <input
                  name="query"
                  placeholder="Search coaches, dojos, classes, shop..."
                  className="h-14 w-full rounded-[1.15rem] border border-white/10 bg-ink px-12 text-base text-white outline-none placeholder:text-zinc-500 focus:border-acid/60"
                />
              </label>
              <button className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.15rem] bg-acid px-6 font-bold text-ink transition hover:bg-white">
                Search <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {generalSearches.map((item) => (
              <Link
                key={item}
                href={generalSearchTargetFor(item)}
                className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-acid/40 hover:text-acid"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 font-bold text-ink transition hover:bg-acid"
            >
              Get Started <Compass className="h-5 w-5" />
            </Link>
            <Link
              href="/life"
              className="inline-flex items-center gap-2 rounded-full bg-acid px-6 py-4 font-bold text-ink"
            >
              Explore FitSaathi Life <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/find-coach"
              className="rounded-full border border-white/15 px-6 py-4 font-semibold text-white"
            >
              Find fitness coaches near you
            </Link>
          </div>
        </motion.div>
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative"
        >
          <LiveSupabaseStats
            stats={stats.data}
            loading={stats.loading}
            unavailable={Boolean(stats.error)}
          />
        </motion.aside>
      </section>

      {brandSection}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-acid/20 bg-gradient-to-br from-acid/10 via-white/[.04] to-royal/10 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[.2em] text-acid">
                <HeartHandshake className="h-4 w-4" />
                Interest Match Search
              </p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">
                Find Your Fitness Partner by Interest
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
                This is separate from normal search. It searches only verified
                registered users/partners by interest, opposite gender and age
                compatibility.
              </p>
            </div>
            <Link
              href="/complete-profile"
              className="text-sm font-semibold text-acid"
            >
              Complete profile requirements
            </Link>
          </div>

          <form
            onSubmit={submitInterestSearch}
            className="mt-6 rounded-[1.6rem] border border-white/10 bg-ink/60 p-2"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Interest match search</span>
                <UsersRound className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-zinc-500" />
                <input
                  name="interest"
                  value={interestQuery}
                  onChange={(event) => setInterestQuery(event.target.value)}
                  placeholder="Search people by fitness interest like Karate, Gym, Yoga..."
                  className="h-14 w-full rounded-[1.15rem] border border-white/10 bg-black/30 px-12 text-base text-white outline-none placeholder:text-zinc-500 focus:border-acid/60"
                />
              </label>
              <button
                disabled={matchLoading}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.15rem] bg-acid px-6 font-bold text-ink transition hover:bg-white disabled:opacity-60"
              >
                {matchLoading ? "Searching..." : "Find Matches"}
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {interestSearches.map((item) => (
              <button
                key={item}
                onClick={() => void runInterestSearch(item)}
                type="button"
                className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-zinc-300"
              >
                {item}
              </button>
            ))}
          </div>

          {matchMessage ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-zinc-300">
              {matchMessage}
            </p>
          ) : null}

          {matchResults.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchResults.map((profile) => (
                <article
                  key={profile.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.05]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-white/[.04]">
                    {profile.photos[0] ? (
                      <Image
                        src={socialAsset(profile.photos[0])}
                        alt={`${profile.name} FitSaathi fitness profile`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-5xl font-black text-white/10">
                        {profile.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-bold text-white">
                        {profile.name}
                      </h3>
                      <span className="rounded-full bg-acid/10 px-3 py-1 text-xs text-acid">
                        {profile.age} yrs
                      </span>
                    </div>
                    <p className="mt-1 text-sm capitalize text-zinc-400">
                      {profile.gender} · {profile.city || "City not shared"}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-300">
                      {profile.shortBio || "Verified FitSaathi member."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.interests.slice(0, 4).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-acid/20 px-2.5 py-1 text-xs text-acid"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => sendInvite(profile.id)}
                      className="mt-5 w-full rounded-xl bg-acid px-4 py-3 font-bold text-ink"
                    >
                      Send Invite
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.22em] text-acid">
              Everything FitSaathi can do
            </p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              Pick a flow and continue.
            </h2>
          </div>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 text-sm font-semibold text-acid"
          >
            Open feature selection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featureCards.map(({ title, body, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-3xl border border-white/10 bg-white/[.04] p-6 transition hover:-translate-y-1 hover:border-acid/40 hover:bg-white/[.07]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-acid/10 text-acid">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
              <p className="mt-2 min-h-16 text-sm leading-6 text-zinc-400">
                {body}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-acid">
                Open{" "}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              Users,
              "Interest-first matching",
              "Discover people through shared sports, goals, age preferences and location.",
            ],
            [
              ShieldCheck,
              "Private verification",
              "Government documents stay encrypted. Other members only see your badge.",
            ],
            [
              MessageCircle,
              "Consent-based chat",
              "Messages unlock only when both people accept a connection.",
            ],
          ].map(([Icon, title, body]: any) => (
            <article
              key={title}
              className="rounded-3xl border border-white/10 bg-white/[.04] p-7"
            >
              <Icon className="h-7 w-7 text-acid" />
              <h2 className="mt-5 text-xl font-bold text-white">{title}</h2>
              <p className="mt-2 leading-7 text-zinc-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
        aria-labelledby="fitsaathi-india-services"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-acid">
            Fitness support across India
          </p>
          <h2
            id="fitsaathi-india-services"
            className="mt-2 text-3xl font-black text-white sm:text-4xl"
          >
            Coaching, classes, and fitness services in one place
          </h2>
          <p className="mt-4 leading-7 text-zinc-400">
            Explore practical ways to find training support, grow a coaching
            business, register an academy, or shop for fitness essentials.
          </p>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {seoServiceSections.map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[.04] p-6"
            >
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="mt-3 leading-7 text-zinc-400">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 border-y border-white/10 py-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Why choose FitSaathi?
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {seoBenefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-3 text-zinc-300"
                >
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-acid"
                    aria-hidden="true"
                  />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex max-w-xl flex-wrap gap-3">
            <Link
              href="/find-coach"
              className="rounded-lg bg-acid px-5 py-3 font-semibold text-ink transition hover:bg-white"
            >
              Find Coach
            </Link>
            <Link
              href="/become-a-coach"
              className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-acid/50 hover:text-acid"
            >
              Become a Coach
            </Link>
            <Link
              href="/register-dojo"
              className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-acid/50 hover:text-acid"
            >
              Register Dojo / Gym
            </Link>
            <Link
              href="/shop"
              className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-acid/50 hover:text-acid"
            >
              Visit Shop
            </Link>
            <Link
              href="/faq"
              className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-acid/50 hover:text-acid"
            >
              Read FAQ
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-acid/50 hover:text-acid"
            >
              Contact FitSaathi
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[.06] to-acid/[.05] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
            Classic homepage blocks restored
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            All original entry points, cleaned up and ready to use.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {oldUiBlocks.map(([title, body]) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-ink/50 p-5"
              >
                <h3 className="font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProviderSection
        title="Verified coaches"
        href="/find-coach"
        loading={coaches.loading}
        empty="No verified coaches yet."
      >
        {coaches.data.map((item) => (
          <CoachCard key={item.id} coach={item} />
        ))}
      </ProviderSection>
      <ProviderSection
        title="Active dojos"
        href="/dojos"
        loading={dojos.loading}
        empty="No active dojos yet."
      >
        {dojos.data.map((item) => (
          <DojoCard key={item.id} dojo={item} />
        ))}
      </ProviderSection>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-acid/20 bg-gradient-to-r from-acid/15 to-royal/10 p-8 sm:p-12">
          <BadgeCheck className="h-9 w-9 text-acid" />
          <h2 className="mt-5 text-3xl font-black text-white">
            Build a profile people can trust.
          </h2>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Complete private verification, choose your interests and start
            meeting people who are building consistent fitness habits.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-acid px-6 py-3 font-bold text-ink"
            >
              Join FitSaathi
            </Link>
            <Link
              href="/register-seller"
              className="inline-flex rounded-full border border-white/15 px-6 py-3 font-bold text-white"
            >
              Register as Seller
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProviderSection({
  title,
  href,
  loading,
  empty,
  children,
}: {
  title: string;
  href: string;
  loading: boolean;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-black text-white">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-acid">
          View all
        </Link>
      </div>
      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-white/[.04]" />
      ) : Children.count(children) ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      ) : (
        <EmptyState
          title={empty}
          body="New verified profiles will appear automatically."
        />
      )}
    </section>
  );
}

function LiveSupabaseStats({
  stats,
  loading,
  unavailable,
}: {
  stats: {
    users: number;
    coaches: number;
    dojos: number;
    sellers: number;
    bookings: number;
  };
  loading: boolean;
  unavailable: boolean;
}) {
  const items = [
    { label: "Users registered", value: stats.users, icon: Users },
    { label: "Coaches registered", value: stats.coaches, icon: Dumbbell },
    { label: "Dojos registered", value: stats.dojos, icon: Trophy },
    { label: "Sellers registered", value: stats.sellers, icon: Store },
    { label: "Bookings tracked", value: stats.bookings, icon: CalendarCheck },
  ];

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.05] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-acid">
            <Sparkles className="h-4 w-4" />
            Live from Supabase
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            FitSaathi activity
          </h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs ${unavailable ? "border-amber-300/30 text-amber-200" : "border-acid/30 text-acid"}`}
        >
          {loading ? "Loading" : unavailable ? "Unavailable" : "Live"}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {items.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="min-h-28 rounded-2xl border border-white/10 bg-ink/60 p-4"
          >
            <Icon className="h-5 w-5 text-acid" />
            <p className="mt-3 text-3xl font-black text-white">
              {loading ? "..." : value.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
