import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export const metadata = {
  title: "Articles & Analysis — Drishti Nepal",
  description:
    "AI-generated and human-reviewed political accountability analysis.",
};

export default async function ArticlesPage() {
  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id, title_en, title_np, slug, published_at, category, content_en, ai_generated",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          Articles & Analysis
        </h1>
        <p className="mt-2 text-neutral-500">
          Bilingual accountability reports — AI-generated and human-reviewed.
        </p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <a
              key={p.id}
              href={`/articles/${p.slug}`}
              className="group flex flex-col rounded-xl border border-neutral-200 bg-white transition hover:border-[#1e3a5f]/30 hover:shadow-lg"
            >
              <div className="flex-1 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#1e3a5f]">
                    {p.category}
                  </span>
                  {p.ai_generated && (
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600">
                      AI Generated
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-neutral-800 group-hover:text-[#1e3a5f]">
                  {p.title_en}
                </h2>
                {p.title_np && (
                  <p className="mt-1 text-sm text-neutral-400 font-nepali">
                    {p.title_np}
                  </p>
                )}
                {p.content_en && (
                  <p className="mt-3 text-sm text-neutral-500 line-clamp-3">
                    {p.content_en.slice(0, 200)}…
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
            </a>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20">
          <div className="mb-3 text-4xl">📝</div>
          <p className="text-neutral-400">
            No articles published yet. Content agents are initializing…
          </p>
        </div>
      )}
    </div>
  );
}
