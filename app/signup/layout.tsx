import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Create a FitSaathi Account",
  path: "/signup",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
