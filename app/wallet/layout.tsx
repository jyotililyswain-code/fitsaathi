import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Private Wallet",
  description: "Private FitSaathi wallet information.",
  path: "/wallet",
  noIndex: true,
});

export default function WalletLayout({ children }: { children: ReactNode }) {
  return children;
}
