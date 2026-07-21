import { JsonLd } from "@/components/JsonLd";
import FitSaathiHome from "@/components/FitSaathiHome";
import { HomepageBrandSection } from "@/components/HomepageBrandSection";
import {
  coachBookingServiceJsonLd,
  generateSeoMetadata,
  homePageJsonLd,
  seoConfig,
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
            homePageJsonLd,
            coachBookingServiceJsonLd,
          ],
        }}
      />
      <FitSaathiHome brandSection={<HomepageBrandSection />} />
    </>
  );
}
