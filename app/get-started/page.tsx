import { ArrowRight, CalendarCheck, Dumbbell, Handshake, Search, ShoppingBag, Store, UserPlus, UsersRound } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Register as User",
    body: "Create your verified FitSaathi profile and choose your interests.",
    href: "/signup",
    icon: UserPlus
  },
  {
    title: "Become a Coach",
    body: "Register as a coach and start accepting training bookings.",
    href: "/become-a-coach",
    icon: Dumbbell
  },
  {
    title: "Register as Seller",
    body: "Open your seller profile and list fitness products.",
    href: "/seller",
    icon: Store
  },
  {
    title: "Find Coach",
    body: "Browse verified coaches by specialty, city and availability.",
    href: "/coaches",
    icon: Search
  },
  {
    title: "Find Fitness Partner",
    body: "Use FitSaathi Life to discover training partners with shared goals.",
    href: "/life",
    icon: UsersRound
  },
  {
    title: "Browse Dojos",
    body: "Explore approved dojos and martial arts academies.",
    href: "/dojos",
    icon: Handshake
  },
  {
    title: "Booking",
    body: "Book a coach or dojo session and track attendance.",
    href: "/booking",
    icon: CalendarCheck
  },
  {
    title: "Shop",
    body: "Shop trusted fitness gear, recovery tools and essentials.",
    href: "/shop",
    icon: ShoppingBag
  }
];

export default function GetStartedPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-acid/10 via-white/[.04] to-royal/10 p-8 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[.22em] text-acid">Choose your path</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-6xl">What do you want to do on FitSaathi?</h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-300">
          Pick a feature and continue to the original page. Nothing has been removed — this page simply brings every main flow back into one clean starting point.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ title, body, href, icon: Icon }) => (
          <Link key={title} href={href} className="group rounded-3xl border border-white/10 bg-white/[.04] p-6 transition hover:-translate-y-1 hover:border-acid/40 hover:bg-white/[.07]">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-acid/10 text-acid">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-white">{title}</h2>
            <p className="mt-2 min-h-14 text-sm leading-6 text-zinc-400">{body}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-acid">
              Open feature <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
