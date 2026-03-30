import { ScoreBadge, ScoreBar } from "@/components/ScoreBadge";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/i18n";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const { data: m } = await supabase
    .from("ministers")
    .select("name_en, name_np, portfolio_en, portfolio_np")
    .eq("id", id)
    .single();
  if (!m) return { title: "Minister Not Found — Drishti Nepal" };
  
  const name = locale === "en" ? m.name_en : (m.name_np || m.name_en);
  const portfolio = locale === "en" ? m.portfolio_en : (m.portfolio_np || m.portfolio_en);
  
  return {
    title: `${name} — ${portfolio} | Drishti Nepal`,
    description: `Accountability profile and score for ${name}, ${portfolio}`,
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

  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("minister_id", id)
    .order("scored_at", { ascending: false })
    .limit(1);

  const { data: actions } = await supabase
    .from("actions")
    .select("id, title_en, title_np, action_date, category, sentiment")
    .eq("minister_id", id)
    .order("action_date", { ascending: false })
    .limit(20);

  const { data: manifestoLinks } = await supabase
    .from("minister_manifesto_assignments")
    .select("*, manifesto_items(*)")
    .eq("minister_id", id);

  const latestScore = scores?.[0];
  const m = minister;
  
  const t = {
    back: locale === "en" ? "← Back to Ministers" : "← मन्त्रीहरूमा फर्कनुहोस्",
    scoreTitle: locale === "en" ? "Score Breakdown" : "स्कोरको विस्तृत विवरण",
    manifestoLabel: locale === "en" ? "Manifesto Compliance (70%)" : "वाचा पत्र पालना (७०%)",
    accountabilityLabel: locale === "en" ? "Public Accountability (30%)" : "सार्वजनिक जवाफदेहिता (३०%)",
    overallLabel: locale === "en" ? "Overall" : "समग्र स्कोर",
    noScore: locale === "en" ? "Score not yet calculated." : "स्कोर अझै गणना गरिएको छैन।",
    recentActions: locale === "en" ? "Recent Actions" : "हालैका कार्यहरू",
    noActions: locale === "en" ? "No actions tracked yet." : "कुनै कार्यहरू ट्र्याक गरिएको छैन।",
    manifestoTitle: locale === "en" ? "Manifesto Commitments" : "वाचा पत्रका प्रतिबद्धताहरू",
    noManifesto: locale === "en" ? "No manifesto items assigned yet." : "कुनै वाचा पत्रका बुँदाहरू तोकिएको छैन।",
  };

  const name = locale === "en" ? m.name_en : (m.name_np || m.name_en);
  const portfolio = locale === "en" ? m.portfolio_en : (m.portfolio_np || m.portfolio_en);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back link */}
      <a
        href="/ministers"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-800"
      >
        {t.back}
      </a>

      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
          {m.photo_url ? (
            <img
              src={m.photo_url}
              alt={m.name_en}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-300">
              {m.name_en.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">
                {name}
              </h1>
              {locale === "en" && m.name_np && (
                <p className="text-lg text-neutral-400 font-nepali">
                  {m.name_np}
                </p>
              )}
              <p className={clsx("mt-1 text-neutral-500", locale === "np" && "font-nepali")}>{portfolio}</p>
            </div>
            <ScoreBadge score={m.overall_score} size="lg" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {m.party}
            </span>
            {m.district && (
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                {m.district}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-neutral-800">
            {t.scoreTitle}
          </h2>
          {latestScore ? (
            <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
              <ScoreBar
                label={t.manifestoLabel}
                score={latestScore.manifesto_compliance}
              />
              <ScoreBar
                label={t.accountabilityLabel}
                score={latestScore.public_accountability}
              />
              <div className="border-t border-neutral-100 pt-4">
                <ScoreBar label={t.overallLabel} score={latestScore.overall} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-400">
              {t.noScore}
            </div>
          )}

          {/* Activity timeline */}
          <h2 className="mb-4 mt-10 text-xl font-bold text-neutral-800">
            {t.recentActions}
          </h2>
          {actions && actions.length > 0 ? (
            <div className="space-y-3">
              {actions.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <SentimentDot sentiment={a.sentiment} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-neutral-800">
                      {locale === "en" ? a.title_en : (a.title_np || a.title_en)}
                    </h3>
                    {locale === "en" && a.title_np && (
                      <p className="text-sm text-neutral-400 font-nepali">
                        {a.title_np}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                      <span>{a.category}</span>
                      <span>·</span>
                      <span>
                        {new Date(a.action_date).toLocaleDateString(locale === "en" ? "en-US" : "ne-NP")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-400">
              {t.noActions}
            </div>
          )}
        </div>

        {/* Sidebar — Manifesto items */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-neutral-800">
            {t.manifestoTitle}
          </h2>
          {manifestoLinks && manifestoLinks.length > 0 ? (
            <div className="space-y-3">
              {manifestoLinks.map((link) => (
                <div
                  key={link.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <h3 className="text-sm font-semibold text-neutral-800">
                    {locale === "en" ? link.manifesto_items?.title_en : (link.manifesto_items?.title_np || link.manifesto_items?.title_en)}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {locale === "en" 
                      ? link.manifesto_items?.item_text_en?.slice(0, 100) 
                      : (link.manifesto_items?.item_text_np || link.manifesto_items?.item_text_en)?.slice(0, 100)}…
                  </p>
                  <div className="mt-2">
                    <StatusChip
                      status={link.manifesto_items?.status ?? "not_started"}
                      locale={locale}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-400">
              {t.noManifesto}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const colors: Record<string, string> = {
    positive: "bg-emerald-400",
    neutral: "bg-neutral-300",
    negative: "bg-red-400",
    mixed: "bg-amber-400",
  };
  return (
    <div
      className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${colors[sentiment] ?? "bg-neutral-300"}`}
    />
  );
}

function StatusChip({ status, locale }: { status: string; locale: string }) {
  const map: Record<string, Record<string, { bg: string; label: string }>> = {
    en: {
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
      broken: { bg: "bg-red-100 text-red-700", label: "Broken" },
    },
    np: {
      completed: { bg: "bg-emerald-100 text-emerald-700", label: "सम्पन्न" },
      in_progress: { bg: "bg-blue-100 text-blue-700", label: "प्रगतिमा" },
      partially_fulfilled: {
        bg: "bg-amber-100 text-amber-700",
        label: "आंशिक",
      },
      not_started: {
        bg: "bg-neutral-100 text-neutral-500",
        label: "सुरु नभएको",
      },
      broken: { bg: "bg-red-100 text-red-700", label: "तोडिएको" },
    }
  };
  const s = map[locale]?.[status] ?? map[locale]?.not_started;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg}`}>
      {s.label}
    </span>
  );
}

import clsx from "clsx";

