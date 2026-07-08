import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Private Dojo Dashboard - FitSaathi",
  path: "/dojo-dashboard",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
