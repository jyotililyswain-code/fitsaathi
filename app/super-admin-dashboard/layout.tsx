import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Private Operations | FitSaathi",
  robots: { index: false, follow: false, nocache: true }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
