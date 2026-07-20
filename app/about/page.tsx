import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
        Official platform information
      </p>
      <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
        About FitSaathi
      </h1>
      <p className="mt-6 max-w-4xl text-lg leading-8 text-zinc-300">
        FitSaathi is a fitness and sports discovery platform for customers,
        coaches, dojos, gyms, martial-arts academies and fitness sellers across
        India. Its official website is{" "}
        <Link href="/" className="font-medium text-acid hover:underline">
          thefitsaathi.com
        </Link>
        . The platform helps visitors find public provider information while
        keeping private account, identity, payment, booking and conversation
        data outside public pages and search metadata.
      </p>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold text-white">
            Discover training options
          </h2>
          <p className="mt-3 leading-7 text-zinc-400">
            Customers can compare the information shown on approved public
            coach and dojo profiles, including listed specialties, locations
            and available training details. FitSaathi supports discovery for
            personal fitness, yoga, sports coaching and martial-arts training.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/find-coach"
              className="rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink"
            >
              Find Fitness Coaches
            </Link>
            <Link
              href="/dojos"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white"
            >
              Explore Dojos and Gyms
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold text-white">
            Create a public provider profile
          </h2>
          <p className="mt-3 leading-7 text-zinc-400">
            Coaches can submit a coaching profile, and dojo or gym operators
            can register their organisation. Public visibility follows the
            platform&apos;s actual approval and account-status rules. FitSaathi
            does not publish private verification documents in profile SEO.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/become-a-coach"
              className="rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink"
            >
              Become a Coach
            </Link>
            <Link
              href="/register-dojo"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white"
            >
              Register a Dojo or Gym
            </Link>
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-3xl border border-acid/20 bg-acid/[0.07] p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white">
          Clear information and real support
        </h2>
        <p className="mt-3 max-w-4xl leading-7 text-zinc-300">
          FitSaathi uses real platform records for public profiles and live
          activity rather than invented testimonials or marketing counts.
          Visitors can review platform guidance, learn how registrations and
          booking requests work, and contact support when they need help.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
          <Link href="/" className="text-acid hover:underline">
            FitSaathi homepage
          </Link>
          <Link href="/faq" className="text-acid hover:underline">
            Read FitSaathi FAQs
          </Link>
          <Link href="/contact" className="text-acid hover:underline">
            Contact FitSaathi Support
          </Link>
          <Link href="/policies" className="text-acid hover:underline">
            Read FitSaathi policies
          </Link>
        </div>
      </section>
    </main>
  );
}
