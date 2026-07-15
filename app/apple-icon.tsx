import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#c8ff00",
          color: "#09090b",
          display: "flex",
          fontSize: "58px",
          fontWeight: 900,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-4px",
          width: "100%",
        }}
      >
        TFS
      </div>
    ),
    size,
  );
}
