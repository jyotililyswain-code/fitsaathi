import { PolicyLayout } from "@/components/PolicyLayout";
import { getPolicy } from "@/lib/policies";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Terms and Conditions - FitSaathi",
  description:
    "Read FitSaathi Terms and Conditions for coach booking, dojo registration, seller registration, payments, refunds, and platform rules.",
  path: "/terms",
});

export default function TermsPage() {
  return <PolicyLayout policy={getPolicy("terms")!} />;
}
