import { PolicyLayout } from "@/components/PolicyLayout";
import { JsonLd } from "@/components/JsonLd";
import { getPolicy } from "@/lib/policies";
import { breadcrumbJsonLd, generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Terms and Conditions",
  description:
    "Read TheFitSaathi Terms and Conditions for free coach and dojo booking, free provider registration and identity verification, transparent shop purchases, and platform rules.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Policies", path: "/policies" },
        { name: "Terms and Conditions", path: "/terms" },
      ])} />
      <PolicyLayout policy={getPolicy("terms")!} />
    </>
  );
}
