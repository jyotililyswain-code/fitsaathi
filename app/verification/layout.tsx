import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Private Identity Verification",
  description: "Private FitSaathi identity-verification flow.",
  path: "/verification",
  noIndex: true,
});

export default function VerificationLayout({ children }: { children: ReactNode }) {
  return children;
}
