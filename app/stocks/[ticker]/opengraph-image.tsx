import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Stock Movement Explained — WhyIs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage({ params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase();

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
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: 24 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: "#4ade80" }}>Why</span>
          <span style={{ fontSize: 36, fontWeight: 800, color: "#ffffff" }}>Is</span>
        </div>

        {/* Ticker */}
        <div
          style={{
            background: "#1f2937",
            border: "2px solid #374151",
            borderRadius: 20,
            padding: "16px 48px",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 800, color: "#ffffff" }}>
            {ticker}
          </span>
        </div>

        {/* Question */}
        <p style={{ fontSize: 32, color: "#9ca3af", textAlign: "center" }}>
          Why is {ticker} stock up or down today?
        </p>

        {/* Subtext */}
        <p style={{ fontSize: 18, color: "#6b7280", marginTop: 32 }}>
          AI-powered explanation &bull; whyisstock.com
        </p>
      </div>
    ),
    { ...size }
  );
}
