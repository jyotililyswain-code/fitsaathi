import type { ReactNode } from "react";
import { AdultSocialGuard } from "@/components/AdultSocialGuard";

export default function Layout({ children }: { children: ReactNode }) {
  return <AdultSocialGuard>{children}</AdultSocialGuard>;
}
