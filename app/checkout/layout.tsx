import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Private Checkout",
  description: "Private FitSaathi marketplace checkout.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
