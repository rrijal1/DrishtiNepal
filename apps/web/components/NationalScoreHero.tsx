"use client";

interface Props {
  score: number;
  trend: number | null;
  daysSinceFormation: number;
  indicatorCount: number;
  locale: string;
}

export function NationalScoreHero({
  score,
  trend,
  daysSinceFormation,
  indicatorCount,
  locale,
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
    <section className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          {/* Label */}
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            {locale === "en"
              ? "Government Performance Score"
              : "सरकारको कार्यसम्पादन स्कोर"}
          </p>

          {/* Big score */}
          <div className="mt-4 flex items-baseline justify-center gap-2">
            <span className="text-7xl font-extrabold tabular-nums text-white sm:text-8xl">
              {score}
            </span>
            <span className="text-2xl font-medium text-neutral-500 sm:text-3xl">
              /100
            </span>
          </div>

          {/* Trend */}
          {trend !== null && (
            <p className={`mt-2 text-sm font-medium ${trendColor}`}>
              {trendArrow} {trendSign}
              {trend}{" "}
              <span className="text-neutral-500">
                {locale === "en" ? "from last month" : "गत महिनाबाट"}
              </span>
            </p>
          )}

          {/* Meta line */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-400">
            <span>
              {locale === "en" ? "Based on" : "आधारित"}{" "}
              <span className="font-semibold text-neutral-300">
                {indicatorCount}
              </span>{" "}
              {locale === "en" ? "result indicators" : "परिणाम सूचकहरू"}
            </span>
            <span className="hidden sm:inline">·</span>
            <span>
              {locale === "en" ? "Day" : "दिन"}{" "}
              <span className="font-semibold text-neutral-300">
                {daysSinceFormation}
              </span>{" "}
              {locale === "en" ? "of government" : "सरकारको"}
            </span>
            <span className="hidden sm:inline">·</span>
            <a
              href="/methodology"
              className="underline decoration-neutral-600 underline-offset-2 transition hover:text-neutral-300"
            >
              {locale === "en" ? "Methodology" : "कार्यविधि"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
