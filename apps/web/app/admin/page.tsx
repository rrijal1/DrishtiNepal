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

  let db: ReturnType<typeof supabaseAdmin>;
  try {
    db = supabaseAdmin();
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            Configuration Error
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
              SUPABASE_SERVICE_KEY
            </code>{" "}
            is not set. Add it to your Vercel environment variables and
            redeploy.
          </p>
        </div>
      </div>
    );
  }

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
    ministers,
    allScores,
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
          "id, indicator_name, indicator_label, category, unit, direction, baseline_value, target_value, current_value, measured_date, source, source_url, indicator_type, process_status, parent_indicator_id, source_id",
        )
        .order("category")
        .order("indicator_label"),
    ),
    safe(() =>
      db
        .from("ministers")
        .select("id, name_en, ministry")
        .eq("status", "active")
        .order("name_en"),
    ),
    safe(() =>
      db
        .from("scores")
        .select(
          "id, minister_id, period_start, period_end, overall, outcome_score, manifesto_compliance, public_accountability, scored_at",
        )
        .order("period_start", { ascending: false })
        .limit(200),
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
      ministers={ministers as any[]}
      allScores={allScores as any[]}
      username={username}
    />
  );
}
