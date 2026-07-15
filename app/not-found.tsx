import Link from "next/link";
import { Home, Search, Send } from "lucide-react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Page Not Found",
  description:
    "The requested TheFitSaathi page could not be found. Browse coaches, dojos, academies and fitness services instead.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-16 text-center sm:px-6">
      <section>
        <p className="text-sm font-semibold uppercase text-acid">404</p>
        <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">
          Page Not Found
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-zinc-400">
          The page you are looking for may have moved or does not exist.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-lg bg-acid px-5 py-3 font-semibold text-ink transition hover:bg-white"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Link>
          <Link
            href="/find-coach"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-acid/50 hover:text-acid"
          >
            <Search className="h-4 w-4" />
            Find Coach
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-acid/50 hover:text-acid"
          >
            <Send className="h-4 w-4" />
            Contact Support
          </Link>
        </div>
      </section>
    </main>
  );
}
