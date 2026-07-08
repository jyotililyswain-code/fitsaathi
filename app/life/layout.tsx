import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Private Fitness Community - FitSaathi",
  path: "/life",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
