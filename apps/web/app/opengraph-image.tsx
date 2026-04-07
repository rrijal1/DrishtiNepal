import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Drishti Nepal — Cabinet Accountability Portal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        gap: "24px",
        padding: "60px",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: "80px",
          height: "80px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "40px",
          color: "white",
          fontWeight: "bold",
        }}
      >
        द
      </div>

      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "64px",
            fontWeight: "bold",
            lineHeight: 1.1,
          }}
        >
          Drishti Nepal
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "24px" }}>
          दृष्टि नेपाल
        </div>
      </div>

      <div
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: "26px",
          textAlign: "center",
          maxWidth: "800px",
          lineHeight: 1.4,
        }}
      >
        Tracking Nepal&apos;s cabinet ministers against their election manifesto
        commitments.
      </div>

      <div
        style={{
          display: "flex",
          gap: "24px",
          marginTop: "12px",
        }}
      >
        {["Ministers Tracked", "Manifesto Items", "Data Sources"].map(
          (label, i) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "16px 28px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span
                style={{ color: "white", fontSize: "32px", fontWeight: "bold" }}
              >
                {["16", "105", "20"][i]}
              </span>
              <span
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}
              >
                {label}
              </span>
            </div>
          ),
        )}
      </div>
    </div>,
    { ...size },
  );
}
