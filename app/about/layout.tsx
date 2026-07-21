import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "About TheFitSaathi | Owner Priyanshu Swain",
  description:
    "Learn about TheFitSaathi. Priyanshu Swain is the owner and founder of TheFitSaathi, and Parthsaarthi is the platform administrator.",
  openGraphTitle: "About TheFitSaathi | Owner and Founder",
  openGraphDescription:
    "Priyanshu Swain is the owner and founder of TheFitSaathi. Parthsaarthi is the administrator of the platform.",
  path: "/about",
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
