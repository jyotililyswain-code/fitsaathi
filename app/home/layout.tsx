import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { coachBookingServiceJsonLd, generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Fitness Coaches, Dojos and Trainers in India",
  description:
    "FitSaathi helps you find home fitness coaches, personal trainers, yoga teachers, martial arts classes, dojos, and fitness services in India.",
  path: "/home",
  keywords: [
    "FitSaathi",
    "fitness coach near me",
    "personal trainer at home",
    "yoga trainer near me",
    "martial arts classes near me",
    "dojo near me",
    "fitness marketplace India",
  ],
});

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...coachBookingServiceJsonLd,
        }}
      />
      {children}
    </>
  );
}
