import type { Metadata } from "next";
import { Pamphlet } from "./pamphlet";

export const metadata: Metadata = {
  title: "FitSaathi Promotional Pamphlet",
  description: "Download and share the official FitSaathi fitness platform pamphlet.",
};

export default function PamphletPage() {
  return <Pamphlet />;
}
