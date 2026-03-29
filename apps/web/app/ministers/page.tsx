import { MinisterCard } from "@/components/MinisterCard";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata = {
  title: "Cabinet Ministers — Drishti Nepal",
  description:
    "Scorecard and profile for every minister in Nepal's current cabinet.",
};

export default async function MinistersPage() {
  const { data: ministers } = await supabase
    .from("ministers")
    .select("*")
    .eq("status", "active")
    .order("overall_score", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          Cabinet Ministers
        </h1>
        <p className="mt-2 text-neutral-500">
          Performance scorecards for every minister in Nepal&apos;s cabinet,
          ranked by overall accountability score.
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterPill label="All" active />
        <FilterPill label="Top Performers" />
        <FilterPill label="Needs Improvement" />
        <FilterPill label="By Ministry" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ministers?.map((m) => <MinisterCard key={m.id} minister={m} />) ?? (
          <p className="col-span-full py-20 text-center text-neutral-400">
            No minister data available yet. Agents are initializing…
          </p>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-[#1e3a5f] text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {label}
    </button>
  );
}
