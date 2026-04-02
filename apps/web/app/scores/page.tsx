import { ScoreBadge } from "@/components/ScoreBadge";
import { OutcomeAreaBars, TierRadar } from "@/components/ScoreCharts";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata = {
  title: "Score Dashboard — Drishti Nepal",
  description:
    "Three-tier accountability scores: Outcomes, Initiatives, and Evidence for every cabinet minister.",
};

const AREA_LABELS: Record<string, { label: string; weight: string }> = {
  "pp-001": { label: "Integrity & Good Governance", weight: "18%" },
  "pp-002": { label: "Middle-Class Expansion", weight: "42%" },
  "pp-003": { label: "Jobs, Jobs, Jobs", weight: "20%" },
  "pp-004": { label: "Connectivity", weight: "15%" },
  "pp-005": { label: "Diaspora", weight: "5%" },
};

export default async function ScoresPage() {
  const { data: ministers } = await supabase
    .from("ministers")
    .select(
      "id, name_en, name_np, portfolio_en, photo_url, overall_score, party",
    )
    .eq("status", "active")
    .order("overall_score", { ascending: false });

  // Get latest scores for each minister
  const ministerIds = ministers?.map((m) => m.id) ?? [];
  const { data: allScores } =
    ministerIds.length > 0
      ? await supabase
          .from("scores")
          .select("*")
          .in("minister_id", ministerIds)
          .order("scored_at", { ascending: false })
      : { data: [] };

  // Get latest score per minister
  const latestScores = new Map<string, any>();
  allScores?.forEach((s) => {
    if (!latestScores.has(s.minister_id)) latestScores.set(s.minister_id, s);
  });

  // Get outcome indicators for national progress
  const { data: indicators } = await supabase
    .from("outcome_indicators")
    .select("*")
    .order("priority_area");

  const avgScore =
    ministers && ministers.length > 0
      ? Math.round(
          ministers.reduce((sum, m) => sum + (m.overall_score ?? 0), 0) /
            ministers.length,
        )
      : 0;

  // Compute national tier averages from latest scores
  const scoreValues = Array.from(latestScores.values());
  const avgOutcome =
    scoreValues.length > 0
      ? Math.round(
          scoreValues.reduce((s, v) => s + (v.outcome_score ?? 0), 0) /
            scoreValues.length,
        )
      : 0;
  const avgInitiative =
    scoreValues.length > 0
      ? Math.round(
          scoreValues.reduce((s, v) => s + (v.initiative_score ?? 0), 0) /
            scoreValues.length,
        )
      : 0;
  const avgEvidence =
    scoreValues.length > 0
      ? Math.round(
          scoreValues.reduce((s, v) => s + (v.evidence_score ?? 0), 0) /
            scoreValues.length,
        )
      : 0;

  // Build area scores from indicators
  const areaScores: Record<string, number[]> = {};
  indicators?.forEach((ind) => {
    const area = ind.priority_area;
    if (!area) return;
    const baseline = ind.baseline_value;
    const current = ind.current_value;
    const target = ind.target_value;
    if (baseline == null || current == null || target == null) return;
    const dir = ind.direction === "lower_is_better" ? -1 : 1;
    const needed = dir === 1 ? target - baseline : baseline - target;
    const achieved = dir === 1 ? current - baseline : baseline - current;
    const progress =
      needed === 0 ? 1 : Math.max(0, Math.min(1, achieved / needed));
    areaScores[area] = areaScores[area] || [];
    areaScores[area].push(progress * 100);
  });

  const outcomeAreas = Object.entries(AREA_LABELS).map(([key, info]) => ({
    label: info.label,
    weight: info.weight,
    score: areaScores[key]
      ? Math.round(
          areaScores[key].reduce((a, b) => a + b, 0) / areaScores[key].length,
        )
      : 50,
  }));

  // Manifesto initiative status counts
  const { data: manifestoItems } = await supabase
    .from("manifesto_items")
    .select("status")
    .eq("document_type", "bachha_patra");

  const statusCounts: Record<string, number> = {};
  manifestoItems?.forEach((item) => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">Score Dashboard</h1>
        <p className="mt-2 text-neutral-500">
          Three-tier accountability model: Outcomes (50%), Initiatives (30%),
          Evidence (20%).{" "}
          <a href="/methodology" className="text-[#1e3a5f] underline">
            Read our methodology
          </a>
          .
        </p>
      </div>

      {/* National Overview */}
      <div className="mb-10 grid gap-6 lg:grid-cols-3">
        {/* Tier Summary Cards */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            National Score Overview
          </h2>
          <div className="mb-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-bold text-[#1e3a5f]">{avgScore}</p>
              <p className="mt-1 text-sm text-neutral-500">Overall Average</p>
            </div>
          </div>
          <TierRadar
            outcome={avgOutcome}
            initiative={avgInitiative}
            evidence={avgEvidence}
          />
        </div>

        {/* Tier Breakdown */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Three Tiers
          </h2>
          <div className="space-y-5">
            <TierCard
              label="Tier 1 — Outcomes"
              sublabel="Are real-world indicators improving?"
              score={avgOutcome}
              weight="50%"
              color="emerald"
            />
            <TierCard
              label="Tier 2 — Initiatives"
              sublabel="How many commitments are being acted on?"
              score={avgInitiative}
              weight="30%"
              color="blue"
            />
            <TierCard
              label="Tier 3 — Evidence"
              sublabel="Will these initiatives produce results?"
              score={avgEvidence}
              weight="20%"
              color="violet"
            />
          </div>
        </div>

        {/* Outcome Progress by Area */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Outcome Progress by Karar Patra Area
          </h2>
          <OutcomeAreaBars areas={outcomeAreas} />
          <div className="mt-4 border-t border-neutral-100 pt-3">
            <p className="text-xs text-neutral-400">
              Based on {indicators?.length ?? 0} outcome indicators from NRB,
              CBS, World Bank, and other sources.
            </p>
          </div>
        </div>
      </div>

      {/* Initiative Status Summary */}
      <div className="mb-10 grid gap-4 sm:grid-cols-5">
        <StatusCard
          label="Fulfilled"
          count={statusCounts["fulfilled"] ?? 0}
          color="bg-emerald-100 text-emerald-700"
        />
        <StatusCard
          label="In Progress"
          count={statusCounts["in_progress"] ?? 0}
          color="bg-blue-100 text-blue-700"
        />
        <StatusCard
          label="Partially Fulfilled"
          count={statusCounts["partially_fulfilled"] ?? 0}
          color="bg-amber-100 text-amber-700"
        />
        <StatusCard
          label="Not Started"
          count={statusCounts["not_started"] ?? 0}
          color="bg-neutral-100 text-neutral-600"
        />
        <StatusCard
          label="Broken"
          count={statusCounts["broken"] ?? 0}
          color="bg-red-100 text-red-700"
        />
      </div>

      {/* Minister Ranking Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="py-3 pl-6 pr-3 text-left text-xs font-semibold uppercase text-neutral-500">
                #
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Minister
              </th>
              <th className="hidden px-3 py-3 text-left text-xs font-semibold uppercase text-neutral-500 md:table-cell">
                Portfolio
              </th>
              <th className="hidden px-3 py-3 text-center text-xs font-semibold uppercase text-neutral-500 lg:table-cell">
                <span className="text-emerald-600">Outcomes</span>
                <span className="text-neutral-400"> (50%)</span>
              </th>
              <th className="hidden px-3 py-3 text-center text-xs font-semibold uppercase text-neutral-500 lg:table-cell">
                <span className="text-blue-600">Initiatives</span>
                <span className="text-neutral-400"> (30%)</span>
              </th>
              <th className="hidden px-3 py-3 text-center text-xs font-semibold uppercase text-neutral-500 lg:table-cell">
                <span className="text-violet-600">Evidence</span>
                <span className="text-neutral-400"> (20%)</span>
              </th>
              <th className="px-3 py-3 pr-6 text-center text-xs font-semibold uppercase text-neutral-500">
                Overall
              </th>
            </tr>
          </thead>
          <tbody>
            {ministers?.map((m, i) => {
              const s = latestScores.get(m.id);
              return (
                <tr
                  key={m.id}
                  className="border-b border-neutral-50 transition hover:bg-neutral-50"
                >
                  <td className="py-4 pl-6 pr-3 text-sm font-medium text-neutral-400">
                    {i + 1}
                  </td>
                  <td className="px-3 py-4">
                    <a
                      href={`/ministers/${m.id}`}
                      className="group flex items-center gap-3"
                    >
                      <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
                        {m.photo_url ? (
                          <img
                            src={m.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-300">
                            {m.name_en.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800 group-hover:text-[#1e3a5f]">
                          {m.name_en}
                        </p>
                        <p className="font-nepali text-xs text-neutral-400">
                          {m.name_np}
                        </p>
                      </div>
                    </a>
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-neutral-600 md:table-cell">
                    {m.portfolio_en}
                  </td>
                  <DimensionCell
                    value={s?.outcome_score}
                    colorClass="text-emerald-600"
                  />
                  <DimensionCell
                    value={s?.initiative_score}
                    colorClass="text-blue-600"
                  />
                  <DimensionCell
                    value={s?.evidence_score}
                    colorClass="text-violet-600"
                  />
                  <td className="px-3 py-4 pr-6 text-center">
                    <ScoreBadge score={m.overall_score ?? 0} size="sm" />
                  </td>
                </tr>
              );
            }) ?? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-neutral-400">
                  No score data available yet. Scoring agents run daily.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center text-xs text-neutral-400">
        Scores are recalculated daily at midnight NPT. Methodology v3 is fully{" "}
        <a href="/methodology" className="underline">
          documented and open source
        </a>
        .
      </div>
    </div>
  );
}

function DimensionCell({
  value,
  colorClass,
}: {
  value?: number;
  colorClass?: string;
}) {
  if (value == null)
    return (
      <td className="hidden px-3 py-4 text-center text-xs text-neutral-300 lg:table-cell">
        —
      </td>
    );
  const color =
    colorClass ??
    (value >= 80
      ? "text-emerald-600"
      : value >= 60
        ? "text-blue-600"
        : value >= 40
          ? "text-amber-600"
          : "text-red-600");
  return (
    <td
      className={`hidden px-3 py-4 text-center text-sm font-medium lg:table-cell ${color}`}
    >
      {value}
    </td>
  );
}

function TierCard({
  label,
  sublabel,
  score,
  weight,
  color,
}: {
  label: string;
  sublabel: string;
  score: number;
  weight: string;
  color: "emerald" | "blue" | "violet";
}) {
  const colorMap = {
    emerald: "border-emerald-200 bg-emerald-50",
    blue: "border-blue-200 bg-blue-50",
    violet: "border-violet-200 bg-violet-50",
  };
  const textMap = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    violet: "text-violet-700",
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold ${textMap[color]}`}>{label}</p>
          <p className="text-xs text-neutral-500">{sublabel}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${textMap[color]}`}>{score}</p>
          <p className="text-xs text-neutral-400">{weight}</p>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
      <p className="text-3xl font-bold text-neutral-800">{count}</p>
      <p
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
      >
        {label}
      </p>
    </div>
  );
}
