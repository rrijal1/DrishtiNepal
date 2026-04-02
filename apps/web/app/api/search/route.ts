import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const getDb = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const db = getDb();
  const term = `%${q}%`;

  const [ministers, manifesto, posts] = await Promise.all([
    db
      .from("ministers")
      .select("id, name_en, name_np, portfolio_en, overall_score, status")
      .or(
        `name_en.ilike.${term},name_np.ilike.${term},portfolio_en.ilike.${term}`,
      )
      .eq("status", "active")
      .limit(5),

    db
      .from("manifesto_items")
      .select("id, source_id, title_en, title_np, category, status")
      .or(
        `title_en.ilike.${term},title_np.ilike.${term},item_text_en.ilike.${term}`,
      )
      .limit(5),

    db
      .from("posts")
      .select(
        "id, slug, title_en, title_np, category, published_at, ai_generated",
      )
      .or(
        `title_en.ilike.${term},title_np.ilike.${term},content_en.ilike.${term}`,
      )
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(5),
  ]);

  const results = [
    ...(ministers.data ?? []).map((m) => ({
      type: "minister" as const,
      id: m.id,
      title: m.name_en,
      subtitle: m.portfolio_en,
      titleNp: m.name_np,
      score: m.overall_score,
      href: `/ministers/${m.id}`,
    })),
    ...(manifesto.data ?? []).map((item) => ({
      type: "manifesto" as const,
      id: item.id,
      title: item.title_en,
      titleNp: item.title_np,
      subtitle: `${item.source_id} · ${item.category}`,
      status: item.status,
      href: `/manifesto/${item.source_id}`,
    })),
    ...(posts.data ?? []).map((p) => ({
      type: "article" as const,
      id: p.id,
      title: p.title_en,
      titleNp: p.title_np,
      subtitle: p.category,
      ai_generated: p.ai_generated,
      href: `/articles/${p.slug}`,
    })),
  ];

  return NextResponse.json({ results, query: q });
}
