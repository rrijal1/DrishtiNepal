import { supabaseAdmin } from "@/lib/admin";
import { headers } from "next/headers";
import { AdminDashboard } from "./AdminDashboard";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Drishti Nepal",
  description:
    "Unified admin dashboard: review posts, moderate queue, add decisions.",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safe<T = any>(
  fn: () => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T[]> {
  try {
    const { data, error } = await fn();
    if (error) console.error("[admin page]", error);
    return (data as T[] | null) ?? [];
  } catch (e) {
    console.error("[admin page]", e);
    return [];
  }
}

export default async function AdminPage() {
  const hdrs = await headers();
  const username = hdrs.get("x-admin-user") ?? "admin";
  const db = supabaseAdmin();

  const POST_FIELDS =
    "id, slug, title_en, title_np, content_en, content_np, excerpt_en, category, ai_generated, status, source_url, tags, created_at, published_at";

  const [
    draftPosts,
    reviewPosts,
    recentPublished,
    pendingQueue,
    recentReviewed,
    manifestoItems,
    indicators,
  ] = await Promise.all([
    safe(() =>
      db
        .from("posts")
        .select(POST_FIELDS)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(20),
    ),
    safe(() =>
      db
        .from("posts")
        .select(POST_FIELDS)
        .eq("status", "review")
        .order("created_at", { ascending: false })
        .limit(30),
    ),
    safe(() =>
      db
        .from("posts")
        .select(
          "id, slug, title_en, title_np, category, status, published_at, created_at",
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10),
    ),
    safe(() =>
      db
        .from("content_review_queue")
        .select("*")
        .in("status", ["pending", "in_review"])
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(50),
    ),
    safe(() =>
      db
        .from("content_review_queue")
        .select("*")
        .in("status", ["approved", "rejected", "needs_revision"])
        .order("reviewed_at", { ascending: false })
        .limit(20),
    ),
    safe(() =>
      db
        .from("manifesto_items")
        .select("id, source_id, title_en")
        .like("source_id", "bp-%")
        .order("source_id"),
    ),
    safe(() =>
      db
        .from("outcome_indicators")
        .select(
          "id, indicator_name, indicator_label, category, unit, direction, baseline_value, target_value, current_value, measured_date, source, source_url",
        )
        .order("category")
        .order("indicator_label"),
    ),
  ]);

  return (
    <AdminDashboard
      draftPosts={draftPosts as any[]}
      reviewPosts={reviewPosts as any[]}
      recentPublished={recentPublished as any[]}
      pendingQueue={pendingQueue as any[]}
      recentReviewed={recentReviewed as any[]}
      manifestoItems={manifestoItems as any[]}
      indicators={indicators as any[]}
      username={username}
    />
  );
}
