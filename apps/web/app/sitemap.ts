import { supabase } from "@/lib/supabase";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://drishtinepal.com";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/ministers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/scores`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/manifesto`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/decisions`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${base}/methodology`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Dynamic minister pages
  const { data: ministers } = await supabase
    .from("ministers")
    .select("id")
    .eq("status", "active");

  const ministerRoutes: MetadataRoute.Sitemap = (ministers ?? []).map((m) => ({
    url: `${base}/ministers/${m.id}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Dynamic manifesto item pages
  const { data: items } = await supabase
    .from("manifesto_items")
    .select("source_id");

  const manifestoRoutes: MetadataRoute.Sitemap = (items ?? []).map((item) => ({
    url: `${base}/manifesto/${item.source_id}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Dynamic article pages
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at")
    .eq("published", true);

  const articleRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${base}/articles/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...ministerRoutes,
    ...manifestoRoutes,
    ...articleRoutes,
  ];
}
