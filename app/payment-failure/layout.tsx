import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Payment Status - FitSaathi",
  path: "/payment-failure",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
