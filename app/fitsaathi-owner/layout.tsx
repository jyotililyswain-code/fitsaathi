import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Who Is the Owner of TheFitSaathi? | Priyanshu Swain",
  description:
    "Priyanshu Swain is the founder and owner of TheFitSaathi, the Indian fitness, sports and coaching platform available at thefitsaathi.com.",
  path: "/fitsaathi-owner",
});

export default function FitSaathiOwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
