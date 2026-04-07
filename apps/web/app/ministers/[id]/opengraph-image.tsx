import { supabase } from "@/lib/supabase";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Minister profile — Drishti Nepal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: m } = await supabase
    .from("ministers")
    .select("name_en, name_np, portfolio_en, party, overall_score")
    .eq("id", id)
    .single();

  const score = m?.overall_score ?? null;
  const name = m?.name_en ?? "Minister";
  const portfolio = m?.portfolio_en ?? "";
  const party = m?.party ?? "";

  // Score color
  const scoreColor =
    score == null
      ? "#a3a3a3"
      : score >= 70
        ? "#10b981"
        : score >= 40
          ? "#f59e0b"
          : "#ef4444";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "60px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "auto",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            color: "white",
            fontWeight: "bold",
          }}
        >
          द
        </div>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }}>
          Drishti Nepal
        </span>
      </div>

      {/* Score badge */}
      {score != null && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "60px",
            width: "120px",
            height: "120px",
            borderRadius: "60px",
            background: scoreColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: "42px",
              fontWeight: "bold",
              lineHeight: 1,
            }}
          >
            {Math.round(score)}
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "13px",
              marginTop: "2px",
            }}
          >
            /100
          </span>
        </div>
      )}

      {/* Name + portfolio */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            color: "white",
            fontSize: "64px",
            fontWeight: "bold",
            lineHeight: 1.1,
            maxWidth: "900px",
          }}
        >
          {name}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "28px",
            maxWidth: "800px",
          }}
        >
          {portfolio}
        </div>
        {party && (
          <div
            style={{
              marginTop: "8px",
              display: "inline-flex",
              background: "rgba(255,255,255,0.12)",
              borderRadius: "20px",
              padding: "6px 18px",
              color: "rgba(255,255,255,0.75)",
              fontSize: "18px",
              width: "fit-content",
            }}
          >
            {party}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          marginTop: "40px",
          color: "rgba(255,255,255,0.4)",
          fontSize: "16px",
        }}
      >
        drishtinepal.com · Accountability scorecard
      </div>
    </div>,
    { ...size },
  );
}
