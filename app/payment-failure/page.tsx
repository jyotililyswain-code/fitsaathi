import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentFailurePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <section className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6">
        <XCircle className="h-10 w-10 text-red-300" />
        <h1 className="mt-4 text-3xl font-bold text-white">Payment failed</h1>
        <p className="mt-3 leading-7 text-zinc-300">No booking or dojo activation should be completed until Razorpay verification succeeds. Please retry from the original form.</p>
        <Link href="/booking" className="mt-6 inline-flex rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink">
          Retry booking
        </Link>
      </section>
    </main>
  );
}
