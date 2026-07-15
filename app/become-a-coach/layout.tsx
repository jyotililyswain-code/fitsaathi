import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Become a Fitness Coach on TheFitSaathi",
  description:
    "Register as a fitness coach, yoga trainer, martial arts coach, or home personal trainer and connect with students through TheFitSaathi.",
  path: "/become-a-coach",
  keywords: [
    "become fitness coach",
    "register trainer",
    "home coach registration",
    "personal trainer registration",
    "fitness trainer India",
  ],
  noIndex: true,
});

export default function BecomeCoachLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
