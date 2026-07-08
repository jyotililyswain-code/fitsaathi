import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Shop Fitness Products - FitSaathi",
  description:
    "Explore fitness products, sports equipment, and training essentials from sellers on FitSaathi.",
  path: "/shop",
  keywords: [
    "fitness shop",
    "sports equipment",
    "fitness products India",
    "gym products",
    "martial arts gear",
  ],
});

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children;
}
