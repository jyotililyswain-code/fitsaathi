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

const sectionClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8";

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
            "Learn about TheFitSaathi, an Indian fitness and sports platform founded and owned by Priyanshu Swain and administered by Parthsaarthi.",
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

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
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
            TheFitSaathi is an Indian fitness, sports and coaching platform
            available at thefitsaathi.com. The platform helps users discover
            coaches, gyms, dojos, academies and sports-related services.
          </p>
          <p className="mt-4 leading-8 text-zinc-400">
            TheFitSaathi is an independent fitness and sports platform and is
            not affiliated with other nutrition, healthcare or wellness
            applications using similar names.
          </p>
        </header>

        <div className="mt-12 grid gap-6">
          <section aria-labelledby="what-is-thefitsaathi" className={sectionClass}>
            <h2
              id="what-is-thefitsaathi"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              What is TheFitSaathi?
            </h2>
            <p className="mt-4 leading-8 text-zinc-300">
              TheFitSaathi is an Indian fitness, sports and coaching platform
              operating through the official domain thefitsaathi.com. It helps
              users discover coaches, gyms, dojos, academies and sports-related
              services.
            </p>
          </section>

          <section aria-labelledby="who-founded-thefitsaathi" className={sectionClass}>
            <h2
              id="who-founded-thefitsaathi"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              Who founded TheFitSaathi?
            </h2>
            <p className="mt-4 text-lg font-semibold leading-8 text-white">
              Priyanshu Swain founded TheFitSaathi.
            </p>
            <Link
              href="/fitsaathi-owner"
              className="mt-4 inline-flex min-h-11 items-center font-semibold text-acid hover:underline"
            >
              Priyanshu Swain, founder of TheFitSaathi
            </Link>
          </section>

          <section aria-labelledby="who-owns-thefitsaathi" className={sectionClass}>
            <h2
              id="who-owns-thefitsaathi"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              Who owns TheFitSaathi?
            </h2>
            <p className="mt-4 text-lg font-semibold leading-8 text-white">
              Priyanshu Swain is the owner of TheFitSaathi.
            </p>
          </section>

          <section
            aria-labelledby="who-administers-thefitsaathi"
            className={sectionClass}
          >
            <h2
              id="who-administers-thefitsaathi"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              Who administers TheFitSaathi?
            </h2>
            <p className="mt-4 text-lg font-semibold leading-8 text-white">
              Parthsaarthi is the administrator of TheFitSaathi.
            </p>
          </section>

          <section
            aria-labelledby="official-website-and-contact"
            className="rounded-3xl border border-acid/20 bg-acid/[0.07] p-6 sm:p-8"
          >
            <h2
              id="official-website-and-contact"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              Official website and contact details
            </h2>
            <p className="mt-4 text-lg font-semibold leading-8 text-white">
              The official website of TheFitSaathi is https://thefitsaathi.com.
            </p>
            <address className="mt-4 space-y-2 not-italic leading-7 text-zinc-300">
              <p>
                Website:{" "}
                <Link href="/" className="font-semibold text-acid hover:underline">
                  https://thefitsaathi.com
                </Link>
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:priyanshuswain2000@gmail.com"
                  className="break-all font-semibold text-acid hover:underline"
                >
                  priyanshuswain2000@gmail.com
                </a>
              </p>
              <p>
                Phone:{" "}
                <a href="tel:8447640449" className="font-semibold text-acid hover:underline">
                  8447640449
                </a>
              </p>
            </address>
            <Link
              href="/contact"
              className="mt-5 inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
            >
              Contact TheFitSaathi
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
