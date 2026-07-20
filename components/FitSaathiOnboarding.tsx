"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  Check,
  Dumbbell,
  Footprints,
  HeartPulse,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { JsonLd } from "@/components/JsonLd";
import { useSessionUser } from "@/lib/auth-client";
import { usePlatformStats } from "@/lib/hooks";
import { dashboardPathForRole } from "@/lib/roles";
import { coachBookingServiceJsonLd } from "@/lib/seo";
import { SOCIAL_INTERESTS } from "@/lib/social";

const features = [
  ["🥋", "Find Fitness Partners"],
  ["🏋", "Find Coaches"],
  ["🥊", "Become Coach"],
  ["🧘", "Yoga Community"],
  ["💪", "Gym Partners"],
  ["🥇", "Verified Profiles"],
  ["💬", "Safe Chat"],
  ["📍", "Nearby People"],
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useSessionUser();
  const stats = usePlatformStats();
  const [screen, setScreen] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const toggle = (interest: string) =>
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  const register = () =>
    router.push(
      `/signup${interests.length ? `?interests=${encodeURIComponent(interests.join(","))}` : ""}`,
    );

  return (
    <main className="relative min-h-[calc(100dvh-73px)] overflow-hidden bg-[#08090d] px-4 py-8 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...coachBookingServiceJsonLd,
        }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, -40, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-acid/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -70, 0], y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-royal/15 blur-3xl"
        />
        {[Dumbbell, Bike, Footprints, HeartPulse].map((Icon, index) => (
          <motion.div
            key={index}
            animate={{ y: [0, -18, 0], rotate: [-4, 4, -4] }}
            transition={{ duration: 4 + index, repeat: Infinity }}
            className={`absolute text-white/[.06] ${index === 0 ? "left-[8%] top-[20%]" : index === 1 ? "right-[12%] top-[18%]" : index === 2 ? "bottom-[12%] left-[16%]" : "bottom-[18%] right-[18%]"}`}
          >
            <Icon className="h-20 w-20 sm:h-28 sm:w-28" />
          </motion.div>
        ))}
      </div>
      <div className="relative mx-auto flex min-h-[calc(100dvh-140px)] max-w-6xl flex-col">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[0, 1, 2].map((item) => (
              <span
                key={item}
                className={`h-1.5 rounded-full transition-all ${item === screen ? "w-10 bg-acid" : "w-4 bg-white/15"}`}
              />
            ))}
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:border-acid/40"
          >
            Skip
          </Link>
        </div>
        <LiveSupabaseDashboard
          stats={stats.data}
          loading={stats.loading}
          unavailable={Boolean(stats.error)}
        />
        <AnimatePresence mode="wait">
          {screen === 0 ? (
            <motion.section
              key="welcome"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="m-auto grid w-full items-center gap-10 py-12 lg:grid-cols-[1.1fr_.9fr]"
            >
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-acid/25 bg-acid/10 px-4 py-2 text-sm text-acid">
                  <Sparkles className="h-4 w-4" />
                  Fitness and sports discovery across India
                </div>
                <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] text-white sm:text-7xl">
                  Find Fitness Coaches, Gyms and Sports Academies with FitSaathi
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                  FitSaathi helps you discover fitness coaches, personal
                  trainers, martial arts trainers, gyms, dojos and sports
                  academies across India, with clear provider profiles and
                  simple booking requests.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <button
                    onClick={() => setScreen(1)}
                    className="inline-flex items-center gap-2 rounded-full bg-acid px-7 py-4 font-bold text-ink shadow-glow"
                  >
                    Get Started <ArrowRight className="h-5 w-5" />
                  </button>
                  <Link
                    href={user ? dashboardPathForRole(user.role) : "/login"}
                    className="rounded-full border border-white/15 px-7 py-4 font-semibold text-white"
                  >
                    {user ? "My Account" : "Sign In"}
                  </Link>
                </div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="relative mx-auto aspect-square w-full max-w-md rounded-[3rem] border border-white/10 bg-gradient-to-br from-acid/20 via-white/[.04] to-royal/20 p-8 shadow-2xl"
              >
                <div className="grid h-full place-items-center rounded-[2.2rem] border border-white/10 bg-ink/70">
                  <div className="text-center">
                    <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-acid text-ink">
                      <Users className="h-14 w-14" />
                    </div>
                    <p className="mt-6 text-xl font-bold text-white">
                      Train together. Grow together.
                    </p>
                    <div className="mt-4 flex justify-center gap-3">
                      <ShieldCheck className="text-acid" />
                      <MessageCircle className="text-royal" />
                      <MapPin className="text-legendary" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.section>
          ) : screen === 1 ? (
            <motion.section
              key="features"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="m-auto w-full py-10"
            >
              <p className="text-sm font-semibold uppercase tracking-[.25em] text-acid">
                Everything fitness, one community
              </p>
              <h2 className="mt-3 text-4xl font-black text-white sm:text-6xl">
                Your people are already moving.
              </h2>
              <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {features.map(([emoji, title], index) => (
                  <motion.article
                    key={title}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -6 }}
                    className="rounded-3xl border border-white/10 bg-white/[.05] p-6 backdrop-blur"
                  >
                    <span className="text-4xl">{emoji}</span>
                    <h2 className="mt-5 text-lg font-bold text-white">
                      {title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Verified, privacy-first and built around genuine fitness
                      interests.
                    </p>
                  </motion.article>
                ))}
              </div>
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setScreen(0)}
                  className="rounded-full border border-white/10 px-5 py-3 text-zinc-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setScreen(2)}
                  className="inline-flex items-center gap-2 rounded-full bg-acid px-6 py-3 font-bold text-ink"
                >
                  Choose interests <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="interests"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="m-auto w-full py-10"
            >
              <p className="text-sm font-semibold uppercase tracking-[.25em] text-acid">
                Make it yours
              </p>
              <h2 className="mt-3 text-4xl font-black text-white sm:text-6xl">
                What gets you moving?
              </h2>
              <p className="mt-3 text-zinc-400">
                Select as many as you like. These power your matches and
                communities.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {SOCIAL_INTERESTS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      key={interest}
                      onClick={() => toggle(interest)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${selected ? "border-acid bg-acid text-ink" : "border-white/10 bg-white/[.04] text-zinc-300 hover:border-acid/40"}`}
                    >
                      {selected ? <Check className="h-4 w-4" /> : null}
                      {interest}
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-10 flex flex-wrap justify-between gap-3">
                <button
                  onClick={() => setScreen(1)}
                  className="rounded-full border border-white/10 px-5 py-3 text-zinc-300"
                >
                  Back
                </button>
                <button
                  onClick={register}
                  className="inline-flex items-center gap-2 rounded-full bg-acid px-7 py-3 font-bold text-ink"
                >
                  Create my profile <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function LiveSupabaseDashboard({
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
    { label: "Users", value: stats.users, icon: Users },
    { label: "Coaches", value: stats.coaches, icon: Dumbbell },
    { label: "Dojos", value: stats.dojos, icon: Trophy },
    { label: "Sellers", value: stats.sellers, icon: ShieldCheck },
    { label: "Bookings", value: stats.bookings, icon: Check },
  ];

  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-white/[.045] p-4 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-acid">
          <Sparkles className="h-4 w-4" />
          Live from Supabase
        </p>
        <span
          className={`rounded-full border px-3 py-1 text-xs ${unavailable ? "border-amber-300/30 text-amber-200" : "border-acid/30 text-acid"}`}
        >
          {loading ? "Loading" : unavailable ? "Unavailable" : "Live"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-ink/55 p-3"
          >
            <Icon className="h-4 w-4 text-acid" />
            <p className="mt-2 text-2xl font-black text-white">
              {loading ? "..." : value.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
