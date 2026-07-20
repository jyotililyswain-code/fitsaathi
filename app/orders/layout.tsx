import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Private Orders",
  description: "Private FitSaathi marketplace orders.",
  path: "/orders",
  noIndex: true,
});

export default function OrdersLayout({ children }: { children: ReactNode }) {
  return children;
}
