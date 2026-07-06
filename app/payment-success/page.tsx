import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <section className="rounded-2xl border border-acid/30 bg-acid/10 p-6">
        <CheckCircle2 className="h-10 w-10 text-acid" />
        <h1 className="mt-4 text-3xl font-bold text-white">Payment submitted</h1>
        <p className="mt-3 leading-7 text-zinc-300">Your UPI transaction ID has been recorded. Your booking, order, or registration will be confirmed only after admin verification.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink">
          Open dashboard
        </Link>
      </section>
    </main>
  );
}
