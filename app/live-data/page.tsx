import { LiveDataPanel } from "@/components/LiveDataPanel";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Live FitSaathi Data",
  description:
    "View current TheFitSaathi registration and booking totals from the live platform database.",
  path: "/live-data",
});

export default function LiveDataPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <LiveDataPanel />
    </main>
  );
}
