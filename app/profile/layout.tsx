import type { ReactNode } from "react";
import { AdultSocialGuard } from "@/components/AdultSocialGuard";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Private Profile - FitSaathi",
  path: "/profile",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return <AdultSocialGuard>{children}</AdultSocialGuard>;
}
