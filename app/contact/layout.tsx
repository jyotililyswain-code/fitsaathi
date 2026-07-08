import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Contact FitSaathi Support",
  description:
    "Contact FitSaathi for fitness coach booking support, dojo registration help, seller support, and customer care.",
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
