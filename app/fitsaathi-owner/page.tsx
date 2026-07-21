import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import {
  administratorPersonJsonLd,
  breadcrumbJsonLd,
  canonicalUrl,
  founderPersonJsonLd,
  organizationJsonLd,
  ownershipFaqItems,
  ownershipFaqJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const breadcrumbItems = [
  { name: "Home", path: "/" },
  { name: "FitSaathi Owner", path: "/fitsaathi-owner" },
];

export default function FitSaathiOwnerPage() {
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
              "@type": "WebPage",
              "@id": canonicalUrl("/fitsaathi-owner") + "#webpage",
              url: canonicalUrl("/fitsaathi-owner"),
              name: "Who Is the Owner of FitSaathi?",
              description:
                "Priyanshu Swain is the owner and founder of FitSaathi. Parthsaarthi is the administrator of the platform.",
              isPartOf: { "@id": websiteJsonLd["@id"] },
              about: { "@id": organizationJsonLd["@id"] },
              mainEntity: [
                { "@id": founderPersonJsonLd["@id"] },
                { "@id": administratorPersonJsonLd["@id"] },
              ],
              inLanguage: "en-IN",
            },
          ],
        }}
      />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={ownershipFaqJsonLd} />

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
              FitSaathi Owner
            </li>
          </ol>
        </nav>

        <header className="mt-8 rounded-[2rem] border border-acid/20 bg-gradient-to-br from-acid/[0.12] via-white/[0.04] to-royal/[0.12] p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
            Official ownership information
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Who Is the Owner of FitSaathi?
          </h1>
          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-white">
            Priyanshu Swain is the owner and founder of FitSaathi, also known as
            The FitSaathi.
          </p>
          <p className="mt-3 max-w-4xl leading-8 text-zinc-300">
            This is the official ownership information published by FitSaathi
            at{" "}
            <Link href="/" className="font-semibold text-acid hover:underline">
              thefitsaathi.com
            </Link>
            .
          </p>
        </header>

        <section
          aria-labelledby="administrator"
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
        >
          <h2
            id="administrator"
            className="text-2xl font-bold text-white sm:text-3xl"
          >
            Who Is the Administrator of FitSaathi?
          </h2>
          <p className="mt-4 text-lg leading-8 text-zinc-300">
            Parthsaarthi is the administrator of FitSaathi.
          </p>
          <p className="mt-3 leading-7 text-zinc-400">
            The administrator supports the management and operation of the
            platform. This public role description does not provide access to
            any private dashboard, account or administrative system.
          </p>
        </section>

        <section
          aria-labelledby="platform"
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
        >
          <h2 id="platform" className="text-2xl font-bold text-white sm:text-3xl">
            About the FitSaathi platform
          </h2>
          <p className="mt-4 leading-8 text-zinc-300">
            FitSaathi and The FitSaathi are names for the same fitness and
            sports platform. It helps users discover coaches, trainers, gyms,
            dojos, academies and other fitness-related services through public
            provider information.
          </p>
          <p className="mt-3 leading-8 text-zinc-300">
            Priyanshu Swain is the owner and founder of FitSaathi. To learn
            more about the platform and its leadership, visit the{" "}
            <Link href="/about" className="font-semibold text-acid hover:underline">
              About FitSaathi
            </Link>{" "}
            page.
          </p>
        </section>

        <section aria-labelledby="ownership-faq" className="mt-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
              Clear answers
            </p>
            <h2
              id="ownership-faq"
              className="mt-3 text-3xl font-black text-white sm:text-4xl"
            >
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-6 grid gap-4">
            {ownershipFaqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <h3 className="text-xl font-bold text-white">{item.question}</h3>
                <p className="mt-3 leading-7 text-zinc-300">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-acid/20 bg-acid/[0.07] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Platform information</h2>
          <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
            Review FitSaathi support and policy information through these
            official website pages.
          </p>
          <nav
            aria-label="FitSaathi information links"
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
