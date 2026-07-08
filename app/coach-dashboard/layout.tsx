import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Private Coach Dashboard - FitSaathi",
  path: "/coach-dashboard",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
