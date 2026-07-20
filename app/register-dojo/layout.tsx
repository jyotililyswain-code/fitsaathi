import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Register Your Dojo or Gym on FitSaathi",
  description:
    "Create a public profile for your dojo, gym, martial arts academy or fitness centre on FitSaathi.",
  path: "/register-dojo",
  keywords: [
    "dojo gym registration",
    "register martial arts academy",
    "register gym India",
    "fitness academy India",
  ],
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
