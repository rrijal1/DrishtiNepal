"use client";

import { MonthlyScoreChart } from "./MonthlyScoreChart";
import type { MonthlyDataPoint } from "./MonthlyScoreChart";

interface Props {
  score: number;
  trend: number | null;
  daysSinceFormation: number;
  indicatorCount: number;
  locale: string;
  monthlyData?: MonthlyDataPoint[];
}

export function NationalScoreHero({
  score,
  trend,
  daysSinceFormation,
  indicatorCount,
  locale,
  monthlyData,
}: Props) {
  const trendSign = trend !== null && trend > 0 ? "+" : "";
  const trendColor =
    trend === null
      ? "text-neutral-400"
      : trend > 0
        ? "text-emerald-400"
        : trend < 0
          ? "text-red-400"
          : "text-neutral-400";
  const trendArrow =
    trend === null ? "" : trend > 0 ? "↑" : trend < 0 ? "↓" : "→";

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #003893 0%, #002D7A 50%, #001F55 100%)",
      }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/5 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="lg:grid lg:grid-cols-5 lg:gap-12 lg:items-center">
          {/* ── Left: Score + meta ── */}
          <div className="text-center lg:col-span-2 lg:text-left">
            {/* Label */}
            <p
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{
                borderColor: "rgba(255,255,255,0.25)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "#10B981" }}
              />
              {locale === "en"
                ? "Government Performance Score"
                : "सरकारको कार्यसम्पादन स्कोर"}
            </p>

            {/* Big score */}
            <div className="mt-5 flex items-baseline justify-center gap-3 lg:justify-start">
              <span className="text-7xl font-extrabold tabular-nums text-white sm:text-8xl lg:text-9xl">
                {score}
              </span>
              <span
                className="text-2xl font-light sm:text-3xl"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                /100
              </span>
            </div>

            {/* Trend */}
            {trend !== null && (
              <p className={`mt-3 text-sm font-medium ${trendColor}`}>
                {trendArrow} {trendSign}
                {trend}{" "}
                <span style={{ color: "rgba(255,255,255,0.4)" }}>
                  {locale === "en" ? "from last month" : "गत महिनाबाट"}
                </span>
              </p>
            )}

            {/* Divider */}
            <div
              className="mx-auto mt-6 h-px w-24 lg:ml-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            />

            {/* Meta strip */}
            <div
              className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs lg:justify-start"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <span>
                {locale === "en" ? "Based on" : "आधारित"}{" "}
                <span className="font-semibold text-white">{indicatorCount}</span>{" "}
                {locale === "en" ? "indicators" : "सूचकहरू"}
              </span>
              <span className="opacity-40">·</span>
              <span>
                {locale === "en" ? "Day" : "दिन"}{" "}
                <span className="font-semibold text-white">
                  {daysSinceFormation}
                </span>{" "}
                {locale === "en" ? "of government" : "सरकारको"}
              </span>
              <span className="opacity-40">·</span>
              <a
                href="/methodology"
                className="transition"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onMouseOver={(e) =>
                  ((e.target as HTMLElement).style.color = "white")
                }
                onMouseOut={(e) =>
                  ((e.target as HTMLElement).style.color =
                    "rgba(255,255,255,0.5)")
                }
              >
                {locale === "en" ? "How we score →" : "हाम्रो स्कोरिङ →"}
              </a>
            </div>
          </div>

          {/* ── Right: Monthly trend chart ── */}
          <div className="mt-10 lg:col-span-3 lg:mt-0">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {locale === "en" ? "Monthly Aggregate Score" : "मासिक कुल स्कोर"}
            </p>
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <MonthlyScoreChart data={monthlyData ?? []} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
