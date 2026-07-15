import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Find Dojos, Gyms and Fitness Academies",
  description:
    "Discover karate, boxing, martial arts, yoga, gyms, and fitness studios near you or register your academy on TheFitSaathi.",
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
