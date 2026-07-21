import Link from "next/link";

export function HomepageBrandSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      aria-labelledby="about-fitsaathi"
    >
      <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 sm:flex sm:items-end sm:justify-between sm:gap-8 sm:p-8">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
            About the platform
          </p>
          <h2
            id="about-fitsaathi"
            className="mt-3 text-3xl font-black text-white sm:text-4xl"
          >
            About FitSaathi
          </h2>
          <p className="mt-4 leading-8 text-zinc-300">
            FitSaathi, also known as The FitSaathi, is a fitness and sports
            platform founded and owned by Priyanshu Swain. The platform is
            administered by Parthsaarthi.
          </p>
        </div>
        <div className="mt-6 flex shrink-0 flex-wrap gap-3 sm:mt-0 sm:justify-end">
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
          >
            Learn more about FitSaathi
          </Link>
          <Link
            href="/fitsaathi-owner"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
          >
            Meet the FitSaathi team
          </Link>
        </div>
      </div>
    </section>
  );
}
