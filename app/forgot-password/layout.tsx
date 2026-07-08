import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Reset FitSaathi Password",
  path: "/forgot-password",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
