import { ManifestoExplorer } from "@/components/ManifestoExplorer";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata = {
  title: "Vacha Patra Tracker — Drishti Nepal",
  description:
    "Track progress on every vacha patra commitment. Bachha patra and karar patra.",
};

const KARAR_PATRA_AREAS: Array<{
  id: string;
  title_en: string;
  title_np: string;
  description_en: string;
  bpRange: [number, number];
  color: string;
  colorLight: string;
}> = [
  {
    id: "pp-001",
    title_en: "Integrity & Good Governance",
    title_np: "सुशासन र स्वच्छता",
    description_en:
      "Anti-corruption campaign, digital government services, judicial reform, and end to politicisation of state institutions.",
    bpRange: [1, 18],
    color: "#1e3a5f",
    colorLight: "#eef2f7",
  },
  {
    id: "pp-002",
    title_en: "Prosperous Middle-Class Nepal",
    title_np: "समृद्ध मध्यमवर्गीय नेपाल",
    description_en:
      "7% GDP growth, per capita ≥ $3,000, $100B economy, universal health insurance, education reform, and financial inclusion.",
    bpRange: [19, 60],
    color: "#0f6b3b",
    colorLight: "#edf7f2",
  },
  {
    id: "pp-003",
    title_en: "Jobs & Opportunity",
    title_np: "रोजगारी र अवसर",
    description_en:
      "500,000 new formal jobs, reduce forced migration, and priority sectors: IT, construction, tourism, agriculture, and industry.",
    bpRange: [61, 80],
    color: "#92400e",
    colorLight: "#fdf6ed",
  },
  {
    id: "pp-004",
    title_en: "Connected Nepal",
    title_np: "जडान नेपाल",
    description_en:
      "15,000 MW installed capacity, 30,000 km highways, high-speed internet to all settlements, and 10 signature infrastructure projects.",
    bpRange: [81, 95],
    color: "#5b21b6",
    colorLight: "#f3f0fb",
  },
  {
    id: "pp-005",
    title_en: "Diaspora & Global Nepal",
    title_np: "प्रवासी र विश्व नेपाल",
    description_en:
      "Online voting for Nepalis abroad, citizenship continuity, Sovereign Diaspora Fund, and dignified foreign employment.",
    bpRange: [96, 100],
    color: "#b91c1c",
    colorLight: "#fef2f2",
  },
];

function getBpNumber(sourceId: string): number {
  const match = sourceId?.match(/^bp-(\d+)$/);
  return match ? parseInt(match[1]) : 0;
}

function groupByKararPatra(items: any[]) {
  const groups: Record<string, any[]> = {};
  for (const area of KARAR_PATRA_AREAS) {
    groups[area.id] = [];
  }
  const ungrouped: any[] = [];
  for (const item of items) {
    const num = getBpNumber(item.source_id);
    const area = KARAR_PATRA_AREAS.find(
      (a) => num >= a.bpRange[0] && num <= a.bpRange[1],
    );
    if (area) {
      groups[area.id].push(item);
    } else {
      ungrouped.push(item);
    }
  }
  return { groups, ungrouped };
}

export default async function ManifestoPage() {
  const { data: items } = await supabase
    .from("manifesto_items")
    .select(
      "*, minister_manifesto_assignments(minister_id, ministers(id, name_en, name_np)), outcome_indicators!outcome_indicators_manifesto_item_id_fkey(*)",
    )
    .like("source_id", "bp-%")
    .order("source_id", { ascending: true });

  const allItems = items ?? [];
  const { groups } = groupByKararPatra(allItems);

  const fulfilledCount = allItems.filter(
    (i) => i.status === "fulfilled" || i.status === "completed",
  ).length;
  const inProgressCount = allItems.filter(
    (i) => i.status === "in_progress" || i.status === "partially_fulfilled",
  ).length;
  const notStartedCount = allItems.filter(
    (i) => i.status === "not_started",
  ).length;

  // Precompute per-area stats so we can use them in both the card grid and section headers
  const areaStats = KARAR_PATRA_AREAS.map((area) => {
    const areaItems = groups[area.id] ?? [];
    const areaFulfilled = areaItems.filter(
      (i) => i.status === "fulfilled" || i.status === "completed",
    ).length;
    const areaInProgress = areaItems.filter(
      (i) => i.status === "in_progress" || i.status === "partially_fulfilled",
    ).length;
    const areaPct =
      areaItems.length > 0
        ? Math.round(
            ((areaFulfilled + areaInProgress * 0.5) / areaItems.length) * 100,
          )
        : 0;
    return { ...area, areaItems, areaFulfilled, areaInProgress, areaPct };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          Vacha Patra Tracker
        </h1>
        <p className="mt-2 text-neutral-500">
          100 commitments from Ra Swa Pa&apos;s Bachha Patra — tracked against
          real government actions and outcome data.
        </p>
      </div>

      {/* Summary stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Commitments" value={allItems.length} />
        <SummaryCard
          label="Fulfilled"
          value={fulfilledCount}
          color="text-emerald-600"
        />
        <SummaryCard
          label="In Progress"
          value={inProgressCount}
          color="text-blue-600"
        />
        <SummaryCard
          label="Not Started"
          value={notStartedCount}
          color="text-neutral-400"
        />
      </div>

      {/* Overall progress bar */}
      {allItems.length > 0 && (
        <div className="mb-10">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700">
              Overall Manifesto Progress
            </span>
            <span className="font-bold text-neutral-800">
              {Math.round(
                ((fulfilledCount + inProgressCount * 0.5) / allItems.length) *
                  100,
              )}
              %
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="flex h-full">
              <div
                className="bg-emerald-500 transition-all"
                style={{
                  width: `${(fulfilledCount / allItems.length) * 100}%`,
                }}
              />
              <div
                className="bg-blue-400 transition-all"
                style={{
                  width: `${(inProgressCount / allItems.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Fulfilled
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400" /> In Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-neutral-200" /> Not
              Started
            </span>
          </div>
        </div>
      )}

      {/* Interactive priority area cards + filtered item list */}
      <ManifestoExplorer areaStats={areaStats} defaultAreaId="pp-003" />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 text-center">
      <p className={`text-3xl font-bold ${color ?? "text-neutral-800"}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-neutral-500">{label}</p>
    </div>
  );
}
