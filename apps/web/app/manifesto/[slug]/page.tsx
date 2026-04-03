import { ManifestoItemDetail } from "@/components/ManifestoItemDetail";
import { getLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const revalidate = 300;

const KARAR_PATRA_AREAS = [
  {
    id: "pp-001",
    title_en: "Integrity & Good Governance",
    color: "#1e3a5f",
    bpRange: [1, 18],
  },
  {
    id: "pp-002",
    title_en: "Prosperous Middle-Class Nepal",
    color: "#0f6b3b",
    bpRange: [19, 60],
  },
  {
    id: "pp-003",
    title_en: "Jobs & Opportunity",
    color: "#92400e",
    bpRange: [61, 80],
  },
  {
    id: "pp-004",
    title_en: "Connected Nepal",
    color: "#5b21b6",
    bpRange: [81, 95],
  },
  {
    id: "pp-005",
    title_en: "Diaspora & Global Nepal",
    color: "#b91c1c",
    bpRange: [96, 100],
  },
];

function getKararArea(sourceId: string) {
  const m = sourceId?.match(/^bp-(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1]);
  return (
    KARAR_PATRA_AREAS.find((a) => n >= a.bpRange[0] && n <= a.bpRange[1]) ??
    null
  );
}

function calcProgress(ind: {
  baseline_value: number | null;
  current_value: number | null;
  target_value: number | null;
  direction: string | null;
}): number | null {
  if (
    ind.baseline_value == null ||
    ind.target_value == null ||
    ind.current_value == null
  )
    return null;
  const range = ind.target_value - ind.baseline_value;
  if (range === 0) return ind.current_value >= ind.target_value ? 100 : 0;
  if (ind.direction === "lower_is_better") {
    return Math.min(
      100,
      Math.max(
        0,
        ((ind.baseline_value - ind.current_value) /
          (ind.baseline_value - ind.target_value)) *
          100,
      ),
    );
  }
  return Math.min(
    100,
    Math.max(0, ((ind.current_value - ind.baseline_value) / range) * 100),
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
    description: `Tracking commitment ${slug} from RSP's bachha patra.`,
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
    { data: evidenceItems },
    { data: relatedPosts },
  ] = await Promise.all([
    supabase
      .from("outcome_indicators")
      .select("*")
      .eq("manifesto_item_id", item.id)
      .order("indicator_name"),
    supabase
      .from("action_manifesto_links")
      .select(
        "link_type, actions(id, title_en, action_date, category, sentiment, description_en, sources)",
      )
      .eq("manifesto_item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("cabinet_decision_manifesto_links")
      .select(
        "cabinet_decisions(id, title_en, decision_date, summary_en, significance)",
      )
      .eq("manifesto_item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("initiative_evidence")
      .select("id, assessment_en, citations, status, assessed_at, probability")
      .eq("manifesto_item_id", item.id)
      .eq("status", "approved")
      .order("assessed_at", { ascending: false })
      .limit(5),
    supabase
      .from("post_ministers")
      .select("posts(id, title_en, slug, published_at, category, image_url)")
      .in(
        "minister_id",
        (item.minister_manifesto_assignments ?? []).map(
          (a: any) => a.minister_id,
        ),
      )
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const allIndicators = indicators ?? [];
  let aggregateScore: number | null = null;
  if (allIndicators.length > 0) {
    let ws = 0,
      wt = 0;
    for (const ind of allIndicators) {
      const pct = calcProgress(ind as any);
      if (pct != null) {
        const w = (ind as any).weight ?? 1;
        ws += pct * w;
        wt += w;
      }
    }
    if (wt > 0) aggregateScore = Math.round(ws / wt);
  }

  return (
    <ManifestoItemDetail
      item={item as any}
      indicators={allIndicators as any[]}
      actionLinks={(actionLinks ?? []) as any[]}
      decisionLinks={(decisionLinks ?? []) as any[]}
      evidenceItems={(evidenceItems ?? []) as any[]}
      relatedPosts={(relatedPosts ?? []) as any[]}
      aggregateScore={aggregateScore}
      kararArea={getKararArea(item.source_id)}
      locale={locale}
    />
  );
}
