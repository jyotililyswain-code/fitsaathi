import type { ReactNode } from "react";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Register as a Fitness Seller - FitSaathi",
  description:
    "Join FitSaathi as a seller and list fitness products, sports equipment, and training essentials for customers.",
  path: "/register-seller",
  noIndex: true,
  keywords: [
    "fitness seller registration",
    "sell fitness products",
    "sports equipment seller",
    "FitSaathi seller",
  ],
});

export default function SellerRegistrationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
