import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FitSaathi",
    short_name: "FitSaathi",
    description:
      "Find fitness coaches, martial arts trainers, gyms, dojos and sports academies with FitSaathi.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#c8ff00",
    icons: [
      {
        src: "/fitsaathi-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/fitsaathi-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
