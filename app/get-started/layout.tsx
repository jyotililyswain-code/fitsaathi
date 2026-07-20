import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Get Started",
  description:
    "Choose how you want to use FitSaathi for coaches, dojos, fitness partners, bookings, or shopping.",
  path: "/get-started",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
