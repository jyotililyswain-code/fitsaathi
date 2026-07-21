import { JsonLd } from "@/components/JsonLd";
import FitSaathiHome from "@/components/FitSaathiHome";
import { HomepageBrandSection } from "@/components/HomepageBrandSection";
import {
  administratorPersonJsonLd,
  coachBookingServiceJsonLd,
  founderPersonJsonLd,
  generateSeoMetadata,
  homePageJsonLd,
  organizationJsonLd,
  seoConfig,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: seoConfig.defaultTitle,
  description: seoConfig.defaultDescription,
  openGraphDescription: seoConfig.defaultOpenGraphDescription,
  twitterDescription: seoConfig.defaultTwitterDescription,
  imageAlt: seoConfig.defaultOpenGraphImageAlt,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            organizationJsonLd,
            founderPersonJsonLd,
            administratorPersonJsonLd,
            websiteJsonLd,
            homePageJsonLd,
            coachBookingServiceJsonLd,
          ],
        }}
      />
      <FitSaathiHome brandSection={<HomepageBrandSection />} />
    </>
  );
}
