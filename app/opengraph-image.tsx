/* eslint-disable @next/next/no-img-element -- ImageResponse renders standard HTML image elements. */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "TheFitSaathi fitness, sports coaching, dojo and gym platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoData = await readFile(
    join(process.cwd(), "public", "favicon-512x512.png"),
    "base64",
  );
  const logoSource = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #09090b 0%, #17210b 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ alignItems: "center", display: "flex", gap: "24px" }}>
            <img
              alt=""
              src={logoSource}
              style={{
                borderRadius: "28px",
                height: "112px",
                objectFit: "cover",
                width: "112px",
              }}
            />
            <div style={{ color: "#c8ff00", display: "flex", fontSize: "62px", fontWeight: 900 }}>
              TheFitSaathi
            </div>
          </div>
          <div style={{ display: "flex", fontSize: "58px", fontWeight: 800, lineHeight: 1.12, marginTop: "55px", maxWidth: "1040px" }}>
            Coaches, Dojos &amp; Gyms in India
          </div>
          <div style={{ color: "#d4d4d8", display: "flex", fontSize: "28px", marginTop: "38px" }}>
            Fitness coaches · Yoga trainers · Martial arts teachers · Gyms
          </div>
          <div style={{ color: "#c8ff00", display: "flex", fontSize: "25px", fontWeight: 700, marginTop: "42px" }}>
            thefitsaathi.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
