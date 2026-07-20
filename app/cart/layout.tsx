import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Private Shopping Cart",
  description: "Private FitSaathi shopping cart.",
  path: "/cart",
  noIndex: true,
});

export default function CartLayout({ children }: { children: ReactNode }) {
  return children;
}
