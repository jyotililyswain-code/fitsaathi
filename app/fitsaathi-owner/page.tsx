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
  { name: "Priyanshu Swain", path: "/fitsaathi-owner" },
];

const sectionClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8";

export default function FitSaathiOwnerPage() {
  return (
    <>
      <JsonLd data={founderPersonJsonLd} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "@id": canonicalUrl("/fitsaathi-owner") + "#webpage",
          url: canonicalUrl("/fitsaathi-owner"),
          name: "Priyanshu Swain — Founder and Owner of TheFitSaathi",
          description:
            "Priyanshu Swain is the founder and owner of TheFitSaathi, the Indian fitness, sports and coaching platform available at thefitsaathi.com.",
          isPartOf: { "@id": websiteJsonLd["@id"] },
          about: { "@id": organizationJsonLd["@id"] },
          mainEntity: { "@id": founderPersonJsonLd["@id"] },
          mentions: { "@id": administratorPersonJsonLd["@id"] },
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
              Priyanshu Swain
            </li>
          </ol>
        </nav>

        <header className="mt-8 rounded-[2rem] border border-acid/20 bg-gradient-to-br from-acid/[0.12] via-white/[0.04] to-royal/[0.12] p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
            Official information for thefitsaathi.com
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Priyanshu Swain — Founder and Owner of TheFitSaathi
          </h1>
          <p className="mt-6 max-w-4xl text-lg leading-9 text-zinc-200">
            Priyanshu Swain is the founder and owner of TheFitSaathi.
            TheFitSaathi is an Indian fitness, sports and coaching platform
            operating through the official domain thefitsaathi.com.
          </p>
        </header>

        <div className="mt-8 grid gap-6">
          <section aria-labelledby="about-priyanshu-swain" className={sectionClass}>
            <h2
              id="about-priyanshu-swain"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              About Priyanshu Swain
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              Priyanshu Swain founded TheFitSaathi.
            </p>
          </section>

          <section aria-labelledby="role-at-thefitsaathi" className={sectionClass}>
            <h2
              id="role-at-thefitsaathi"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              Role at TheFitSaathi
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              Priyanshu Swain is the founder and owner of TheFitSaathi.
            </p>
            <p className="mt-3 leading-7 text-zinc-400">
              Parthsaarthi is the administrator of TheFitSaathi.
            </p>
          </section>

          <section aria-labelledby="about-the-platform" className={sectionClass}>
            <h2
              id="about-the-platform"
              className="text-2xl font-bold text-white sm:text-3xl"
            >
              About the platform
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              TheFitSaathi is an Indian fitness, sports and coaching platform
              that helps users discover coaches, gyms, dojos, academies and
              sports-related services.
            </p>
            <p className="mt-3 leading-7 text-zinc-400">
              TheFitSaathi is an independent platform and is not affiliated
              with other nutrition, healthcare or wellness applications using
              similar names.
            </p>
          </section>

          <section
            aria-labelledby="official-links"
            className="rounded-3xl border border-acid/20 bg-acid/[0.07] p-6 sm:p-8"
          >
            <h2 id="official-links" className="text-2xl font-bold text-white sm:text-3xl">
              Official links
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              The official website of TheFitSaathi is https://thefitsaathi.com.
            </p>
            <nav
              aria-label="Official TheFitSaathi links"
              className="mt-5 flex flex-wrap gap-3"
            >
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
              >
                Official TheFitSaathi website
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
              >
                About TheFitSaathi
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
              >
                Contact TheFitSaathi
              </Link>
            </nav>
          </section>
        </div>

        <section aria-labelledby="ownership-faq" className="mt-12">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-acid">
            Clear answers
          </p>
          <h2
            id="ownership-faq"
            className="mt-3 text-3xl font-black text-white sm:text-4xl"
          >
            Frequently asked questions
          </h2>
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
      </main>
    </>
  );
}
