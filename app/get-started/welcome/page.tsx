import FitSaathiOnboarding from "@/components/FitSaathiOnboarding";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "FitSaathi Welcome",
  description:
    "Choose your fitness interests and explore the ways you can use FitSaathi.",
  path: "/get-started/welcome",
  noIndex: true,
});

export default function WelcomePage() {
  return <FitSaathiOnboarding />;
}
