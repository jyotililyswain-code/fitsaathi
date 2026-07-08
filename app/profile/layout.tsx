import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Private Profile - FitSaathi",
  path: "/profile",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
