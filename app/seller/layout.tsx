import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Sell Fitness Products Online – FitSaathi Seller Center",
  description:
    "Register a fitness store and sell approved sports equipment and training essentials through FitSaathi.",
  path: "/seller",
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
