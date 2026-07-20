import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Private Provider Management",
  description: "Private FitSaathi provider-management tools.",
  path: "/owner",
  noIndex: true,
});

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return children;
}
