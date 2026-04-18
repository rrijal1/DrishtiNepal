import { IndicatorList } from "@/components/IndicatorList";
import { getLocale } from "@/lib/i18n";
import { calcProgress, KARAR_AREAS } from "@/lib/manifesto-utils";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const revalidate = 300;

function getKararArea(sourceId: string) {
  const m = sourceId?.match(/^bp-(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1]);
  return (
    KARAR_AREAS.find((a) => n >= a.bpRange[0] && n <= a.bpRange[1]) ?? null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: item } = await supabase
    .from("manifesto_items")
    .select("title_en, category")
    .eq("source_id", slug)
    .maybeSingle();
  if (!item) return { title: "Commitment Not Found — Drishti Nepal" };
  return {
    title: `${item.title_en ?? slug} | Vacha Patra — Drishti Nepal`,
    description: `Tracking commitment ${slug}.`,
  };
}

export default async function ManifestoItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  const { data: item } = await supabase
    .from("manifesto_items")
    .select(
      "*, minister_manifesto_assignments(minister_id, ministers(name_en, name_np, id))",
    )
    .eq("source_id", slug)
    .maybeSingle();

  if (!item) notFound();

  const [
    { data: indicators },
    { data: actionLinks },
    { data: decisionLinks },
    { data: relatedPosts },
  ] = await Promise.all([
    supabase
      .from("outcome_indicators")
      .select("*, sources(name_en, slug)")
      .eq("manifesto_item_id", item.id)
      .order("indicator_type")
      .order("indicator_name"),
    supabase
      .from("action_manifesto_links")
      .select(
        "link_type, actions(id, title_en, action_date, category, sentiment)",
      )
      .eq("manifesto_item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("cabinet_decision_manifesto_links")
      .select("cabinet_decisions(id, title_en, decision_date, significance)")
      .eq("manifesto_item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("posts")
      .select("id, title_en, slug, published_at, category")
      .eq("status", "published")
      .contains("tags", [slug])
      .order("published_at", { ascending: false })
      .limit(5),
  ]);

  const allIndicators = indicators ?? [];
  const resultIndicators = allIndicators.filter(
    (i: any) => i.indicator_type === "result",
  );

  // Aggregate score from result indicators only
  let aggregateScore: number | null = null;
  if (resultIndicators.length > 0) {
    let ws = 0,
      wt = 0;
    for (const ind of resultIndicators) {
      const pct = calcProgress(ind as any);
      if (pct != null) {
        const w = (ind as any).weight ?? 1;
        ws += pct * w;
        wt += w;
      }
    }
    if (wt > 0) aggregateScore = Math.round(ws / wt);
  }

  const area = getKararArea(item.source_id);
  const ministers = (item.minister_manifesto_assignments ?? [])
    .map((a: any) => a.ministers)
    .filter(Boolean);

  const title =
    locale === "en" ? item.title_en : item.title_np || item.title_en;
  const description =
    locale === "en"
      ? item.item_text_en
      : item.item_text_np || item.item_text_en;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <a
        href="/manifesto"
        className="mb-6 inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800"
      >
        {locale === "en" ? "← Manifesto" : "← वाचा पत्र"}
      </a>

      {/* ── Header ── */}
      <div className="mb-8">
        {area && (
          <span
            className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: area.color }}
          >
            {locale === "en" ? area.label_en : area.label_np}
          </span>
        )}
        <h1 className="text-2xl font-bold text-neutral-800 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-xs text-neutral-400">
          {item.source_id.toUpperCase()}
        </p>
        {description && <p className="mt-3 text-neutral-600">{description}</p>}

        {/* Score + Ministers */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {aggregateScore !== null && (
            <div className="rounded-lg border border-neutral-200 bg-white px-4 py-2">
              <span className="text-xs text-neutral-400">
                {locale === "en" ? "Score" : "स्कोर"}
              </span>
              <p className="text-2xl font-bold text-blue-700">
                {aggregateScore}/100
              </p>
            </div>
          )}
          {ministers.length > 0 && (
            <div className="text-sm text-neutral-600">
              <span className="text-xs text-neutral-400">
                {locale === "en" ? "Responsible:" : "जिम्मेवार:"}
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {ministers.map((m: any) => (
                  <a
                    key={m.id}
                    href={`/ministers/${m.id}`}
                    className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {locale === "en" ? m.name_en : m.name_np || m.name_en}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Indicators ── */}
      {allIndicators.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-neutral-800">
            {locale === "en" ? "Indicators" : "सूचकहरू"}
          </h2>
          <IndicatorList indicators={allIndicators as any[]} locale={locale} />
        </div>
      )}

      {/* ── Actions ── */}
      {actionLinks && actionLinks.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-neutral-800">
            {locale === "en" ? "Related Actions" : "सम्बन्धित कार्यहरू"}
          </h2>
          <div className="space-y-2">
            {actionLinks.map((al: any, i: number) => {
              const a = al.actions;
              if (!a) return null;
              return (
                <div
                  key={a.id ?? i}
                  className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 text-sm"
                >
                  <SentimentDot sentiment={a.sentiment} />
                  <div>
                    <p className="font-medium text-neutral-800">{a.title_en}</p>
                    <p className="text-xs text-neutral-400">
                      {a.category} ·{" "}
                      {new Date(a.action_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Cabinet Decisions ── */}
      {decisionLinks && decisionLinks.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-neutral-800">
            {locale === "en" ? "Cabinet Decisions" : "क्याबिनेट निर्णयहरू"}
          </h2>
          <div className="space-y-2">
            {decisionLinks.map((dl: any, i: number) => {
              const d = dl.cabinet_decisions;
              if (!d) return null;
              return (
                <div
                  key={d.id ?? i}
                  className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"
                >
                  <p className="font-medium text-neutral-800">{d.title_en}</p>
                  <p className="text-xs text-neutral-400">
                    {new Date(d.decision_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Related Posts ── */}
      {relatedPosts && relatedPosts.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-neutral-800">
            {locale === "en" ? "Related Articles" : "सम्बन्धित लेखहरू"}
          </h2>
          <div className="space-y-2">
            {relatedPosts.map((p: any) => (
              <a
                key={p.id}
                href={`/articles/${p.slug}`}
                className="block rounded-lg border border-neutral-200 bg-white p-3 text-sm transition hover:shadow-sm"
              >
                <p className="font-medium text-neutral-800 hover:text-blue-700">
                  {p.title_en}
                </p>
                <p className="text-xs text-neutral-400">
                  {p.category} ·{" "}
                  {new Date(p.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
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
      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${colors[sentiment] ?? "bg-neutral-300"}`}
    />
  );
}
