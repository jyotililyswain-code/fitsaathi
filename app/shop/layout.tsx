import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Fitness and Sports Shop",
  description:
    "Browse fitness and sports products available through FitSaathi sellers.",
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
