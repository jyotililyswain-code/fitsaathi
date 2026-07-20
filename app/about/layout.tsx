import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "About FitSaathi | Official Fitness and Sports Platform",
  description:
    "Learn how FitSaathi helps people discover fitness coaches, gyms, dojos, martial arts academies and sports training services across India.",
  path: "/about",
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
