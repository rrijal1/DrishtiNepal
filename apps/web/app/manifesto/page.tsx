import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata = {
  title: "Vacha Patra Tracker — Drishti Nepal",
  description:
    "Track progress on every vacha patra commitment. Bachha patra and karar patra.",
};

export default async function ManifestoPage() {
  const { data: items } = await supabase
    .from("manifesto_items")
    .select(
      "*, minister_manifesto_assignments(minister_id, ministers(name_en, name_np))",
    )
    .order("category", { ascending: true });

  const grouped = groupByCategory(items ?? []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          Vacha Patra Tracker
        </h1>
        <p className="mt-2 text-neutral-500">
          Every commitment from Ra Swa Pa&apos;s bachha patra and karar patra —
          tracked against actual government actions.
        </p>
      </div>

      {/* Summary stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Commitments" value={items?.length ?? 0} />
        <SummaryCard
          label="Completed"
          value={items?.filter((i) => i.status === "completed").length ?? 0}
          color="text-emerald-600"
        />
        <SummaryCard
          label="In Progress"
          value={items?.filter((i) => i.status === "in_progress").length ?? 0}
          color="text-blue-600"
        />
        <SummaryCard
          label="Not Started"
          value={items?.filter((i) => i.status === "not_started").length ?? 0}
          color="text-neutral-400"
        />
      </div>

      {/* Overall progress bar */}
      {items && items.length > 0 && (
        <div className="mb-10">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700">
              Overall Manifesto Completion
            </span>
            <span className="font-bold text-neutral-800">
              {Math.round(
                (items.filter((i) => i.status === "completed").length /
                  items.length) *
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
                  width: `${(items.filter((i) => i.status === "completed").length / items.length) * 100}%`,
                }}
              />
              <div
                className="bg-blue-400 transition-all"
                style={{
                  width: `${(items.filter((i) => i.status === "in_progress").length / items.length) * 100}%`,
                }}
              />
              <div
                className="bg-amber-400 transition-all"
                style={{
                  width: `${(items.filter((i) => i.status === "partially_fulfilled").length / items.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400" /> In Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Partial
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-neutral-200" /> Not
              Started
            </span>
          </div>
        </div>
      )}

      {/* By category */}
      {Object.entries(grouped).length > 0 ? (
        <div className="space-y-10">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className="mb-4 text-xl font-bold capitalize text-neutral-800">
                {category.replace(/_/g, " ")}
              </h2>
              <div className="space-y-3">
                {categoryItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-neutral-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-neutral-800">
                          {item.title_en}
                        </h3>
                        {item.title_np && (
                          <p className="text-sm text-neutral-400 font-nepali">
                            {item.title_np}
                          </p>
                        )}
                        {item.description_en && (
                          <p className="mt-2 text-sm text-neutral-600">
                            {item.description_en}
                          </p>
                        )}
                        {/* Assigned ministers */}
                        {item.minister_manifesto_assignments?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.minister_manifesto_assignments.map(
                              (a: any) => (
                                <a
                                  key={a.minister_id}
                                  href={`/ministers/${a.minister_id}`}
                                  className="rounded-full bg-[#1e3a5f]/5 px-2.5 py-0.5 text-xs font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                                >
                                  {a.ministers?.name_en}
                                </a>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                      <StatusChip status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20">
          <div className="mb-3 text-4xl">📜</div>
          <p className="text-neutral-400">
            Manifesto data is being prepared. Check back soon.
          </p>
        </div>
      )}
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

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; label: string }> = {
    completed: { bg: "bg-emerald-100 text-emerald-700", label: "Completed" },
    in_progress: { bg: "bg-blue-100 text-blue-700", label: "In Progress" },
    partially_fulfilled: {
      bg: "bg-amber-100 text-amber-700",
      label: "Partial",
    },
    not_started: {
      bg: "bg-neutral-100 text-neutral-500",
      label: "Not Started",
    },
    contradicted: { bg: "bg-red-100 text-red-700", label: "Contradicted" },
  };
  const s = map[status] ?? map.not_started;
  return (
    <span
      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg}`}
    >
      {s.label}
    </span>
  );
}

function groupByCategory(items: any[]): Record<string, any[]> {
  return items.reduce(
    (acc, item) => {
      const cat = item.category ?? "uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, any[]>,
  );
}
