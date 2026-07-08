import CoachesPage from "@/app/coaches/page";
import { JsonLd } from "@/components/JsonLd";
import { coachBookingServiceJsonLd, generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Find Fitness Coaches Near You - FitSaathi",
  description:
    "Search and book home fitness coaches, personal trainers, yoga trainers, martial arts teachers, and sports coaches near you with FitSaathi.",
  path: "/find-coach",
  keywords: [
    "find coach",
    "fitness coach near me",
    "home fitness coach",
    "personal trainer at home",
    "yoga trainer",
    "martial arts coach",
  ],
});

export default function FindCoachPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...coachBookingServiceJsonLd,
        }}
      />
      <CoachesPage />
    </>
  );
}
