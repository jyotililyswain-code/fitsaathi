import Link from "next/link";
import { HelpCircle } from "lucide-react";

const faqs = [
  ["How does FitSaathi verify coaches?", "Coach profiles can be reviewed for identity, experience, category, city, pricing, attendance, reviews, and badge eligibility before premium visibility."],
  ["What does attendance reliability mean?", "Green means very low absence, Yellow means moderate leaves, and Red means high absence or repeated cancellations. The score becomes meaningful only after real attendance records exist."],
  ["Are home classes refundable?", "Home classes are not refundable. A one-time trainer replacement may be available within the first week after review."],
  ["Are dojo packages refundable?", "Dojo and training class packages may qualify for partial refund review only for the first package or first month, with platform service fees retained."],
  ["Can I book martial arts or traditional arts?", "Yes. FitSaathi supports categories such as Karate, MMA, Boxing, Taekwondo, Kalaripayattu, yoga, gymnastics, calisthenics, and personal training."],
  ["How do payments work?", "Pay with PhonePe or another UPI app, then enter the transaction/reference ID. An administrator verifies the payment before the booking, order, or service is confirmed."],
  ["Can coaches earn badges?", "Yes. Verified, Elite, and Legendary badge tiers are designed around real activity, reliability, customer outcomes, and policy compliance."],
  ["How do I delete my data?", "Contact FitSaathi support. Eligible account data can be reviewed for correction or deletion subject to legal, payment, safety, and dispute retention needs."]
];

export default function FAQPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-acid/30 bg-acid/10 px-4 py-2 text-sm text-acid">
          <HelpCircle className="h-4 w-4" />
          FitSaathi help
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-300">Straight answers about bookings, refunds, verification, badges, attendance, payments, and safety.</p>
      </div>

      <section className="mt-10 grid gap-4">
        {faqs.map(([question, answer]) => (
          <article key={question} className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-xl font-semibold text-white">{question}</h2>
            <p className="mt-3 leading-7 text-zinc-400">{answer}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-acid/20 bg-acid/[0.08] p-6">
        <h2 className="text-xl font-semibold text-white">Still need help?</h2>
        <p className="mt-2 text-zinc-300">Reach support for refunds, safety reports, data deletion, booking questions, or coach verification.</p>
        <Link href="/contact" className="mt-5 inline-flex rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white">
          Contact support
        </Link>
      </section>
    </main>
  );
}
