import { ManifestoExplorer } from "@/components/ManifestoExplorer";
import { getLocale } from "@/lib/i18n";
import { KARAR_AREAS } from "@/lib/manifesto-utils";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata = {
  title: "Vacha Patra Tracker — Drishti Nepal",
  description:
    "Track progress on every vacha patra commitment. Bachha patra and karar patra.",
};

function getBpNumber(sourceId: string): number {
  const match = sourceId?.match(/^bp-(\d+)$/);
  return match ? parseInt(match[1]) : 0;
}

export default async function ManifestoPage() {
  const locale = await getLocale();

  const { data: items } = await supabase
    .from("manifesto_items")
    .select(
      "*, minister_manifesto_assignments(minister_id, ministers(id, name_en, name_np)), outcome_indicators!outcome_indicators_manifesto_item_id_fkey(id, indicator_name, indicator_label, indicator_type, process_status, baseline_value, current_value, target_value, direction, weight)",
    )
    .like("source_id", "bp-%")
    .order("source_id", { ascending: true });

  const allItems = items ?? [];

  // Group by Karar Patra area
  const groups: Record<string, any[]> = {};
  for (const area of KARAR_AREAS) groups[area.id] = [];
  for (const item of allItems) {
    const num = getBpNumber(item.source_id);
    const area = KARAR_AREAS.find(
      (a) => num >= a.bpRange[0] && num <= a.bpRange[1],
    );
    if (area) groups[area.id].push(item);
  }

  const fulfilledCount = allItems.filter(
    (i) => i.status === "fulfilled" || i.status === "completed",
  ).length;
  const inProgressCount = allItems.filter(
    (i) => i.status === "in_progress" || i.status === "partially_fulfilled",
  ).length;
  const notStartedCount = allItems.filter(
    (i) => i.status === "not_started",
  ).length;

  const areaStats = KARAR_AREAS.map((area) => {
    const areaItems = groups[area.id] ?? [];
    const areaFulfilled = areaItems.filter(
      (i: any) => i.status === "fulfilled" || i.status === "completed",
    ).length;
    const areaInProgress = areaItems.filter(
      (i: any) =>
        i.status === "in_progress" || i.status === "partially_fulfilled",
    ).length;
    const areaPct =
      areaItems.length > 0
        ? Math.round(
            ((areaFulfilled + areaInProgress * 0.5) / areaItems.length) * 100,
          )
        : 0;
    return {
      id: area.id,
      title_en: area.label_en,
      title_np: area.label_np,
      color: area.color,
      colorLight: area.colorLight,
      bpRange: area.bpRange,
      areaItems,
      areaFulfilled,
      areaInProgress,
      areaPct,
    };
  });

  const overallPct =
    allItems.length > 0
      ? Math.round(
          ((fulfilledCount + inProgressCount * 0.5) / allItems.length) * 100,
        )
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800 sm:text-3xl">
          {locale === "en" ? "Vacha Patra Tracker" : "वाचा पत्र ट्र्याकर"}
        </h1>
        <p className="mt-2 text-neutral-500">
          {locale === "en"
            ? "100 commitments tracked against real government actions and outcome data."
            : "१०० प्रतिबद्धताहरू वास्तविक सरकारी कार्य र परिणाम डाटाको आधारमा ट्र्याक गरिएको।"}
        </p>
      </div>

      {/* Summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <SummaryCard
          label={locale === "en" ? "Total" : "कुल"}
          value={allItems.length}
        />
        <SummaryCard
          label={locale === "en" ? "Fulfilled" : "पूरा"}
          value={fulfilledCount}
          color="text-emerald-600"
        />
        <SummaryCard
          label={locale === "en" ? "In Progress" : "प्रगतिमा"}
          value={inProgressCount}
          color="text-blue-600"
        />
        <SummaryCard
          label={locale === "en" ? "Not Started" : "सुरु नभएको"}
          value={notStartedCount}
          color="text-neutral-400"
        />
      </div>

      {/* Overall progress bar */}
      {allItems.length > 0 && (
        <div className="mb-10">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700">
              {locale === "en" ? "Overall Progress" : "समग्र प्रगति"}
            </span>
            <span className="font-bold text-neutral-800">{overallPct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="flex h-full">
              <div
                className="bg-emerald-500"
                style={{
                  width: `${(fulfilledCount / allItems.length) * 100}%`,
                }}
              />
              <div
                className="bg-blue-400"
                style={{
                  width: `${(inProgressCount / allItems.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Interactive explorer */}
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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
      <p className={`text-2xl font-bold ${color ?? "text-neutral-800"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
    </div>
  );
}
