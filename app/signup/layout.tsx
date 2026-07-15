import type { ReactNode } from "react";
import { GuestOnly } from "@/components/GuestOnly";
import { generateSeoMetadata } from "@/lib/seo";
export const metadata = generateSeoMetadata({
  title: "Create a TheFitSaathi Account",
  path: "/signup",
  noIndex: true,
});
export default function Layout({ children }: { children: ReactNode }) {
  return <GuestOnly>{children}</GuestOnly>;
}
