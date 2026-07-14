import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Register Your Dojo or Gym - FitSaathi",
  description:
    "Register a dojo, gym, yoga studio, martial arts academy, or fitness studio on FitSaathi and connect with students in India.",
  path: "/register-dojo",
  keywords: [
    "dojo gym registration",
    "register martial arts academy",
    "register gym India",
    "fitness academy India",
  ],
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
