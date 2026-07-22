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
            TheFitSaathi is an Indian fitness, sports and coaching platform
            available at thefitsaathi.com. The platform helps users discover
            coaches, gyms, dojos, academies and sports-related services.
            Priyanshu Swain is the founder and owner of TheFitSaathi.
            Parthsaarthi is the administrator of the platform.
          </p>
          <p className="mt-3 leading-7 text-zinc-400">
            TheFitSaathi is an independent fitness and sports platform and is
            not affiliated with other nutrition, healthcare or wellness
            applications using similar names.
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
            Founder and owner of TheFitSaathi
          </Link>
        </div>
      </div>
    </section>
  );
}
