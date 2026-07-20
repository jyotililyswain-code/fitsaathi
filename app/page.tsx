import { JsonLd } from "@/components/JsonLd";
import FitSaathiHome from "@/components/FitSaathiHome";
import {
  coachBookingServiceJsonLd,
  generateSeoMetadata,
} from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "FitSaathi – Find Fitness Coaches, Gyms and Sports Academies",
  description:
    "Find fitness coaches, personal trainers, gyms, dojos, martial arts academies, yoga instructors and sports training services across India with FitSaathi.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...coachBookingServiceJsonLd,
        }}
      />
      <FitSaathiHome />
    </>
  );
}
