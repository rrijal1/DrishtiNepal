import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { getPostData, getAllPostSlugs, postsDirectory } from "@/lib/articles";
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

// Generate static pages at build time
export async function generateStaticParams() {
  const { data: dbPosts } = await supabase.from("posts").select("slug").eq("status", "published");
  const filePosts = getAllPostSlugs();
  
  const dbSlugs = dbPosts?.map(p => ({ slug: p.slug })) || [];
  
  return [...dbSlugs, ...filePosts];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filePath = path.join(postsDirectory, `${slug}.md`);
  const isHumanPost = fs.existsSync(filePath);

  let title = "Article Not Found — Drishti Nepal";
  let description = "The requested article could not be found.";

  if (isHumanPost) {
    const postData = await getPostData(slug);
    title = `${postData.title} | Drishti Nepal`;
    description = postData.excerpt;
  } else {
    const { data: post } = await supabase
      .from("posts")
      .select("title_en, excerpt_en")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (post) {
      title = `${post.title_en} | Drishti Nepal`;
      description = post.excerpt_en;
    }
  }

  return { title, description, openGraph: { title, description } };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filePath = path.join(postsDirectory, `${slug}.md`);
  const isHumanPost = fs.existsSync(filePath);

  if (isHumanPost) {
    return <HumanArticle slug={slug} />;
  }

  const { data: post } = await supabase
    .from("posts")
    .select(
      "*, post_ministers(minister_id, ministers(id, name_en, name_np, portfolio_en))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  return <AiArticle post={post} />;
}

async function HumanArticle({ slug }: { slug: string }) {
    const postData = await getPostData(slug);
    return (
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <Link href="/articles" className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-800">
                ← All Articles
            </Link>

            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Human Written
                </span>
                <span className="text-sm text-neutral-500">By {postData.author}</span>
                <time className="text-sm text-neutral-400">
                    {new Date(postData.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
            </div>

            <h1 className="text-3xl font-bold leading-tight text-neutral-800 sm:text-4xl">
                {postData.title}
            </h1>

            <div className="prose prose-neutral mt-10 max-w-none">
                {postData.content}
            </div>
            
            <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">
                <strong>Disclaimer:</strong> Drishti Nepal strives for accuracy and impartiality. If you find an error,{" "}
                <Link href="/submit" className="underline">submit a correction</Link>.
              </p>
            </div>
        </article>
    );
}

function AiArticle({ post }: { post: any }) {
    return (
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <Link href="/articles" className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-800">
                ← All Articles
            </Link>

            <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {post.category}
                </span>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
                    AI Generated
                </span>
                <time className="text-sm text-neutral-400">
                    {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
            </div>

            <h1 className="text-3xl font-bold leading-tight text-neutral-800 sm:text-4xl">
                {post.title_en}
            </h1>
            {post.title_np && (
                <p className="mt-2 text-xl text-neutral-400 font-nepali">{post.title_np}</p>
            )}

            {post.post_ministers?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {post.post_ministers.map((pm: any) => (
                        <Link key={pm.minister_id} href={`/ministers/${pm.minister_id}`} className="rounded-full bg-[#0EA5E9]/5 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-[#0EA5E9]/10">
                            {pm.ministers?.name_en}
                        </Link>
                    ))}
                </div>
            )}

            <div className="prose prose-neutral mt-10 max-w-none" style={{ whiteSpace: 'pre-wrap' }}>
                {post.content_en}
            </div>

            {post.content_np && (
                <>
                    <hr className="my-10 border-neutral-200" />
                    <div className="prose prose-neutral max-w-none font-nepali" style={{ whiteSpace: 'pre-wrap' }}>
                        <h2 className="text-xl font-bold text-neutral-800">नेपालीमा</h2>
                        {post.content_np}
                    </div>
                </>
            )}

            {post.source_url && (
                <div className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs text-neutral-500">
                        Source: <a href={post.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{post.source_url}</a>
                    </p>
                </div>
            )}

            <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-700">
                    <strong>Disclaimer:</strong> This article was AI-generated and reviewed per our editorial guidelines. Drishti Nepal strives for accuracy and impartiality. If you find an error,{" "}
                    <Link href="/submit" className="underline">submit a correction</Link>.
                </p>
            </div>
        </article>
    );
}
