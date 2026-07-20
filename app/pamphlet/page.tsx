import { generateSeoMetadata } from "@/lib/seo";
import { Pamphlet } from "./pamphlet";

export const metadata = generateSeoMetadata({
  title: "Promotional Pamphlet and QR Code",
  description:
    "View and share the official FitSaathi pamphlet for fitness coaches, gyms, dojos, sports academies and customers.",
  path: "/pamphlet",
  noIndex: true,
});

export default function PamphletPage() {
  return <Pamphlet />;
}
