import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0F",
        acid: "#00FF88",
        royal: "#9B5DE5",
        verified: "#4FC3F7",
        legendary: "#FFD700"
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 32px rgba(0,255,136,0.24)"
      }
    }
  },
  plugins: []
};

export default config;
