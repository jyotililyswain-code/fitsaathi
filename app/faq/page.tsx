import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { generateSeoMetadata } from "@/lib/seo";

const faqs = [
  [
    "What is TheFitSaathi?",
    "TheFitSaathi is a fitness and sports discovery platform where people can explore public coach, dojo, gym, martial-arts training and fitness marketplace information across India.",
  ],
  [
    "What is the official TheFitSaathi website?",
    "The official TheFitSaathi website is https://thefitsaathi.com. The FitSaathi and FitSaathi are readable alternatives for the same platform on that domain.",
  ],
  [
    "How can I find a fitness coach on FitSaathi?",
    "Open Find Fitness Coaches, search by training specialty or city, and compare the information shown on approved public coach profiles. A profile's booking option leads to the signed-in booking-request flow.",
  ],
  [
    "Can dojos and gyms register on FitSaathi?",
    "Yes. Dojo, gym, martial-arts academy, yoga-centre and fitness-centre operators can create an account and submit their organisation through the dojo and gym registration flow.",
  ],
  [
    "Does FitSaathi include martial-arts training?",
    "Yes. Public profiles can include martial-arts teachers, coaches, dojos and academies for activities such as karate, boxing, MMA and self-defence when those providers are available on the platform.",
  ],
  [
    "How can coaches join FitSaathi?",
    "Create or sign in to a FitSaathi account, open Become a Coach, and submit the requested profile and verification information. Public visibility follows the platform's provider-status and account rules.",
  ],
  [
    "How can I contact FitSaathi support?",
    "Use the public Contact page or the Customer Care controls in the website navigation and footer for account, registration, booking, marketplace or safety questions.",
  ],
  [
    "Is a FitSaathi account required to send a booking request?",
    "Yes. The booking flow is private, so you must sign in to a FitSaathi account before sending a coach, dojo or gym booking request.",
  ],
  [
    "Can sellers list fitness products?",
    "Yes. Fitness sellers can register and submit sports equipment, training essentials and other fitness products for approval. Product purchases are separate from free account and provider registration flows.",
  ],
  [
    "How can I report a problem?",
    "Use Report a Problem in the footer or dashboard to contact support about a booking, registration, coach, dojo, account, or marketplace order issue.",
  ],
  [
    "Are registration, verification, and booking really free?",
    "Yes. FitSaathi charges nothing for account registration, coach or dojo registration, identity verification, or coach and dojo booking. There are no platform fees or hidden charges for these services. Shop purchases are separate, and the product and delivery total is shown before an order is placed.",
  ],
  [
    "How is private verification information handled?",
    "Identity documents and private verification details are used for review and are not displayed in public coach or dojo SEO content. Identity verification is free and does not require payment evidence.",
  ],
] as const;

export const metadata = generateSeoMetadata({
  title: "TheFitSaathi Frequently Asked Questions",
  description:
    "Find answers about TheFitSaathi accounts, coaches, dojos, gyms, bookings, registration and platform features.",
  path: "/faq",
  keywords: [
    "FitSaathi FAQ",
    "fitness coach booking questions",
    "dojo registration help",
    "seller registration help",
  ],
});

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <JsonLd data={faqSchema} />
      <div className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-acid/30 bg-acid/10 px-4 py-2 text-sm text-acid">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          TheFitSaathi help
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-300">
          Clear answers about finding coaches, booking training, registrations,
          free platform services, shop totals, support, and safety.
        </p>
      </div>

      <section
        className="mt-10 grid gap-4"
        aria-label="FitSaathi questions and answers"
      >
        {faqs.map(([question, answer]) => (
          <article
            key={question}
            className="rounded-2xl border border-white/10 bg-white/[0.05] p-6"
          >
            <h2 className="text-xl font-semibold text-white">{question}</h2>
            <p className="mt-3 leading-7 text-zinc-400">{answer}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-acid/20 bg-acid/[0.08] p-6">
        <h2 className="text-xl font-semibold text-white">Still need help?</h2>
        <p className="mt-2 text-zinc-300">
          Contact FitSaathi support for booking, safety, registration,
          marketplace order, or account questions.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
          >
            Contact FitSaathi support
          </Link>
          <Link
            href="/find-coach"
            className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-acid/50 hover:text-acid"
          >
            Find fitness coaches near you
          </Link>
        </div>
      </section>
    </main>
  );
}
