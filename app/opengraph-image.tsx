import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WhyIs — Stock Movement Explained";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Logo text */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: "#4ade80" }}>Why</span>
          <span style={{ fontSize: 72, fontWeight: 800, color: "#ffffff" }}>Is</span>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: 28, color: "#9ca3af", marginTop: 16, textAlign: "center" }}>
          Why is your stock up or down today?
        </p>

        {/* Feature chips */}
        <div style={{ display: "flex", gap: "16px", marginTop: 40 }}>
          {["Real-time data", "AI summaries", "News & sentiment"].map((t) => (
            <div
              key={t}
              style={{
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: 12,
                padding: "10px 24px",
                fontSize: 18,
                color: "#d1d5db",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* URL */}
        <p style={{ fontSize: 18, color: "#6b7280", marginTop: 40 }}>
          whyisstock.com
        </p>
      </div>
    ),
    { ...size }
  );
}
