import { PolicyLayout } from "@/components/PolicyLayout";
import { getPolicy } from "@/lib/policies";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Privacy Policy - FitSaathi",
  description:
    "Read FitSaathi Privacy Policy to understand how user data, coach details, seller information, and booking details are handled.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <PolicyLayout policy={getPolicy("privacy")!} />;
}
