import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Private Attendance",
  description: "Private FitSaathi attendance tools.",
  path: "/attendance",
  noIndex: true,
});

export default function AttendanceLayout({ children }: { children: ReactNode }) {
  return children;
}
