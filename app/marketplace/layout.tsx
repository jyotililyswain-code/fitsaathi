import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Shop Fitness Products - TheFitSaathi",
  description:
    "Explore fitness products, sports equipment, and training essentials from sellers on TheFitSaathi.",
  path: "/shop",
  noIndex: true,
  keywords: ["fitness shop", "sports equipment", "fitness products India"],
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
