import { PolicyLayout } from "@/components/PolicyLayout";
import { getPolicy } from "@/lib/policies";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Terms and Conditions - FitSaathi",
  description:
    "Read FitSaathi Terms and Conditions for free coach and dojo booking, free provider registration and identity verification, transparent shop purchases, and platform rules.",
  path: "/terms",
});

export default function TermsPage() {
  return <PolicyLayout policy={getPolicy("terms")!} />;
}
