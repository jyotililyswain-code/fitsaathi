import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Fitness Seller Center - FitSaathi",
  description:
    "Register a fitness store and sell approved sports equipment and training essentials through FitSaathi.",
  path: "/register-seller",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
