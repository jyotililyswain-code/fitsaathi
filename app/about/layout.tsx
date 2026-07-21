import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "About FitSaathi | Owner Priyanshu Swain and Admin Parthsaarthi",
  description:
    "Learn about FitSaathi, also known as The FitSaathi. FitSaathi is owned and founded by Priyanshu Swain, and Parthsaarthi serves as its administrator.",
  path: "/about",
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
