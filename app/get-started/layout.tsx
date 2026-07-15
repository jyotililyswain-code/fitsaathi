import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Get Started",
  description:
    "Choose how you want to use TheFitSaathi for coaches, dojos, fitness partners, bookings, or shopping.",
  path: "/get-started",
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
