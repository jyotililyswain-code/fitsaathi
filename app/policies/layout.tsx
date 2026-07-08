import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "FitSaathi Policy Center",
  description:
    "Read FitSaathi policies for bookings, payments, safety, privacy, refunds, coaches, dojos, sellers, and community conduct.",
  path: "/policies",
});
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
