import { IndicatorList } from "@/components/IndicatorList";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { getLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: m } = await supabase
    .from("ministers")
    .select("name_en, portfolio_en, overall_score, photo_url")
    .eq("id", id)
    .single();
  if (!m) return { title: "Minister Not Found" };
  return {
    title: `${m.name_en} — ${m.portfolio_en}`,
    description: `Accountability scorecard for ${m.name_en}, ${m.portfolio_en}. Score: ${m.overall_score ?? "N/A"}/100.`,
  };
}

export default async function MinisterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();

  const { data: minister } = await supabase
    .from("ministers")
    .select("*")
    .eq("id", id)
    .single();
  if (!minister) notFound();

  const [{ data: scoreHistory }, { data: indicators }] = await Promise.all([
    supabase
      .from("scores")
      .select("scored_at, overall, outcome_score")
      .eq("minister_id", id)
      .order("scored_at", { ascending: true })
      .limit(90),
    supabase
      .from("outcome_indicators")
      .select("*, sources(name_en, slug)")
      .or(
        `ministry.ilike.%${minister.portfolio_en}%,metadata->ministries.cs.["${minister.portfolio_en}"]`,
      )
      .order("indicator_type", { ascending: true })
      .order("indicator_name"),
  ]);

  const m = minister;
  const name = locale === "en" ? m.name_en : m.name_np || m.name_en;
  const portfolio =
    locale === "en" ? m.portfolio_en : m.portfolio_np || m.portfolio_en;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <a
        href="/ministers"
        className="mb-6 inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800"
      >
        {locale === "en" ? "← Ministers" : "← मन्त्रीहरू"}
      </a>

      {/* ── Header ── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
          {m.photo_url ? (
            <img
              src={m.photo_url}
              alt={m.name_en}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-neutral-300">
              {m.name_en.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 sm:text-3xl">
                {name}
              </h1>
              {locale === "en" && m.name_np && (
                <p className="text-base text-neutral-400 font-nepali">
                  {m.name_np}
                </p>
              )}
              <p className="mt-1 text-neutral-500">{portfolio}</p>
            </div>
            <ScoreBadge score={m.overall_score} size="lg" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {m.party}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {locale === "en" ? "Appointed" : "नियुक्त"}{" "}
              {new Date(m.appointed_date).toLocaleDateString(
                locale === "en" ? "en-US" : "ne-NP",
                { month: "short", day: "numeric", year: "numeric" },
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Score History ── */}
      {scoreHistory && scoreHistory.length > 1 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-neutral-800">
            {locale === "en" ? "Score Trend" : "स्कोर प्रवृत्ति"}
          </h2>
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <ScoreHistoryChart
              scores={scoreHistory.map((s) => ({
                date: s.scored_at,
                overall: s.overall,
                outcome_score: s.outcome_score,
              }))}
            />
          </div>
        </div>
      )}

      {/* ── Indicators (result with nested process) ── */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-neutral-800">
          {locale === "en" ? "Indicators" : "सूचकहरू"}
        </h2>
        <IndicatorList indicators={indicators ?? []} locale={locale} />
      </div>
    </div>
  );
}
