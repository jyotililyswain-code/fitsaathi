import { ImageResponse } from "next/og";

export const alt =
  "TheFitSaathi – Find Fitness Coaches, Gyms and Sports Academies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
            <div
              style={{
                alignItems: "center",
                background: "#c8ff00",
                borderRadius: "28px",
                color: "#09090b",
                display: "flex",
                fontSize: "48px",
                fontWeight: 900,
                height: "112px",
                justifyContent: "center",
                width: "112px",
              }}
            >
              TFS
            </div>
            <div style={{ color: "#c8ff00", display: "flex", fontSize: "62px", fontWeight: 900 }}>
              TheFitSaathi
            </div>
          </div>
          <div style={{ display: "flex", fontSize: "58px", fontWeight: 800, lineHeight: 1.12, marginTop: "55px", maxWidth: "1040px" }}>
            Find Fitness Coaches, Gyms and Sports Academies
          </div>
          <div style={{ color: "#d4d4d8", display: "flex", fontSize: "28px", marginTop: "38px" }}>
            Coaches · Martial arts trainers · Gyms · Dojos · Sports academies
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
