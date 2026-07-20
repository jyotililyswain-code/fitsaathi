import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Find Dojos and Martial Arts Academies",
  description:
    "Explore public dojo, gym and martial arts academy profiles for supported training options on FitSaathi.",
  path: "/dojos",
  keywords: [
    "dojo near me",
    "karate classes near me",
    "martial arts academy",
    "dojo gym registration",
    "fitness academy India",
  ],
});

export default function DojosLayout({ children }: { children: ReactNode }) {
  return children;
}
