import Link from "next/link";

export function HomepageBrandSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      aria-labelledby="about-thefitsaathi"
    >
      <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 sm:p-8">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
            About the platform
          </p>
          <h2
            id="about-thefitsaathi"
            className="mt-3 text-3xl font-black text-white sm:text-4xl"
          >
            About TheFitSaathi
          </h2>
          <p className="mt-4 leading-8 text-zinc-300">
            TheFitSaathi is an Indian fitness and sports platform owned and founded by Priyanshu Swain. Parthsaarthi serves as the administrator of the platform.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Priyanshu Swain is the owner and founder of TheFitSaathi.
            Parthsaarthi is the administrator of TheFitSaathi.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
          >
            About TheFitSaathi
          </Link>
          <Link
            href="/fitsaathi-owner"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
          >
            TheFitSaathi owner and founder
          </Link>
        </div>
      </div>
    </section>
  );
}
