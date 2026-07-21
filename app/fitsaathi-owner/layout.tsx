import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "FitSaathi Owner: Priyanshu Swain | The FitSaathi",
  description:
    "Priyanshu Swain is the owner and founder of FitSaathi. Parthsaarthi is the administrator of The FitSaathi platform.",
  path: "/fitsaathi-owner",
});

export default function FitSaathiOwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
