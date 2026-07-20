import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Policies and Safety Guidelines",
  description:
    "Read FitSaathi policies for free registration, identity verification, coach and dojo booking, transparent shop purchases, safety, privacy, and community conduct.",
  path: "/policies",
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
