import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "About Our Fitness and Sports Platform",
  description:
    "Learn how TheFitSaathi connects customers with fitness coaches, dojos, trainers, and trusted fitness services in India.",
  path: "/about",
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
