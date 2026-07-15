import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Private Seller Dashboard - TheFitSaathi",
  path: "/seller-dashboard",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
