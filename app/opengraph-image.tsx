import { ImageResponse } from "next/og";

export const alt = "Blessing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#1a1a1a",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700 }}>Blessing</div>
        <div style={{ fontSize: 28, color: "#8a8a8a", marginTop: 16 }}>
          Thoughts, diary, and yaps.
        </div>
      </div>
    ),
    { ...size }
  );
}
