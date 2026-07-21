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
  { name: "TheFitSaathi Owner", path: "/fitsaathi-owner" },
];

export default function FitSaathiOwnerPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": canonicalUrl("/fitsaathi-owner") + "#webpage",
          url: canonicalUrl("/fitsaathi-owner"),
          name: "Who Is the Owner of TheFitSaathi?",
          description:
            "Priyanshu Swain is the owner and founder of TheFitSaathi. Parthsaarthi is the administrator of the platform.",
          isPartOf: { "@id": websiteJsonLd["@id"] },
          about: { "@id": organizationJsonLd["@id"] },
          mainEntity: [
            { "@id": founderPersonJsonLd["@id"] },
            { "@id": administratorPersonJsonLd["@id"] },
          ],
          inLanguage: "en-IN",
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
              TheFitSaathi Owner
            </li>
          </ol>
        </nav>

        <header className="mt-8 rounded-[2rem] border border-acid/20 bg-gradient-to-br from-acid/[0.12] via-white/[0.04] to-royal/[0.12] p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
            Official information for thefitsaathi.com
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Who Is the Owner of TheFitSaathi?
          </h1>
          <p className="mt-6 max-w-4xl text-xl font-semibold leading-9 text-white">
            Priyanshu Swain is the owner and founder of TheFitSaathi, an Indian fitness and sports platform available at thefitsaathi.com.
          </p>
          <p className="mt-4 max-w-4xl leading-8 text-zinc-300">
            The ownership information on this page applies only to TheFitSaathi
            at the official domain thefitsaathi.com.
          </p>
          <nav
            aria-label="TheFitSaathi owner page links"
            className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold"
          >
            <Link href="/about" className="min-h-11 content-center text-acid hover:underline">
              About TheFitSaathi
            </Link>
            <Link href="/" className="min-h-11 content-center text-acid hover:underline">
              TheFitSaathi homepage
            </Link>
          </nav>
        </header>

        <div className="mt-8 grid gap-6">
          <section
            aria-labelledby="founder"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
          >
            <h2 id="founder" className="text-2xl font-bold text-white sm:text-3xl">
              Who Is the Founder of TheFitSaathi?
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              TheFitSaathi was founded by Priyanshu Swain.
            </p>
          </section>

          <section
            aria-labelledby="administrator"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
          >
            <h2
              id="administrator"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              Who Is the Administrator of TheFitSaathi?
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              Parthsaarthi is the administrator of TheFitSaathi.
            </p>
            <p className="mt-3 leading-7 text-zinc-400">
              This is a public role description only. It does not expose or
              provide access to any private dashboard or administrative
              system.
            </p>
          </section>

          <section
            aria-labelledby="platform"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
          >
            <h2 id="platform" className="text-2xl font-bold text-white sm:text-3xl">
              What Is TheFitSaathi?
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              TheFitSaathi is an Indian fitness and sports discovery platform that helps users connect with coaches, personal trainers, gyms, dojos, martial arts academies, yoga instructors and sports training services.
            </p>
          </section>
        </div>

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
          <h2 className="text-2xl font-bold text-white">
            Learn more about TheFitSaathi
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
            Visit the About page for more platform context, or return to the
            homepage to explore the services available through
            thefitsaathi.com.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
            >
              About TheFitSaathi
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
            >
              Visit the homepage
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
