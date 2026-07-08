import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Register Your Dojo or Fitness Academy - FitSaathi",
  description:
    "Register a martial arts dojo, yoga center, or fitness academy on FitSaathi and connect with students in India.",
  path: "/register-dojo",
  keywords: [
    "dojo registration",
    "register martial arts academy",
    "fitness academy India",
  ],
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
