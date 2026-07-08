import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Sign In to FitSaathi",
  path: "/login",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
