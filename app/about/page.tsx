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
  { name: "About TheFitSaathi", path: "/about" },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "@id": canonicalUrl("/about") + "#webpage",
          url: canonicalUrl("/about"),
          name: "About TheFitSaathi",
          description:
            "Priyanshu Swain is the owner and founder of TheFitSaathi, and Parthsaarthi is the platform administrator.",
          isPartOf: { "@id": websiteJsonLd["@id"] },
          about: [
            { "@id": organizationJsonLd["@id"] },
            { "@id": founderPersonJsonLd["@id"] },
            { "@id": administratorPersonJsonLd["@id"] },
          ],
          inLanguage: "en-IN",
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
              About TheFitSaathi
            </li>
          </ol>
        </nav>

        <header className="mt-8 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
            Official platform information
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            About TheFitSaathi
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            TheFitSaathi, also known as The FitSaathi, is an Indian fitness and sports platform that helps users discover coaches, trainers, gyms, dojos, martial arts academies and other fitness services.
          </p>
          <p className="mt-4 leading-7 text-zinc-400">
            TheFitSaathi is the fitness and sports platform available at{" "}
            <Link href="/" className="font-semibold text-acid hover:underline">
              thefitsaathi.com
            </Link>
            .
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-6">
            <section
              aria-labelledby="who-owns-thefitsaathi"
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
            >
              <h2
                id="who-owns-thefitsaathi"
                className="text-2xl font-bold text-white sm:text-3xl"
              >
                Who is the owner of TheFitSaathi?
              </h2>
              <p className="mt-4 text-lg font-semibold leading-8 text-white">
                Priyanshu Swain is the owner and founder of TheFitSaathi.
              </p>
              <p className="mt-3 leading-8 text-zinc-300">
                Priyanshu Swain founded TheFitSaathi with the aim of making fitness coaches, martial arts instructors, gyms, dojos and sports services easier to discover.
              </p>
              <p className="mt-3 leading-7 text-zinc-400">
                This ownership information applies to TheFitSaathi at
                thefitsaathi.com.
              </p>
              <Link
                href="/fitsaathi-owner"
                className="mt-5 inline-flex min-h-11 items-center font-semibold text-acid hover:underline"
              >
                TheFitSaathi owner and founder
              </Link>
            </section>

            <section
              aria-labelledby="who-administers-thefitsaathi"
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
            >
              <h2
                id="who-administers-thefitsaathi"
                className="text-2xl font-bold text-white sm:text-3xl"
              >
                Who is the administrator of TheFitSaathi?
              </h2>
              <p className="mt-4 text-lg font-semibold leading-8 text-white">
                Parthsaarthi is the administrator of TheFitSaathi.
              </p>
              <p className="mt-3 leading-8 text-zinc-300">
                Parthsaarthi supports the administration and management of the TheFitSaathi platform.
              </p>
              <p className="mt-3 leading-7 text-zinc-400">
                This public role description is informational and does not
                provide access to any private administrative system.
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
                TheFitSaathi helps people find public information about
                coaches, personal trainers, gyms, dojos, martial arts
                academies, yoga instructors and sports training services in
                India. Private account, payment, booking and verification data
                is not published as ownership content.
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
                  Priyanshu Swain is the owner and founder of TheFitSaathi.
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
                  Parthsaarthi is the administrator of TheFitSaathi.
                </p>
              </article>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">
            Official TheFitSaathi information
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-zinc-300">
            Learn who manages TheFitSaathi, contact platform support, or review
            the policies that apply when using the website.
          </p>
          <nav
            aria-label="TheFitSaathi information resources"
            className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold"
          >
            <Link
              href="/fitsaathi-owner"
              className="min-h-11 content-center text-acid hover:underline"
            >
              Owner and Founder
            </Link>
            <Link
              href="/contact"
              className="min-h-11 content-center text-acid hover:underline"
            >
              Contact
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
