import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "TheFitSaathi Owner and Founder | Priyanshu Swain",
  description:
    "Priyanshu Swain is the owner and founder of TheFitSaathi. Parthsaarthi is the administrator of the Indian fitness and sports platform.",
  openGraphTitle: "Who Is the Owner of TheFitSaathi?",
  openGraphDescription:
    "Priyanshu Swain is the owner and founder of TheFitSaathi, and Parthsaarthi is its administrator.",
  path: "/fitsaathi-owner",
});

export default function FitSaathiOwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
