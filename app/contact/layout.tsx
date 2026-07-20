import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Contact FitSaathi Support",
  description:
    "Contact FitSaathi for account, registration, booking and platform-support questions.",
  path: "/contact",
  keywords: [
    "FitSaathi contact",
    "FitSaathi support",
    "customer care",
    "fitness support India",
  ],
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
