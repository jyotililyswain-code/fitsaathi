import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TheFitSaathi",
    short_name: "TheFitSaathi",
    description:
      "Find fitness coaches, martial arts trainers, gyms, dojos and sports academies with TheFitSaathi.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#c8ff00",
    icons: [
      {
        src: "/thefitsaathi-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/thefitsaathi-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
