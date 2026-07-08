import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Find and Register Dojos & Martial Arts Academies - FitSaathi",
  description:
    "Discover karate, boxing, martial arts, yoga, and fitness dojos near you or register your academy on FitSaathi.",
  path: "/dojos",
  keywords: [
    "dojo near me",
    "karate classes near me",
    "martial arts academy",
    "dojo registration",
    "fitness academy India",
  ],
});

export default function DojosLayout({ children }: { children: ReactNode }) {
  return children;
}
