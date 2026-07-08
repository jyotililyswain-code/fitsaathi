import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { generateSeoMetadata } from "@/lib/seo";

const faqs = [
  [
    "What is FitSaathi?",
    "FitSaathi is a fitness marketplace where users can find coaches, dojos, trainers, fitness services, and products.",
  ],
  [
    "How can I find a fitness coach near me?",
    "Open Find Coach, then search by training specialty or city to compare available coach profiles.",
  ],
  [
    "Can I book a personal trainer at home?",
    "Yes. Choose an available coach, open their profile, and use the booking option to request home fitness training.",
  ],
  [
    "Can martial arts coaches register?",
    "Yes. Karate, boxing, MMA, self-defense, and other martial arts instructors can submit a coach profile for verification.",
  ],
  [
    "Can dojos and academies register?",
    "Yes. Dojos, yoga centers, and fitness academies can register, provide their details, and connect with students after approval.",
  ],
  [
    "Can sellers sell fitness products?",
    "Yes. Fitness sellers can register and submit sports equipment, training essentials, and other fitness products for approval.",
  ],
  [
    "How can I contact customer care?",
    "Use the Customer Care option in the navigation or footer to email or call FitSaathi support.",
  ],
  [
    "Is FitSaathi available in India?",
    "Yes. FitSaathi is designed for customers, coaches, dojos, and fitness sellers across India.",
  ],
  [
    "How does coach booking work?",
    "Find a coach, review the public profile and availability, open the booking form, and submit the required booking and payment details.",
  ],
  [
    "How can I report a problem?",
    "Use Report a Problem in the footer or dashboard to contact support about booking, registration, payment, coach, dojo, or account issues.",
  ],
  [
    "How do payments work?",
    "Pay with PhonePe or another UPI app and enter the transaction reference. The payment status and booking confirmation are then recorded by FitSaathi.",
  ],
  [
    "How is private verification information handled?",
    "Identity documents and private verification details are used for review and are not displayed in public coach or dojo SEO content.",
  ],
] as const;

export const metadata = generateSeoMetadata({
  title: "FitSaathi FAQ - Fitness Coach, Dojo & Booking Questions",
  description:
    "Read common questions about FitSaathi coach booking, dojo registration, seller registration, payments, support, and safety.",
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
          FitSaathi help
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-300">
          Clear answers about finding coaches, booking training, registrations,
          payments, support, and safety.
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
          Contact FitSaathi support for booking, safety, registration, payment,
          or account questions.
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
