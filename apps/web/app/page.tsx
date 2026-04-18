import { NationalScoreHero } from "@/components/NationalScoreHero";
import type { MonthlyDataPoint } from "@/components/MonthlyScoreChart";
import { getLocale } from "@/lib/i18n";
import { KARAR_AREAS } from "@/lib/manifesto-utils";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export default async function HomePage() {
  const locale = await getLocale();

  const [
    { data: ministers },
    { data: indicators },
    { data: allScores },
    { data: recentPosts },
  ] = await Promise.all([
    supabase
      .from("ministers")
      .select("*")
      .eq("status", "active")
      .order("overall_score", { ascending: false }),
    supabase
      .from("outcome_indicators")
      .select("*")
      .eq("indicator_type", "result"),
    supabase
      .from("scores")
      .select("minister_id, overall, scored_at, period_start")
      .order("period_start", { ascending: true }),
    supabase
      .from("posts")
      .select("id, title_en, title_np, slug, published_at, category")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  // ── National score from result indicators ──
  const allIndicators = indicators ?? [];
  let weightedSum = 0;
  let totalWeight = 0;

  const byArea: Record<string, { ws: number; wt: number }> = {};
  for (const ind of allIndicators) {
    const b = ind.baseline_value;
    const c = ind.current_value;
    const t = ind.target_value;
    if (b == null || c == null || t == null) continue;

    const dir = ind.direction === "lower_is_better" ? -1 : 1;
    const needed = dir === 1 ? t - b : b - t;
    const achieved = dir === 1 ? c - b : b - c;
    const progress =
      needed === 0 ? 1 : Math.max(0, Math.min(1, achieved / needed));
    const w = Number(ind.weight ?? 5);

    weightedSum += progress * w;
    totalWeight += w;

    const area = ind.priority_area ?? "unknown";
    if (!byArea[area]) byArea[area] = { ws: 0, wt: 0 };
    byArea[area].ws += progress * w;
    byArea[area].wt += w;
  }

  const score =
    totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  // ── Monthly aggregate scores (for chart) ──
  // Group all minister scores by period_start month, average overall per month
  const monthlyBuckets = new Map<string, number[]>();
  for (const s of allScores ?? []) {
    if (!s.period_start || s.overall == null) continue;
    const d = new Date(s.period_start);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyBuckets.get(key) ?? [];
    bucket.push(s.overall);
    monthlyBuckets.set(key, bucket);
  }
  const monthlyData: MonthlyDataPoint[] = Array.from(monthlyBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString(
        "en-US",
        { month: "short", year: "numeric" },
      );
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      return { label, score: avg };
    });

  // ── Trend: compare latest monthly average to previous ──
  const prevMonthAvg = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2].score : null;
  const trend = prevMonthAvg !== null ? score - prevMonthAvg : null;

  // ── Area scores ──
  const areaScores = KARAR_AREAS.map((area) => {
    const d = byArea[area.id];
    const areaScore = d && d.wt > 0 ? Math.round((d.ws / d.wt) * 100) : 0;
    return { ...area, score: areaScore };
  });

  // ── Days since government formed ──
  const daysSinceFormation = Math.floor(
    (Date.now() - new Date("2026-03-27").getTime()) / (1000 * 60 * 60 * 24),
  );

  // ── Top 3 and bottom 3 ministries ──
  const sorted = [...(ministers ?? [])].sort(
    (a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0),
  );
  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.length > 3 ? sorted.slice(-3).reverse() : [];

  return (
    <>
      {/* ─── National Score Hero ─── */}
      <NationalScoreHero
        score={score}
        trend={trend}
        daysSinceFormation={daysSinceFormation}
        indicatorCount={allIndicators.length}
        locale={locale}
        monthlyData={monthlyData}
      />

      {/* ─── 5 Priority Areas ─── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-800 sm:text-2xl">
              {locale === "en" ? "Priority Areas" : "प्राथमिकता क्षेत्रहरू"}
            </h2>
            <a
              href="/manifesto"
              className="text-sm font-medium hover:underline"
              style={{ color: "#003893" }}
            >
              {locale === "en" ? "View all →" : "सबै हेर्नुहोस् →"}
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {areaScores.map((area) => (
              <a
                key={area.id}
                href="/manifesto"
                className="group rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                  <span className="text-sm font-semibold text-neutral-700 group-hover:text-neutral-900">
                    {locale === "en" ? area.label_en : area.label_np}
                  </span>
                </div>
                <div
                  className="mb-2 text-3xl font-bold"
                  style={{ color: area.color }}
                >
                  {area.score}
                  <span className="text-lg text-neutral-400">/100</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${area.score}%`,
                      backgroundColor: area.color,
                    }}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Top & Bottom Ministries ─── */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-800 sm:text-2xl">
              {locale === "en"
                ? "Ministry Performance"
                : "मन्त्रालय कार्यसम्पादन"}
            </h2>
            <a
              href="/ministers"
              className="text-sm font-medium hover:underline"
              style={{ color: "#003893" }}
            >
              {locale === "en" ? "All ministers →" : "सबै मन्त्रीहरू →"}
            </a>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {top3.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  {locale === "en" ? "Top Performing" : "उत्कृष्ट प्रदर्शन"}
                </h3>
                <div className="space-y-3">
                  {top3.map((m, i) => (
                    <MinistryRankRow
                      key={m.id}
                      minister={m}
                      rank={i + 1}
                      locale={locale}
                      variant="top"
                    />
                  ))}
                </div>
              </div>
            )}

            {bottom3.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-orange-600">
                  {locale === "en" ? "Needs Improvement" : "सुधार आवश्यक"}
                </h3>
                <div className="space-y-3">
                  {bottom3.map((m, i) => (
                    <MinistryRankRow
                      key={m.id}
                      minister={m}
                      rank={sorted.length - bottom3.length + i + 1}
                      locale={locale}
                      variant="bottom"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Recent Analysis ─── */}
      {recentPosts && recentPosts.length > 0 && (
        <section className="border-t border-neutral-100 bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-800">
                {locale === "en" ? "Latest Analysis" : "ताजा विश्लेषण"}
              </h2>
              <a
                href="/articles"
                className="text-sm font-medium hover:underline"
                style={{ color: "#003893" }}
              >
                {locale === "en" ? "View all →" : "सबै →"}
              </a>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {recentPosts.map((p) => (
                <a
                  key={p.id}
                  href={`/articles/${p.slug}`}
                  className="group rounded-lg border border-neutral-200 bg-white p-4 transition hover:shadow-sm"
                >
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: "#EFF6FF", color: "#003893" }}
                  >
                    {p.category}
                  </span>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-neutral-700">
                    {locale === "en" ? p.title_en : p.title_np || p.title_en}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {new Date(p.published_at).toLocaleDateString(
                      locale === "en" ? "en-US" : "ne-NP",
                      { month: "short", day: "numeric" },
                    )}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl p-8 text-center sm:p-10"
            style={{
              background: "linear-gradient(135deg,#003893 0%,#002D7A 100%)",
            }}
          >
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              {locale === "en"
                ? "Democracy Needs Your Eyes"
                : "लोकतन्त्रलाई तपाईंको आँखा चाहिन्छ"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-blue-100/70">
              {locale === "en"
                ? "Have evidence or found an error? Help hold the government accountable."
                : "प्रमाण छ वा त्रुटि फेला पार्नुभयो? सरकारलाई जवाफदेही बनाउन मद्दत गर्नुहोस्।"}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a
                href="/submit"
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-100"
                style={{ color: "#003893" }}
              >
                {locale === "en" ? "Submit Evidence" : "प्रमाण पेश गर्नुहोस्"}
              </a>
              <a
                href="/methodology"
                className="rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {locale === "en" ? "Our Methodology" : "हाम्रो कार्यविधि"}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Ministry rank row ── */
function MinistryRankRow({
  minister: m,
  rank,
  locale,
  variant,
}: {
  minister: any;
  rank: number;
  locale: string;
  variant: "top" | "bottom";
}) {
  const colors =
    variant === "top"
      ? {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          score: "text-emerald-600",
        }
      : {
          bg: "bg-orange-50",
          text: "text-orange-700",
          score: "text-orange-600",
        };

  return (
    <a
      href={`/ministers/${m.id}`}
      className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition hover:shadow-sm"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colors.bg} text-sm font-bold ${colors.text}`}
      >
        {rank}
      </span>
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-100">
        {m.photo_url ? (
          <img
            src={m.photo_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-neutral-300">
            {m.name_en.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-800">
          {locale === "en" ? m.name_en : m.name_np || m.name_en}
        </p>
        <p className="truncate text-xs text-neutral-500">
          {locale === "en" ? m.portfolio_en : m.portfolio_np || m.portfolio_en}
        </p>
      </div>
      <span className={`shrink-0 text-lg font-bold ${colors.score}`}>
        {m.overall_score ?? 0}
      </span>
    </a>
  );
}
