import { PolicyLayout } from "@/components/PolicyLayout";
import { JsonLd } from "@/components/JsonLd";
import { getPolicy } from "@/lib/policies";
import { breadcrumbJsonLd, generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Privacy Policy",
  description:
    "Read TheFitSaathi Privacy Policy to understand how user data, coach details, seller information, and booking details are handled.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Policies", path: "/policies" },
        { name: "Privacy Policy", path: "/privacy" },
      ])} />
      <PolicyLayout policy={getPolicy("privacy")!} />
    </>
  );
}
