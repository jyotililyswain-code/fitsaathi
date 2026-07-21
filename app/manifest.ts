import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TheFitSaathi",
    short_name: "TheFitSaathi",
    description:
      "Discover fitness coaches, personal trainers, gyms, dojos, martial arts academies and sports training services across India with TheFitSaathi.",
    id: "/",
    start_url: "/",
    scope: "/",
    lang: "en-IN",
    categories: ["fitness", "health", "lifestyle"],
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#00ff88",
    icons: [
      {
        src: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
