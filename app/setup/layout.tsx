import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Private Setup – FitSaathi",
  description: "Private FitSaathi setup diagnostics.",
  path: "/setup",
  noIndex: true,
});

export default function SetupLayout({ children }: { children: ReactNode }) {
  return children;
}
