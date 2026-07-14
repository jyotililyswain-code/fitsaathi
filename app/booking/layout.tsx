import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Book Fitness Coaches and Dojos - FitSaathi",
  description:
    "Book trusted fitness coaches, martial arts trainers, yoga teachers, and dojo classes through FitSaathi.",
  path: "/booking",
  keywords: [
    "book fitness coach",
    "book personal trainer",
    "book dojo",
    "fitness booking India",
  ],
  noIndex: true,
});

export default function BookingLayout({ children }: { children: ReactNode }) {
  return children;
}
