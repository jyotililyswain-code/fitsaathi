import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Fitness Products and Sports Equipment",
  description:
    "Browse approved fitness products, gym equipment, martial arts gear, and training essentials on TheFitSaathi.",
  path: "/products",
  keywords: ["fitness products India", "gym equipment", "martial arts gear"],
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
