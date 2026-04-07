import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata = {
  title: "Cabinet Decisions — Drishti Nepal",
  description:
    "Track every major cabinet decision and its impact on manifesto commitments.",
};

export default async function DecisionsPage() {
  const { data: decisions } = await supabase
    .from("cabinet_decisions")
    .select("*")
    .order("decision_date", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          Cabinet Decisions
        </h1>
        <p className="mt-2 text-neutral-500">
          Every major government decision — tracked, analyzed, and linked to
          manifesto promises.
        </p>
      </div>

      {decisions && decisions.length > 0 ? (
        <div className="space-y-4">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-neutral-200 bg-white p-6 transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-neutral-800">
                    {d.title_en}
                  </h2>
                  {d.title_np && (
                    <p className="mt-0.5 text-neutral-400 font-nepali">
                      {d.title_np}
                    </p>
                  )}
                  {d.summary_en && (
                    <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                      {d.summary_en}
                    </p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <SignificanceBadge level={d.significance} />
                  <time className="text-sm text-neutral-400">
                    {new Date(d.decision_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </div>
              {d.source_url && (
                <a
                  href={d.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs text-blue-700 hover:underline"
                >
                  View original source →
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="No cabinet decisions tracked yet. Agents are monitoring government sources." />
      )}
    </div>
  );
}

function SignificanceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${colors[level] ?? "bg-neutral-50 text-neutral-600 border-neutral-200"}`}
    >
      {level}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20">
      <div className="mb-3 text-4xl">📋</div>
      <p className="text-neutral-400">{message}</p>
    </div>
  );
}
