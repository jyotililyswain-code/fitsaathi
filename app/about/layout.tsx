import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "About TheFitSaathi | Indian Fitness and Sports Platform",
  description:
    "Learn about TheFitSaathi, an Indian fitness and sports platform founded and owned by Priyanshu Swain and administered by Parthsaarthi.",
  path: "/about",
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
