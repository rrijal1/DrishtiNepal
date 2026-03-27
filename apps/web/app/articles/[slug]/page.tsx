import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("posts")
    .select("title_en, content_en")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!post) return { title: "Article Not Found — Drishti Nepal" };
  return {
    title: `${post.title_en} | Drishti Nepal`,
    description: post.content_en?.slice(0, 160),
    openGraph: {
      title: post.title_en,
      description: post.content_en?.slice(0, 160),
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("posts")
    .select(
      "*, post_ministers(minister_id, ministers(id, name_en, name_np, portfolio_en))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Back */}
      <a
        href="/articles"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-800"
      >
        ← All Articles
      </a>

      {/* Meta */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#1e3a5f]">
          {post.category}
        </span>
        {post.ai_generated && (
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
            AI Generated
          </span>
        )}
        <time className="text-sm text-neutral-400">
          {new Date(post.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold leading-tight text-neutral-800 sm:text-4xl">
        {post.title_en}
      </h1>
      {post.title_np && (
        <p className="mt-2 text-xl text-neutral-400 font-nepali">
          {post.title_np}
        </p>
      )}

      {/* Related ministers */}
      {post.post_ministers?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.post_ministers.map((pm: any) => (
            <a
              key={pm.minister_id}
              href={`/ministers/${pm.minister_id}`}
              className="rounded-full bg-[#1e3a5f]/5 px-3 py-1 text-xs font-medium text-[#1e3a5f] transition hover:bg-[#1e3a5f]/10"
            >
              {pm.ministers?.name_en}
            </a>
          ))}
        </div>
      )}

      {/* English content */}
      <div className="prose prose-neutral mt-10 max-w-none">
        <div
          dangerouslySetInnerHTML={{ __html: formatContent(post.content_en) }}
        />
      </div>

      {/* Nepali content */}
      {post.content_np && (
        <>
          <hr className="my-10 border-neutral-200" />
          <div className="prose prose-neutral max-w-none font-nepali">
            <h2 className="text-xl font-bold text-neutral-800">नेपालीमा</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: formatContent(post.content_np),
              }}
            />
          </div>
        </>
      )}

      {/* Source */}
      {post.source_url && (
        <div className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">
            Source:{" "}
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1e3a5f] underline"
            >
              {post.source_url}
            </a>
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs text-amber-700">
          <strong>Disclaimer:</strong>{" "}
          {post.ai_generated
            ? "This article was AI-generated and reviewed per our editorial guidelines. "
            : ""}
          Drishti Nepal strives for accuracy and impartiality. If you find an
          error,{" "}
          <a href="/submit" className="underline">
            submit a correction
          </a>
          .
        </p>
      </div>
    </article>
  );
}

function formatContent(text?: string): string {
  if (!text) return "";
  // Convert markdown-like paragraphs to HTML
  return text
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}
