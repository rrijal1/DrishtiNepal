import { supabase } from "@/lib/supabase";
import { AdminDashboard } from "./AdminDashboard";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard — Drishti Nepal",
  description:
    "Review and approve articles, manage indicators, and configure data sources.",
};

export default async function AdminPage() {
  const [
    { data: draftPosts },
    { data: reviewPosts },
    { data: recentPublished },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, slug, title_en, title_np, content_en, content_np, excerpt_en, category, ai_generated, status, source_url, tags, created_at",
      )
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("posts")
      .select(
        "id, slug, title_en, title_np, content_en, content_np, excerpt_en, category, ai_generated, status, source_url, tags, created_at",
      )
      .eq("status", "review")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("posts")
      .select(
        "id, slug, title_en, title_np, category, status, published_at, created_at",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <AdminDashboard
      draftPosts={(draftPosts ?? []) as any[]}
      reviewPosts={(reviewPosts ?? []) as any[]}
      recentPublished={(recentPublished ?? []) as any[]}
    />
  );
}
