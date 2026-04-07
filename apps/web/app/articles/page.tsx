import { getSortedPostsData } from "@/lib/articles";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 60;

export const metadata = {
  title: "Articles & Analysis — Drishti Nepal",
  description:
    "AI-generated and human-reviewed political accountability analysis.",
};

interface UnifiedPost {
  id: string;
  slug: string;
  title: string;
  title_np?: string;
  published_at: string;
  category: string | null;
  ai_generated: boolean;
  excerpt: string;
}

export default async function ArticlesPage() {
  // 1. Fetch AI-generated posts from Supabase
  const { data: aiPosts } = await supabase
    .from("posts")
    .select(
      "id, title_en, title_np, slug, published_at, category, excerpt_en, ai_generated",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);

  // 2. Fetch human-written posts from the filesystem
  const humanPosts = getSortedPostsData();

  // 3. Unify the data structures
  const unifiedAiPosts: UnifiedPost[] = (aiPosts || []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title_en,
    title_np: p.title_np,
    published_at: p.published_at,
    category: p.category,
    ai_generated: p.ai_generated,
    excerpt: p.excerpt_en,
  }));

  const unifiedHumanPosts: UnifiedPost[] = humanPosts.map((p) => ({
    id: p.slug,
    slug: p.slug,
    title: p.title,
    published_at: p.date, // Assuming YYYY-MM-DD format is compatible
    category: "Editorial", // Assign a default category
    ai_generated: false,
    excerpt: p.excerpt,
  }));

  // 4. Combine and sort all posts
  const allPosts = [...unifiedAiPosts, ...unifiedHumanPosts].sort((a, b) => {
    return (
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          Articles & Analysis
        </h1>
        <p className="mt-2 text-neutral-500">
          Bilingual accountability reports from AI agents and human experts.
        </p>
      </div>

      {allPosts && allPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((p) => (
            <Link
              key={p.id}
              href={`/articles/${p.slug}`}
              className="group flex flex-col rounded-xl border border-neutral-200 bg-white transition hover:border-[#0EA5E9]/30 hover:shadow-lg"
            >
              <div className="flex-1 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {p.category}
                  </span>
                  {p.ai_generated ? (
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600">
                      AI Generated
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Human Written
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-neutral-800 group-hover:text-blue-700">
                  {p.title}
                </h2>
                {p.title_np && (
                  <p className="mt-1 text-sm text-neutral-400 font-nepali">
                    {p.title_np}
                  </p>
                )}
                {p.excerpt && (
                  <p className="mt-3 text-sm text-neutral-500 line-clamp-3">
                    {p.excerpt}
                  </p>
                )}
              </div>
              <div className="border-t border-neutral-100 px-6 py-3">
                <time className="text-xs text-neutral-400">
                  {new Date(p.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20">
          <div className="mb-3 text-4xl">📝</div>
          <p className="text-neutral-400">
            No articles published yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
