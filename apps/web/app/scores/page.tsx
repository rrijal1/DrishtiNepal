import { ScoreBadge } from "@/components/ScoreBadge";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata = {
  title: "Score Dashboard — Drishti Nepal",
  description:
    "Transparent accountability scores for every cabinet minister across 2 dimensions.",
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

  const avgScore =
    ministers && ministers.length > 0
      ? Math.round(
          ministers.reduce((sum, m) => sum + m.overall_score, 0) /
            ministers.length,
        )
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">Score Dashboard</h1>
        <p className="mt-2 text-neutral-500">
          Transparent, methodology-backed accountability scores for every
          cabinet minister.{" "}
          <a href="/methodology" className="text-[#1e3a5f] underline">
            Read our methodology
          </a>
          .
        </p>
      </div>

      {/* Summary */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
          <p className="text-4xl font-bold text-[#1e3a5f]">{avgScore}</p>
          <p className="mt-1 text-sm text-neutral-500">Cabinet Average Score</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
          <p className="text-4xl font-bold text-emerald-600">
            {ministers?.filter((m) => m.overall_score >= 60).length ?? 0}
          </p>
          <p className="mt-1 text-sm text-neutral-500">Performing Well (60+)</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
          <p className="text-4xl font-bold text-red-600">
            {ministers?.filter(
              (m) => m.overall_score < 40 && m.overall_score > 0,
            ).length ?? 0}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Needs Attention (&lt;40)
          </p>
        </div>
      </div>

      {/* Ranking table */}
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
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-neutral-500 hidden md:table-cell">
                Portfolio
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-neutral-500 hidden lg:table-cell">
                Manifesto (70%)
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-neutral-500 hidden lg:table-cell">
                Public Accountability (30%)
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
                        <p className="text-xs text-neutral-400 font-nepali">
                          {m.name_np}
                        </p>
                      </div>
                    </a>
                  </td>
                  <td className="px-3 py-4 text-sm text-neutral-600 hidden md:table-cell">
                    {m.portfolio_en}
                  </td>
                  <DimensionCell value={s?.manifesto_compliance} />
                  <DimensionCell value={s?.public_accountability} />
                  <td className="px-3 py-4 pr-6 text-center">
                    <ScoreBadge score={m.overall_score} size="sm" />
                  </td>
                </tr>
              );
            }) ?? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-neutral-400">
                  No score data available yet. Scoring agents run daily.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center text-xs text-neutral-400">
        Scores are recalculated daily at midnight NPT. Methodology is fully{" "}
        <a href="/methodology" className="underline">
          documented and open source
        </a>
        .
      </div>
    </div>
  );
}

function DimensionCell({ value }: { value?: number }) {
  if (value == null)
    return (
      <td className="px-3 py-4 text-center text-xs text-neutral-300 hidden lg:table-cell">
        —
      </td>
    );
  const color =
    value >= 80
      ? "text-emerald-600"
      : value >= 60
        ? "text-blue-600"
        : value >= 40
          ? "text-amber-600"
          : "text-red-600";
  return (
    <td
      className={`px-3 py-4 text-center text-sm font-medium hidden lg:table-cell ${color}`}
    >
      {value}
    </td>
  );
}
