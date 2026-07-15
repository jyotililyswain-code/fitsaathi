import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Browse Fitness Coach Profiles in India",
  description:
    "Browse approved TheFitSaathi coach profiles by specialty and city, including personal trainers, yoga teachers, martial arts coaches and sports instructors.",
  path: "/coaches",
  keywords: [
    "find coach",
    "fitness coach near me",
    "home fitness coach",
    "personal trainer at home",
    "yoga trainer",
    "martial arts coach",
  ],
});

export default function CoachesLayout({ children }: { children: ReactNode }) {
  return children;
}
