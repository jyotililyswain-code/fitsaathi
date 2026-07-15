import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Verify Your TheFitSaathi Email",
  description:
    "Verify your email address to finish setting up your TheFitSaathi account.",
  path: "/auth/verify-email",
  noIndex: true,
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
