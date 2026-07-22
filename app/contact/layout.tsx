import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Contact TheFitSaathi Support",
  description:
    "Contact TheFitSaathi for account, registration, booking and platform-support questions.",
  path: "/contact",
  keywords: [
    "TheFitSaathi contact",
    "TheFitSaathi support",
    "customer care",
    "fitness support India",
  ],
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
