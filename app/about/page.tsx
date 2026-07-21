import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import {
  administratorPersonJsonLd,
  breadcrumbJsonLd,
  canonicalUrl,
  founderPersonJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const breadcrumbItems = [
  { name: "Home", path: "/" },
  { name: "About FitSaathi", path: "/about" },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            organizationJsonLd,
            founderPersonJsonLd,
            administratorPersonJsonLd,
            websiteJsonLd,
            {
              "@type": "AboutPage",
              "@id": canonicalUrl("/about") + "#webpage",
              url: canonicalUrl("/about"),
              name: "About FitSaathi",
              description:
                "FitSaathi is owned and founded by Priyanshu Swain, and Parthsaarthi serves as its administrator.",
              isPartOf: { "@id": websiteJsonLd["@id"] },
              about: [
                { "@id": organizationJsonLd["@id"] },
                { "@id": founderPersonJsonLd["@id"] },
                { "@id": administratorPersonJsonLd["@id"] },
              ],
              inLanguage: "en-IN",
            },
          ],
        }}
      />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition hover:text-acid">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-zinc-600">
              &gt;
            </li>
            <li aria-current="page" className="text-zinc-200">
              About FitSaathi
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
            Official platform information
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            About FitSaathi
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            FitSaathi, also known as The FitSaathi, is the fitness and sports
            platform available at the official website{" "}
            <Link href="/" className="font-semibold text-acid hover:underline">
              thefitsaathi.com
            </Link>
            .
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-6">
            <section
              aria-labelledby="who-owns-fitsaathi"
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
            >
              <h2
                id="who-owns-fitsaathi"
                className="text-2xl font-bold text-white sm:text-3xl"
              >
                Who owns FitSaathi?
              </h2>
              <p className="mt-4 leading-8 text-zinc-300">
                FitSaathi, also known as The FitSaathi, is owned and founded by
                Priyanshu Swain. Priyanshu Swain is the owner and founder of
                FitSaathi.
              </p>
              <Link
                href="/fitsaathi-owner"
                className="mt-5 inline-flex min-h-11 items-center font-semibold text-acid hover:underline"
              >
                Read about the FitSaathi owner and founder
              </Link>
            </section>

            <section
              aria-labelledby="who-manages-fitsaathi"
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
            >
              <h2
                id="who-manages-fitsaathi"
                className="text-2xl font-bold text-white sm:text-3xl"
              >
                Who manages FitSaathi?
              </h2>
              <p className="mt-4 leading-8 text-zinc-300">
                Parthsaarthi serves as the administrator of FitSaathi and
                supports the management and operation of the platform.
                Parthsaarthi is the administrator of FitSaathi.
              </p>
            </section>

            <section
              aria-labelledby="about-the-platform"
              className="rounded-3xl border border-acid/20 bg-acid/[0.07] p-6 sm:p-8"
            >
              <h2
                id="about-the-platform"
                className="text-2xl font-bold text-white sm:text-3xl"
              >
                About the platform
              </h2>
              <p className="mt-4 leading-8 text-zinc-300">
                FitSaathi is a fitness and sports platform designed to connect
                users with coaches, trainers, gyms, dojos, academies and other
                fitness-related services. Visitors can explore approved public
                provider information without exposing private account,
                booking, payment or administrative data.
              </p>
            </section>
          </div>

          <section
            aria-labelledby="leadership"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <h2 id="leadership" className="text-2xl font-bold text-white">
              Leadership
            </h2>
            <div className="mt-5 grid gap-4">
              <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-acid text-lg font-black text-ink"
                >
                  PS
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[.16em] text-acid">
                  Owner and Founder
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  Priyanshu Swain
                </h3>
                <p className="mt-3 leading-7 text-zinc-400">
                  Priyanshu Swain is the owner and founder of FitSaathi.
                </p>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal text-lg font-black text-white"
                >
                  P
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[.16em] text-acid">
                  Administrator
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  Parthsaarthi
                </h3>
                <p className="mt-3 leading-7 text-zinc-400">
                  Parthsaarthi manages administrative responsibilities for the
                  FitSaathi platform.
                </p>
              </article>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">
            Learn more about FitSaathi
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-zinc-300">
            Find platform support and review the policies that apply when you
            use FitSaathi.
          </p>
          <nav
            aria-label="About FitSaathi resources"
            className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold"
          >
            <Link
              href="/contact"
              className="min-h-11 content-center text-acid hover:underline"
            >
              Contact Us
            </Link>
            <Link
              href="/privacy"
              className="min-h-11 content-center text-acid hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="min-h-11 content-center text-acid hover:underline"
            >
              Terms and Conditions
            </Link>
          </nav>
        </section>
      </main>
    </>
  );
}
