"use client";

import { LogoutButton } from "@/components/LogoutButton";
import { ModerationActions } from "@/components/ModerationActions";
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

interface ReviewItem {
  id: string;
  content_type: string;
  content_id: string;
  priority: string;
  status: string;
  title: string;
  summary: string | null;
  ai_confidence: number | null;
  flagged_reason: string | null;
  assigned_to: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface ManifestoItem {
  id: string;
  source_id: string;
  title_en: string;
}

interface Indicator {
  id: string;
  indicator_name: string;
  indicator_label: string;
  category: string;
  unit: string;
  direction: string;
  baseline_value: number | null;
  target_value: number | null;
  current_value: number | null;
  measured_date: string | null;
  source: string;
  source_url: string | null;
  indicator_type: "result" | "process";
  process_status: string | null;
  parent_indicator_id: string | null;
  source_id: string | null;
}

interface Props {
  draftPosts: Post[];
  reviewPosts: Post[];
  recentPublished: Post[];
  pendingQueue: ReviewItem[];
  recentReviewed: ReviewItem[];
  manifestoItems: ManifestoItem[];
  indicators: Indicator[];
  username: string;
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AdminDashboard({
  draftPosts,
  reviewPosts,
  recentPublished,
  pendingQueue,
  recentReviewed,
  manifestoItems,
  indicators,
  username,
}: Props) {
  const [tab, setTab] = useState<
    "news" | "drafts" | "queue" | "published" | "decisions" | "indicators"
  >("news");

  const publishedToday = recentPublished.filter(
    (p) =>
      p.published_at &&
      new Date(p.published_at).toDateString() === new Date().toDateString(),
  ).length;

  const tabs = [
    { id: "news" as const, label: "News Review", count: reviewPosts.length },
    {
      id: "drafts" as const,
      label: "Analysis Drafts",
      count: draftPosts.length,
    },
    {
      id: "queue" as const,
      label: "Review Queue",
      count: pendingQueue.length,
    },
    {
      id: "published" as const,
      label: "Recently Published",
      count: recentPublished.length,
    },
    { id: "decisions" as const, label: "Add Decision", count: 0 },
    {
      id: "indicators" as const,
      label: "Indicators",
      count: indicators.length,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Drishti Admin</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Signed in as{" "}
            <span className="font-semibold text-neutral-700">{username}</span>
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="News Pending"
          value={reviewPosts.length}
          color="blue"
        />
        <StatCard
          label="Analysis Drafts"
          value={draftPosts.length}
          color="amber"
        />
        <StatCard
          label="Review Queue"
          value={pendingQueue.length}
          color="violet"
        />
        <StatCard
          label="Published Today"
          value={publishedToday}
          color="emerald"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
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
      {tab === "news" && <PostQueue posts={reviewPosts} editable />}
      {tab === "drafts" && <PostQueue posts={draftPosts} editable />}
      {tab === "queue" && (
        <ReviewQueue
          pending={pendingQueue}
          recent={recentReviewed}
          username={username}
        />
      )}
      {tab === "published" && <PublishedList posts={recentPublished} />}
      {tab === "decisions" && (
        <AddDecisionForm manifestoItems={manifestoItems} />
      )}
      {tab === "indicators" && (
        <IndicatorsPanel indicators={indicators} username={username} />
      )}
    </div>
  );
}

// ── Post Queue ───────────────────────────────────────────────────────────────

function PostQueue({ posts, editable }: { posts: Post[]; editable: boolean }) {
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [editContent, setEditContent] = useState(post.content_en);
  const [editTitle, setEditTitle] = useState(post.title_en);

  const categoryColors: Record<string, string> = {
    analysis: "bg-purple-50 text-purple-700 border-purple-200",
    news_update: "bg-blue-50 text-blue-700 border-blue-200",
    cabinet_decision: "bg-amber-50 text-amber-700 border-amber-200",
  };

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, action }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setActionError(body.error ?? `Failed to ${action} (${res.status})`);
      }
    } catch {
      setActionError("Network error — please try again");
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

      {/* Inline error message */}
      {actionError && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-2 text-xs text-red-600">
          {actionError}
        </div>
      )}

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

// ── Add Decision Form ─────────────────────────────────────────────────────────

function AddDecisionForm({
  manifestoItems,
}: {
  manifestoItems: ManifestoItem[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title_en: "",
    title_np: "",
    decision_date: new Date().toISOString().slice(0, 10),
    summary_en: "",
    source_url: "https://opmcm.gov.np/category/cabinet-decision/",
    significance: "medium",
    selected_bp_ids: [] as string[],
  });

  function toggleBpItem(id: string) {
    setForm((f) => ({
      ...f,
      selected_bp_ids: f.selected_bp_ids.includes(id)
        ? f.selected_bp_ids.filter((x) => x !== id)
        : [...f.selected_bp_ids, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_en.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to save");
        return;
      }
      setSuccess(true);
      setForm({
        title_en: "",
        title_np: "",
        decision_date: new Date().toISOString().slice(0, 10),
        summary_en: "",
        source_url: "https://opmcm.gov.np/category/cabinet-decision/",
        significance: "medium",
        selected_bp_ids: [],
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-xl border border-neutral-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          <strong>Manually add a cabinet decision</strong> from{" "}
          <a
            href="https://opmcm.gov.np/category/cabinet-decision/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            opmcm.gov.np
          </a>{" "}
          or{" "}
          <a
            href="https://hr.parliament.gov.np/np/parliamentary-notices"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            parliament notices
          </a>
          . The automated agents pick up PDFs daily — use this for decisions
          missed by the scraper or for urgent additions.
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Decision saved and linked to manifesto items ✓
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
              Title (English) <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.title_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_en: e.target.value }))
              }
              placeholder="e.g. Approve Budget Allocation for Road Construction"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
              Title (Nepali)
            </label>
            <input
              value={form.title_np}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_np: e.target.value }))
              }
              placeholder="मन्त्रिपरिषद् निर्णय शीर्षक"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
              Decision Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.decision_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, decision_date: e.target.value }))
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
              Significance
            </label>
            <select
              value={form.significance}
              onChange={(e) =>
                setForm((f) => ({ ...f, significance: e.target.value }))
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
              Summary (English)
            </label>
            <textarea
              value={form.summary_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, summary_en: e.target.value }))
              }
              rows={3}
              placeholder="Brief description of what was decided and its expected impact..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
              Source URL
            </label>
            <input
              type="url"
              value={form.source_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, source_url: e.target.value }))
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Manifesto item picker */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-neutral-500">
            Linked Manifesto Items{" "}
            <span className="font-normal text-neutral-400">
              ({form.selected_bp_ids.length} selected)
            </span>
          </label>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {manifestoItems.map((item) => {
                const checked = form.selected_bp_ids.includes(item.source_id);
                return (
                  <label
                    key={item.source_id}
                    className={`flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-1.5 text-xs transition ${
                      checked
                        ? "bg-purple-50 text-purple-800"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0 accent-purple-600"
                      checked={checked}
                      onChange={() => toggleBpItem(item.source_id)}
                    />
                    <span>
                      <span className="font-mono font-semibold">
                        {item.source_id}
                      </span>{" "}
                      — {item.title_en}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.title_en.trim()}
          className="w-full rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Cabinet Decision"}
        </button>
      </form>
    </div>
  );
}

// ── Review Queue ─────────────────────────────────────────────────────────────

function ReviewQueue({
  pending,
  recent,
  username,
}: {
  pending: ReviewItem[];
  recent: ReviewItem[];
  username: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-4 text-lg font-bold text-neutral-800">
          Pending Review
        </h2>
        {pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((item) => (
              <QueueCard key={item.id} item={item} username={username} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-10 text-center text-neutral-400">
            No items pending review. All caught up!
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-neutral-800">
          Recently Reviewed
        </h2>
        {recent.length > 0 ? (
          <div className="space-y-3">
            {recent.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-neutral-700 line-clamp-2">
                  {item.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                  <QueueStatusChip status={item.status} />
                  {item.reviewed_at && (
                    <>
                      <span>·</span>
                      <span>
                        {new Date(item.reviewed_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </>
                  )}
                </div>
                {item.review_notes && (
                  <p className="mt-1.5 text-xs text-neutral-500 italic">
                    {item.review_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-400">
            No reviews yet
          </div>
        )}
      </div>
    </div>
  );
}

function QueueCard({ item, username }: { item: ReviewItem; username: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <PriorityBadge priority={item.priority} />
            <ContentTypeChip type={item.content_type} />
          </div>
          <h3 className="font-medium text-neutral-800 line-clamp-2">
            {item.title}
          </h3>
          {item.summary && (
            <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
              {item.summary}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
            <span>
              {new Date(item.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {item.ai_confidence !== null && (
              <>
                <span>·</span>
                <span>
                  AI:{" "}
                  <span className="font-medium text-neutral-600">
                    {(item.ai_confidence * 100).toFixed(0)}%
                  </span>
                </span>
              </>
            )}
          </div>
          {item.flagged_reason && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-600">
              Flag: {item.flagged_reason}
            </p>
          )}
        </div>
        <QueueStatusChip status={item.status} />
      </div>
      <ModerationActions
        reviewItemId={item.id}
        contentType={item.content_type}
        contentId={item.content_id}
        reviewer={username}
      />
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-amber-100 text-amber-700",
    normal: "bg-neutral-100 text-neutral-600",
    low: "bg-neutral-50 text-neutral-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${styles[priority] ?? styles.normal}`}
    >
      {priority}
    </span>
  );
}

function ContentTypeChip({ type }: { type: string }) {
  const labels: Record<string, string> = {
    gazette_entry: "Gazette",
    parliament_record: "Parliament",
    evidence_assessment: "Evidence",
    action: "Action",
    post: "Post",
    manifesto_edit: "Manifesto Edit",
    public_submission: "Submission",
    score_update: "Score",
  };
  return (
    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
      {labels[type] ?? type}
    </span>
  );
}

function QueueStatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    in_review: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    needs_revision: "bg-orange-100 text-orange-700",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    in_review: "In Review",
    approved: "Approved",
    rejected: "Rejected",
    needs_revision: "Needs Revision",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] ?? "bg-neutral-100 text-neutral-600"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ── Indicators Panel ─────────────────────────────────────────────────────────

function IndicatorsPanel({
  indicators,
  username,
}: {
  indicators: Indicator[];
  username: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    value: "",
    measured_date: new Date().toISOString().slice(0, 10),
    source_url: "",
    source_text: "",
  });
  const [processForm, setProcessForm] = useState({ status: "not_started" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "result" | "process">(
    "all",
  );

  const categories = [...new Set(indicators.map((i) => i.category))].sort();
  const filtered = indicators.filter((i) => {
    if (filterCat !== "all" && i.category !== filterCat) return false;
    if (filterType !== "all" && i.indicator_type !== filterType) return false;
    return true;
  });

  function startEdit(ind: Indicator) {
    setEditingId(ind.id);
    if (ind.indicator_type === "process") {
      setProcessForm({ status: ind.process_status ?? "not_started" });
    } else {
      setForm({
        value: ind.current_value?.toString() ?? "",
        measured_date: new Date().toISOString().slice(0, 10),
        source_url: "",
        source_text: "",
      });
    }
    setError(null);
  }

  async function handleSave(ind: Indicator) {
    setSaving(true);
    setError(null);
    try {
      if (ind.indicator_type === "process") {
        const res = await fetch("/api/admin/indicators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            indicator_id: ind.id,
            action: "update_process_status",
            process_status: processForm.status,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to save");
          return;
        }
      } else {
        const res = await fetch("/api/admin/indicators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ indicator_id: ind.id, ...form }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to save");
          return;
        }
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (indicators.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-12 text-center text-neutral-400">
        No indicators seeded yet. Run the seed_bp_indicators script first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type filter */}
        {(["all", "result", "process"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${filterType === t ? "bg-blue-700 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
          >
            {t === "all" ? "All Types" : t}
          </button>
        ))}
        <span className="mx-1 text-neutral-300">|</span>
        <button
          onClick={() => setFilterCat("all")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${filterCat === "all" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
        >
          All (
          {
            indicators.filter(
              (i) => filterType === "all" || i.indicator_type === filterType,
            ).length
          }
          )
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${filterCat === cat ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
          >
            {cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Indicators table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-medium text-neutral-500">
            <tr>
              <th className="px-4 py-3">Indicator</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Baseline</th>
              <th className="px-4 py-3 text-right">Target</th>
              <th className="px-4 py-3 text-right">Current / Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map((ind) => (
              <tr key={ind.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-800">
                    {ind.indicator_label}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {ind.indicator_name}
                    {ind.unit ? ` (${ind.unit})` : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ind.indicator_type === "result" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {ind.indicator_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {ind.indicator_type === "result"
                    ? (ind.baseline_value ?? "–")
                    : "–"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {ind.indicator_type === "result"
                    ? (ind.target_value ?? "–")
                    : "–"}
                </td>
                <td className="px-4 py-3 text-right text-xs font-semibold">
                  {ind.indicator_type === "process" ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        ind.process_status === "resolved"
                          ? "bg-emerald-100 text-emerald-700"
                          : ind.process_status === "ongoing"
                            ? "bg-blue-100 text-blue-700"
                            : ind.process_status === "blocked"
                              ? "bg-red-100 text-red-700"
                              : ind.process_status === "reversed"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {ind.process_status ?? "not_started"}
                    </span>
                  ) : (
                    <span className="font-mono">
                      {ind.current_value ?? "–"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === ind.id ? (
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(ind)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Update
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit form */}
      {editingId &&
        (() => {
          const ind = indicators.find((i) => i.id === editingId);
          if (!ind) return null;

          return (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-blue-800">
                Update: {ind.indicator_label}
              </h3>
              {error && (
                <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}
              {ind.indicator_type === "process" ? (
                <div className="flex items-end gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-blue-700">
                      Status
                    </span>
                    <select
                      value={processForm.status}
                      onChange={(e) =>
                        setProcessForm({ status: e.target.value })
                      }
                      className="mt-1 block rounded-md border border-blue-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="resolved">Resolved</option>
                      <option value="blocked">Blocked</option>
                      <option value="reversed">Reversed</option>
                    </select>
                  </label>
                  <button
                    disabled={saving}
                    onClick={() => handleSave(ind)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="text-xs font-medium text-blue-700">
                        New Value *
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={form.value}
                        onChange={(e) =>
                          setForm({ ...form, value: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-blue-700">
                        Date *
                      </span>
                      <input
                        type="date"
                        value={form.measured_date}
                        onChange={(e) =>
                          setForm({ ...form, measured_date: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-blue-700">
                        Source URL *
                      </span>
                      <input
                        type="url"
                        value={form.source_url}
                        placeholder="https://..."
                        onChange={(e) =>
                          setForm({ ...form, source_url: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-blue-700">
                        Source Text *
                      </span>
                      <input
                        type="text"
                        value={form.source_text}
                        placeholder="e.g. NRB Report"
                        onChange={(e) =>
                          setForm({ ...form, source_text: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <div className="mt-3">
                    <button
                      disabled={saving}
                      onClick={() => handleSave(ind)}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save Measurement"}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })()}
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
  color: "amber" | "blue" | "emerald" | "violet";
}) {
  const bgMap = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${bgMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-75">{label}</p>
    </div>
  );
}
