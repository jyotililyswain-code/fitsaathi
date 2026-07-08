import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Become a Fitness Coach on FitSaathi",
  description:
    "Register as a fitness coach, yoga trainer, martial arts coach, or home personal trainer and connect with students through FitSaathi.",
  path: "/become-a-coach",
  keywords: [
    "become fitness coach",
    "register trainer",
    "home coach registration",
    "personal trainer registration",
    "fitness trainer India",
  ],
});

export default function BecomeCoachLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
