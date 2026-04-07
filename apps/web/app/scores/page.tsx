import { ScoreBadge } from "@/components/ScoreBadge";
import { OutcomeAreaBars } from "@/components/ScoreCharts";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata = {
  title: "Score Dashboard — Drishti Nepal",
  description:
    "Outcome-based accountability scores for every cabinet minister — tracking real-world progress against Ra Swa Pa's manifesto targets.",
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

  // Compute national outcome average from latest scores
  const scoreValues = Array.from(latestScores.values());
  const avgOutcome =
    scoreValues.length > 0
      ? Math.round(
          scoreValues.reduce((s, v) => s + (v.outcome_score ?? 0), 0) /
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
          Outcome-only model (v1) — every score tracks real-world progress
          toward manifesto targets.{" "}
          <a href="/methodology" className="text-blue-700 underline">
            Read our methodology
          </a>
          .
        </p>
      </div>

      {/* National Overview */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        {/* Outcome Score + Area Bars */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            National Outcome Score
          </h2>
          <div className="mb-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-700">{avgScore}</p>
              <p className="mt-1 text-sm text-neutral-500">Overall Average</p>
            </div>
          </div>
          <OutcomeAreaBars areas={outcomeAreas} />
          <div className="mt-4 border-t border-neutral-100 pt-3">
            <p className="text-xs text-neutral-400">
              Based on {indicators?.length ?? 0} outcome indicators from NRB,
              CBS, World Bank, and other sources.
            </p>
          </div>
        </div>

        {/* Activity Tracker */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Activity Tracker
          </h2>
          <p className="mb-5 text-xs text-neutral-400">
            Initiative status counts — displayed for context, not included in
            the score.
          </p>
          <div className="space-y-3">
            <ActivityRow
              label="Fulfilled"
              count={statusCounts["fulfilled"] ?? 0}
              total={manifestoItems?.length ?? 0}
              color="bg-emerald-500"
              textColor="text-emerald-700"
            />
            <ActivityRow
              label="In Progress"
              count={statusCounts["in_progress"] ?? 0}
              total={manifestoItems?.length ?? 0}
              color="bg-blue-500"
              textColor="text-blue-700"
            />
            <ActivityRow
              label="Partially Fulfilled"
              count={statusCounts["partially_fulfilled"] ?? 0}
              total={manifestoItems?.length ?? 0}
              color="bg-amber-500"
              textColor="text-amber-700"
            />
            <ActivityRow
              label="Not Started"
              count={statusCounts["not_started"] ?? 0}
              total={manifestoItems?.length ?? 0}
              color="bg-neutral-300"
              textColor="text-neutral-600"
            />
            <ActivityRow
              label="Broken"
              count={statusCounts["broken"] ?? 0}
              total={manifestoItems?.length ?? 0}
              color="bg-red-500"
              textColor="text-red-700"
            />
          </div>
          <p className="mt-5 border-t border-neutral-100 pt-3 text-xs text-neutral-400">
            {manifestoItems?.length ?? 0} total manifesto commitments tracked.{" "}
            <a href="/manifesto" className="text-blue-700 underline">
              View all →
            </a>
          </p>
        </div>
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
              <th className="px-3 py-3 pr-6 text-center text-xs font-semibold uppercase text-neutral-500">
                <span className="text-emerald-600">Outcome Score</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ministers?.map((m, i) => (
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
                      <p className="text-sm font-semibold text-neutral-800 group-hover:text-blue-700">
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
                <td className="px-3 py-4 pr-6 text-center">
                  <ScoreBadge score={m.overall_score ?? 0} size="sm" />
                </td>
              </tr>
            )) ?? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-neutral-400">
                  No score data available yet. Scoring agents run daily.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center text-xs text-neutral-400">
        Scores are recalculated daily at midnight NPT. Methodology v1 is fully{" "}
        <a href="/methodology" className="underline">
          documented and open source
        </a>
        .
      </div>
    </div>
  );
}

function ActivityRow({
  label,
  count,
  total,
  color,
  textColor,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  textColor: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={`font-medium ${textColor}`}>{label}</span>
        <span className="text-neutral-600">
          {count} <span className="text-neutral-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
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
