"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  slug: string;
  title_en: string;
  title_np: string;
  content_en: string;
  content_np: string;
  excerpt_en: string;
  category: string;
  ai_generated: boolean;
  status: string;
  source_url: string | null;
  tags: string[];
  created_at: string;
  published_at?: string | null;
}

interface Props {
  draftPosts: Post[];
  reviewPosts: Post[];
  recentPublished: Post[];
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AdminDashboard({
  draftPosts,
  reviewPosts,
  recentPublished,
}: Props) {
  const [tab, setTab] = useState<"drafts" | "review" | "published">("drafts");

  const tabs = [
    {
      id: "drafts" as const,
      label: "Analysis Drafts",
      count: draftPosts.length,
    },
    {
      id: "review" as const,
      label: "News Updates (Review)",
      count: reviewPosts.length,
    },
    {
      id: "published" as const,
      label: "Recently Published",
      count: recentPublished.length,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-neutral-500">
          Review AI-generated articles, approve for publishing, or edit before
          release.
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-3 gap-4 sm:grid-cols-3">
        <StatCard
          label="Analysis Drafts"
          value={draftPosts.length}
          color="amber"
        />
        <StatCard
          label="News Pending Review"
          value={reviewPosts.length}
          color="blue"
        />
        <StatCard
          label="Published Today"
          value={
            recentPublished.filter(
              (p) =>
                p.published_at &&
                new Date(p.published_at).toDateString() ===
                  new Date().toDateString(),
            ).length
          }
          color="emerald"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-neutral-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "bg-white text-neutral-800 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "drafts" && <PostQueue posts={draftPosts} editable />}
      {tab === "review" && <PostQueue posts={reviewPosts} editable={false} />}
      {tab === "published" && <PublishedList posts={recentPublished} />}
    </div>
  );
}

// ── Post Queue ───────────────────────────────────────────────────────────────

function PostQueue({
  posts,
  editable,
}: {
  posts: Post[];
  editable: boolean;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-12 text-center text-neutral-400">
        No items pending. All caught up!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} editable={editable} />
      ))}
    </div>
  );
}

function PostCard({ post, editable }: { post: Post; editable: boolean }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [editContent, setEditContent] = useState(post.content_en);
  const [editTitle, setEditTitle] = useState(post.title_en);

  const categoryColors: Record<string, string> = {
    analysis: "bg-purple-50 text-purple-700 border-purple-200",
    news_update: "bg-blue-50 text-blue-700 border-blue-200",
    cabinet_decision: "bg-amber-50 text-amber-700 border-amber-200",
  };

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, action }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleSave() {
    setLoading("save");
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          action: "update",
          title_en: editTitle,
          content_en: editContent,
        }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${categoryColors[post.category] ?? "bg-neutral-50 text-neutral-600 border-neutral-200"}`}
            >
              {post.category.replace("_", " ")}
            </span>
            {post.ai_generated && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                AI Generated
              </span>
            )}
            <span className="text-xs text-neutral-400">
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <h3 className="font-semibold text-neutral-800">{post.title_en}</h3>
          {post.title_np && (
            <p className="mt-1 text-sm text-neutral-500">{post.title_np}</p>
          )}
          {post.source_url && (
            <a
              href={post.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              Source article ↗
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
          >
            {expanded ? "Collapse" : "Preview"}
          </button>
          {editable && (
            <button
              onClick={() => {
                setEditing(true);
                setExpanded(true);
              }}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => handleAction("approve")}
            disabled={loading !== null}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading === "approve" ? "..." : "Approve"}
          </button>
          <button
            onClick={() => handleAction("reject")}
            disabled={loading !== null}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {loading === "reject" ? "..." : "Reject"}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 p-5">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-500">
                  Title (EN)
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-500">
                  Content (EN) — Markdown
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading !== null}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading === "save" ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-semibold text-neutral-400">
                  English
                </p>
                <div className="prose prose-sm max-w-none text-neutral-700">
                  {post.content_en
                    .split("\n")
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              </div>
              {post.content_np && (
                <div className="border-t border-neutral-200 pt-4">
                  <p className="mb-1 text-xs font-semibold text-neutral-400">
                    नेपाली
                  </p>
                  <div className="prose prose-sm max-w-none text-neutral-700">
                    {post.content_np
                      .split("\n")
                      .filter(Boolean)
                      .map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                  </div>
                </div>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-neutral-200 pt-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-medium text-neutral-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Published List ───────────────────────────────────────────────────────────

function PublishedList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-12 text-center text-neutral-400">
        No recently published articles.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div
          key={post.id}
          className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-neutral-800 line-clamp-1">
              {post.title_en}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
              <span className="capitalize">
                {post.category.replace("_", " ")}
              </span>
              {post.published_at && (
                <>
                  <span>·</span>
                  <span>
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
          <a
            href={`/articles/${post.slug}`}
            className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
          >
            View →
          </a>
        </div>
      ))}
    </div>
  );
}

// ── Shared Components ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "amber" | "blue" | "emerald";
}) {
  const bgMap = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${bgMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-75">{label}</p>
    </div>
  );
}
