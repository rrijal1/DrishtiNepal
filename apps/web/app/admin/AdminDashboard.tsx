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

interface Minister {
  id: string;
  name_en: string;
  ministry: string;
}

interface ScoreRow {
  id: string;
  minister_id: string;
  period_start: string;
  period_end: string;
  overall: number | null;
  outcome_score: number | null;
  manifesto_compliance: number | null;
  public_accountability: number | null;
  scored_at: string | null;
}

interface Props {
  draftPosts: Post[];
  reviewPosts: Post[];
  recentPublished: Post[];
  pendingQueue: ReviewItem[];
  recentReviewed: ReviewItem[];
  manifestoItems: ManifestoItem[];
  indicators: Indicator[];
  ministers: Minister[];
  allScores: ScoreRow[];
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
  ministers,
  allScores,
  username,
}: Props) {
  const [tab, setTab] = useState<
    "news" | "drafts" | "queue" | "published" | "decisions" | "indicators" | "scores"
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
    {
      id: "scores" as const,
      label: "Monthly Scores",
      count: allScores.length,
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
        <IndicatorsPanel
          indicators={indicators}
          manifestoItems={manifestoItems}
          ministers={ministers}
          username={username}
        />
      )}
      {tab === "scores" && (
        <MonthlyScoresPanel ministers={ministers} allScores={allScores} />
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
  manifestoItems,
  ministers,
  username: _username,
}: {
  indicators: Indicator[];
  manifestoItems: ManifestoItem[];
  ministers: Minister[];
  username: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"list" | "add_result" | "add_process">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ value: "", measured_date: new Date().toISOString().slice(0, 10), source_url: "", source_text: "" });
  const [processForm, setProcessForm] = useState({ status: "not_started" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "result" | "process">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [addResultForm, setAddResultForm] = useState({ indicator_name: "", indicator_label: "", category: "", priority_area: "", unit: "", direction: "higher_is_better", baseline_value: "", target_value: "", current_value: "", source: "", source_url: "", weight: "5", manifesto_item_id: "", minister_id: "", ministry: "" });
  const [addResultSaving, setAddResultSaving] = useState(false);
  const [addResultError, setAddResultError] = useState<string | null>(null);
  const [addResultSuccess, setAddResultSuccess] = useState(false);
  const [addProcessForm, setAddProcessForm] = useState({ indicator_label: "", process_status: "not_started", parent_indicator_id: "", manifesto_item_id: "", minister_id: "", ministry: "", category: "" });
  const [addProcessSaving, setAddProcessSaving] = useState(false);
  const [addProcessError, setAddProcessError] = useState<string | null>(null);
  const [addProcessSuccess, setAddProcessSuccess] = useState(false);

  const categories = [...new Set(indicators.map((i) => i.category))].sort();
  const resultIndicators = indicators.filter((i) => i.indicator_type === "result");
  const filtered = indicators.filter((i) => {
    if (filterCat !== "all" && i.category !== filterCat) return false;
    if (filterType !== "all" && i.indicator_type !== filterType) return false;
    return true;
  });

  function startEdit(ind: Indicator) {
    setEditingId(ind.id);
    if (ind.indicator_type === "process") setProcessForm({ status: ind.process_status ?? "not_started" });
    else setForm({ value: ind.current_value?.toString() ?? "", measured_date: new Date().toISOString().slice(0, 10), source_url: "", source_text: "" });
    setError(null);
  }

  async function handleSave(ind: Indicator) {
    setSaving(true); setError(null);
    try {
      if (ind.indicator_type === "process") {
        const res = await fetch("/api/admin/indicators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ indicator_id: ind.id, action: "update_process_status", process_status: processForm.status }) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to save"); return; }
      } else {
        const res = await fetch("/api/admin/indicators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ indicator_id: ind.id, ...form }) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to save"); return; }
      }
      setEditingId(null); router.refresh();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/indicators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", indicator_id: id }) });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Delete failed"); return; }
      setConfirmDelete(null); router.refresh();
    } catch { alert("Network error"); }
    finally { setDeletingId(null); }
  }

  async function handleAddResult(e: React.FormEvent) {
    e.preventDefault();
    setAddResultSaving(true); setAddResultError(null); setAddResultSuccess(false);
    try {
      const res = await fetch("/api/admin/indicators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_result", ...addResultForm }) });
      const data = await res.json();
      if (!res.ok) { setAddResultError(data.error || "Failed"); return; }
      setAddResultSuccess(true);
      setAddResultForm({ indicator_name: "", indicator_label: "", category: "", priority_area: "", unit: "", direction: "higher_is_better", baseline_value: "", target_value: "", current_value: "", source: "", source_url: "", weight: "5", manifesto_item_id: "", minister_id: "", ministry: "" });
      router.refresh();
    } catch { setAddResultError("Network error"); }
    finally { setAddResultSaving(false); }
  }

  async function handleAddProcess(e: React.FormEvent) {
    e.preventDefault();
    setAddProcessSaving(true); setAddProcessError(null); setAddProcessSuccess(false);
    try {
      const res = await fetch("/api/admin/indicators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_process", ...addProcessForm }) });
      const data = await res.json();
      if (!res.ok) { setAddProcessError(data.error || "Failed"); return; }
      setAddProcessSuccess(true);
      setAddProcessForm({ indicator_label: "", process_status: "not_started", parent_indicator_id: "", manifesto_item_id: "", minister_id: "", ministry: "", category: "" });
      router.refresh();
    } catch { setAddProcessError("Network error"); }
    finally { setAddProcessSaving(false); }
  }

  const inp = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["list", "add_result", "add_process"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${mode === m ? "bg-blue-700 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>
            {m === "list" ? `All Indicators (${indicators.length})` : m === "add_result" ? "+ Add Result" : "+ Add Process"}
          </button>
        ))}
      </div>

      {mode === "list" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "result", "process"] as const).map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${filterType === t ? "bg-blue-700 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>
                {t === "all" ? "All Types" : t}
              </button>
            ))}
            <span className="mx-1 text-neutral-300">|</span>
            <button onClick={() => setFilterCat("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${filterCat === "all" ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>
              All ({indicators.filter((i) => filterType === "all" || i.indicator_type === filterType).length})
            </button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${filterCat === cat ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>
                {cat.replace(/_/g, " ")}
              </button>
            ))}
          </div>

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
                      <div className="font-medium text-neutral-800">{ind.indicator_label}</div>
                      <div className="text-xs text-neutral-400">{ind.indicator_name}{ind.unit ? ` (${ind.unit})` : ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ind.indicator_type === "result" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {ind.indicator_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{ind.indicator_type === "result" ? (ind.baseline_value ?? "–") : "–"}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{ind.indicator_type === "result" ? (ind.target_value ?? "–") : "–"}</td>
                    <td className="px-4 py-3 text-right text-xs font-semibold">
                      {ind.indicator_type === "process" ? (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ind.process_status === "resolved" ? "bg-emerald-100 text-emerald-700" : ind.process_status === "ongoing" ? "bg-blue-100 text-blue-700" : ind.process_status === "blocked" ? "bg-red-100 text-red-700" : ind.process_status === "reversed" ? "bg-orange-100 text-orange-700" : "bg-neutral-100 text-neutral-500"}`}>
                          {ind.process_status ?? "not_started"}
                        </span>
                      ) : (
                        <span className="font-mono">{ind.current_value ?? "–"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {editingId === ind.id
                          ? <button onClick={() => setEditingId(null)} className="text-xs text-neutral-400 hover:text-neutral-600">Cancel</button>
                          : <button onClick={() => startEdit(ind)} className="text-xs font-medium text-blue-600 hover:text-blue-800">Update</button>}
                        {confirmDelete === ind.id ? (
                          <>
                            <button onClick={() => handleDelete(ind.id)} disabled={deletingId === ind.id} className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50">{deletingId === ind.id ? "..." : "Confirm"}</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-neutral-400 hover:text-neutral-600">✕</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(ind.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingId && (() => {
            const ind = indicators.find((i) => i.id === editingId);
            if (!ind) return null;
            return (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-blue-800">Update: {ind.indicator_label}</h3>
                {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
                {ind.indicator_type === "process" ? (
                  <div className="flex items-end gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-blue-700">Status</span>
                      <select value={processForm.status} onChange={(e) => setProcessForm({ status: e.target.value })} className="mt-1 block rounded-md border border-blue-200 bg-white px-3 py-2 text-sm">
                        <option value="not_started">Not Started</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="resolved">Resolved</option>
                        <option value="blocked">Blocked</option>
                        <option value="reversed">Reversed</option>
                      </select>
                    </label>
                    <button disabled={saving} onClick={() => handleSave(ind)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="block"><span className="text-xs font-medium text-blue-700">New Value *</span><input type="number" step="any" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="mt-1 block w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm" /></label>
                      <label className="block"><span className="text-xs font-medium text-blue-700">Date *</span><input type="date" value={form.measured_date} onChange={(e) => setForm({ ...form, measured_date: e.target.value })} className="mt-1 block w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm" /></label>
                      <label className="block"><span className="text-xs font-medium text-blue-700">Source URL *</span><input type="url" value={form.source_url} placeholder="https://..." onChange={(e) => setForm({ ...form, source_url: e.target.value })} className="mt-1 block w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm" /></label>
                      <label className="block"><span className="text-xs font-medium text-blue-700">Source Text *</span><input type="text" value={form.source_text} placeholder="e.g. NRB Report" onChange={(e) => setForm({ ...form, source_text: e.target.value })} className="mt-1 block w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm" /></label>
                    </div>
                    <div className="mt-3"><button disabled={saving} onClick={() => handleSave(ind)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save Measurement"}</button></div>
                  </>
                )}
              </div>
            );
          })()}
        </>
      )}

      {mode === "add_result" && (
        <form onSubmit={handleAddResult} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-800">Add Result Indicator</h2>
          {addResultSuccess && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">Indicator added ✓</div>}
          {addResultError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{addResultError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Indicator Name (internal) <span className="text-red-500">*</span></label><input required value={addResultForm.indicator_name} onChange={(e) => setAddResultForm((f) => ({ ...f, indicator_name: e.target.value }))} placeholder="e.g. gdp_growth_rate" className={inp} /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Display Label <span className="text-red-500">*</span></label><input required value={addResultForm.indicator_label} onChange={(e) => setAddResultForm((f) => ({ ...f, indicator_label: e.target.value }))} placeholder="e.g. GDP Growth Rate" className={inp} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Category <span className="text-red-500">*</span></label><input required value={addResultForm.category} onChange={(e) => setAddResultForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. economic_growth" className={inp} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Priority Area</label><select value={addResultForm.priority_area} onChange={(e) => setAddResultForm((f) => ({ ...f, priority_area: e.target.value }))} className={inp}><option value="">None</option>{["PP-001","PP-002","PP-003","PP-004","PP-005"].map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Unit</label><input value={addResultForm.unit} onChange={(e) => setAddResultForm((f) => ({ ...f, unit: e.target.value }))} placeholder="e.g. %, km, MW" className={inp} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Direction</label><select value={addResultForm.direction} onChange={(e) => setAddResultForm((f) => ({ ...f, direction: e.target.value }))} className={inp}><option value="higher_is_better">Higher is better</option><option value="lower_is_better">Lower is better</option></select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Baseline Value</label><input type="number" step="any" value={addResultForm.baseline_value} onChange={(e) => setAddResultForm((f) => ({ ...f, baseline_value: e.target.value }))} className={inp} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Target Value</label><input type="number" step="any" value={addResultForm.target_value} onChange={(e) => setAddResultForm((f) => ({ ...f, target_value: e.target.value }))} className={inp} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Current Value</label><input type="number" step="any" value={addResultForm.current_value} onChange={(e) => setAddResultForm((f) => ({ ...f, current_value: e.target.value }))} className={inp} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Weight (1–10)</label><input type="number" min="1" max="10" value={addResultForm.weight} onChange={(e) => setAddResultForm((f) => ({ ...f, weight: e.target.value }))} className={inp} /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Source <span className="text-red-500">*</span></label><input required value={addResultForm.source} onChange={(e) => setAddResultForm((f) => ({ ...f, source: e.target.value }))} placeholder="e.g. CBS Nepal" className={inp} /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Source URL</label><input type="url" value={addResultForm.source_url} onChange={(e) => setAddResultForm((f) => ({ ...f, source_url: e.target.value }))} placeholder="https://..." className={inp} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Manifesto Item</label><select value={addResultForm.manifesto_item_id} onChange={(e) => setAddResultForm((f) => ({ ...f, manifesto_item_id: e.target.value }))} className={inp}><option value="">None</option>{manifestoItems.map((m) => <option key={m.id} value={m.id}>{m.source_id} — {m.title_en}</option>)}</select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Minister</label><select value={addResultForm.minister_id} onChange={(e) => { const mn = ministers.find((mm) => mm.id === e.target.value); setAddResultForm((f) => ({ ...f, minister_id: e.target.value, ministry: mn?.ministry ?? f.ministry })); }} className={inp}><option value="">None</option>{ministers.map((mm) => <option key={mm.id} value={mm.id}>{mm.name_en} — {mm.ministry}</option>)}</select></div>
          </div>
          <button type="submit" disabled={addResultSaving} className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{addResultSaving ? "Adding…" : "Add Result Indicator"}</button>
        </form>
      )}

      {mode === "add_process" && (
        <form onSubmit={handleAddProcess} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-800">Add Process Indicator</h2>
          {addProcessSuccess && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">Process indicator added ✓</div>}
          {addProcessError && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{addProcessError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Label <span className="text-red-500">*</span></label><input required value={addProcessForm.indicator_label} onChange={(e) => setAddProcessForm((f) => ({ ...f, indicator_label: e.target.value }))} placeholder="e.g. Draft Agriculture Bill" className={inp} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Status</label><select value={addProcessForm.process_status} onChange={(e) => setAddProcessForm((f) => ({ ...f, process_status: e.target.value }))} className={inp}><option value="not_started">Not Started</option><option value="ongoing">Ongoing</option><option value="resolved">Resolved</option><option value="blocked">Blocked</option><option value="reversed">Reversed</option></select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Category</label><input value={addProcessForm.category} onChange={(e) => setAddProcessForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. legislation" className={inp} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Parent Result Indicator</label><select value={addProcessForm.parent_indicator_id} onChange={(e) => setAddProcessForm((f) => ({ ...f, parent_indicator_id: e.target.value }))} className={inp}><option value="">None</option>{resultIndicators.map((r) => <option key={r.id} value={r.id}>{r.indicator_label}</option>)}</select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Manifesto Item</label><select value={addProcessForm.manifesto_item_id} onChange={(e) => setAddProcessForm((f) => ({ ...f, manifesto_item_id: e.target.value }))} className={inp}><option value="">None</option>{manifestoItems.map((m) => <option key={m.id} value={m.id}>{m.source_id} — {m.title_en}</option>)}</select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-neutral-500">Minister</label><select value={addProcessForm.minister_id} onChange={(e) => { const mn = ministers.find((mm) => mm.id === e.target.value); setAddProcessForm((f) => ({ ...f, minister_id: e.target.value, ministry: mn?.ministry ?? f.ministry })); }} className={inp}><option value="">None</option>{ministers.map((mm) => <option key={mm.id} value={mm.id}>{mm.name_en} — {mm.ministry}</option>)}</select></div>
          </div>
          <button type="submit" disabled={addProcessSaving} className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">{addProcessSaving ? "Adding…" : "Add Process Indicator"}</button>
        </form>
      )}
    </div>
  );
}

// ── Monthly Scores Panel ─────────────────────────────────────────────────────

function MonthlyScoresPanel({ ministers, allScores }: { ministers: Minister[]; allScores: ScoreRow[]; }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ overall: "", outcome_score: "", manifesto_compliance: "", public_accountability: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ minister_id: "", period_start: new Date().toISOString().slice(0, 7) + "-01", period_end: "", overall: "", outcome_score: "", manifesto_compliance: "", public_accountability: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const ministerMap = new Map(ministers.map((m) => [m.id, m]));
  const byMinister = new Map<string, ScoreRow[]>();
  for (const s of allScores) {
    const arr = byMinister.get(s.minister_id) ?? [];
    arr.push(s);
    byMinister.set(s.minister_id, arr);
  }

  function startEdit(row: ScoreRow) {
    setEditingId(row.id);
    setEditForm({ overall: row.overall?.toString() ?? "", outcome_score: row.outcome_score?.toString() ?? "", manifesto_compliance: row.manifesto_compliance?.toString() ?? "", public_accountability: row.public_accountability?.toString() ?? "" });
    setError(null);
  }

  async function handleSave(row: ScoreRow) {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/admin/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ minister_id: row.minister_id, period_start: row.period_start, period_end: row.period_end, ...editForm }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setEditingId(null); router.refresh();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/scores", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score_id: id }) });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Delete failed"); return; }
      setConfirmDelete(null); router.refresh();
    } catch { alert("Network error"); }
    finally { setDeletingId(null); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true); setAddError(null);
    try {
      const res = await fetch("/api/admin/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || "Failed"); return; }
      setShowAdd(false);
      setAddForm({ minister_id: "", period_start: new Date().toISOString().slice(0, 7) + "-01", period_end: "", overall: "", outcome_score: "", manifesto_compliance: "", public_accountability: "" });
      router.refresh();
    } catch { setAddError("Network error"); }
    finally { setAddSaving(false); }
  }

  const inp = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400";
  const inpSm = "rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs w-20 text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-400";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-800">Monthly Score Snapshots</h2>
        <button onClick={() => setShowAdd((v) => !v)} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">{showAdd ? "Cancel" : "+ Add Snapshot"}</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-blue-800">New Score Snapshot</h3>
          {addError && <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{addError}</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="mb-1 block text-xs font-semibold text-blue-700">Minister <span className="text-red-500">*</span></label><select required value={addForm.minister_id} onChange={(e) => setAddForm((f) => ({ ...f, minister_id: e.target.value }))} className={inp}><option value="">Select…</option>{ministers.map((m) => <option key={m.id} value={m.id}>{m.name_en}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-semibold text-blue-700">Period Start <span className="text-red-500">*</span></label><input type="date" required value={addForm.period_start} onChange={(e) => { const d = new Date(e.target.value); const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10); setAddForm((f) => ({ ...f, period_start: e.target.value, period_end: end })); }} className={inp} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-blue-700">Period End <span className="text-red-500">*</span></label><input type="date" required value={addForm.period_end} onChange={(e) => setAddForm((f) => ({ ...f, period_end: e.target.value }))} className={inp} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-blue-700">Overall (0–100) <span className="text-red-500">*</span></label><input type="number" min="0" max="100" step="0.1" required value={addForm.overall} onChange={(e) => setAddForm((f) => ({ ...f, overall: e.target.value }))} className={inp} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-blue-700">Outcome Score</label><input type="number" min="0" max="100" step="0.1" value={addForm.outcome_score} onChange={(e) => setAddForm((f) => ({ ...f, outcome_score: e.target.value }))} className={inp} /></div>
            <div><label className="mb-1 block text-xs font-semibold text-blue-700">Manifesto Compliance</label><input type="number" min="0" max="100" step="0.1" value={addForm.manifesto_compliance} onChange={(e) => setAddForm((f) => ({ ...f, manifesto_compliance: e.target.value }))} className={inp} /></div>
          </div>
          <button type="submit" disabled={addSaving} className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{addSaving ? "Saving…" : "Save Snapshot"}</button>
        </form>
      )}

      {Array.from(byMinister.entries()).map(([ministerId, rows]) => {
        const min = ministerMap.get(ministerId);
        const sorted = [...rows].sort((a, b) => a.period_start.localeCompare(b.period_start));
        return (
          <div key={ministerId} className="overflow-hidden rounded-xl border border-neutral-200">
            <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200">
              <p className="text-sm font-semibold text-neutral-800">{min?.name_en ?? ministerId}</p>
              <p className="text-xs text-neutral-400">{min?.ministry}</p>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 font-medium">
                <tr>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2 text-right">Overall</th>
                  <th className="px-4 py-2 text-right">Outcome</th>
                  <th className="px-4 py-2 text-right">Manifesto</th>
                  <th className="px-4 py-2 text-right">Accountability</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sorted.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 font-mono text-neutral-600">{row.period_start} → {row.period_end}</td>
                    {editingId === row.id ? (
                      <>
                        <td className="px-2 py-1.5 text-right"><input type="number" min="0" max="100" step="0.1" value={editForm.overall} onChange={(e) => setEditForm((f) => ({ ...f, overall: e.target.value }))} className={inpSm} /></td>
                        <td className="px-2 py-1.5 text-right"><input type="number" min="0" max="100" step="0.1" value={editForm.outcome_score} onChange={(e) => setEditForm((f) => ({ ...f, outcome_score: e.target.value }))} className={inpSm} /></td>
                        <td className="px-2 py-1.5 text-right"><input type="number" min="0" max="100" step="0.1" value={editForm.manifesto_compliance} onChange={(e) => setEditForm((f) => ({ ...f, manifesto_compliance: e.target.value }))} className={inpSm} /></td>
                        <td className="px-2 py-1.5 text-right"><input type="number" min="0" max="100" step="0.1" value={editForm.public_accountability} onChange={(e) => setEditForm((f) => ({ ...f, public_accountability: e.target.value }))} className={inpSm} /></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 text-right font-mono font-bold text-neutral-800">{row.overall ?? "–"}</td>
                        <td className="px-4 py-2 text-right font-mono text-neutral-500">{row.outcome_score ?? "–"}</td>
                        <td className="px-4 py-2 text-right font-mono text-neutral-500">{row.manifesto_compliance ?? "–"}</td>
                        <td className="px-4 py-2 text-right font-mono text-neutral-500">{row.public_accountability ?? "–"}</td>
                      </>
                    )}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 justify-end">
                        {editingId === row.id ? (
                          <>
                            <button onClick={() => handleSave(row)} disabled={saving} className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50">{saving ? "…" : "Save"}</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-neutral-400 hover:text-neutral-600">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(row)} className="text-xs font-medium text-blue-600 hover:text-blue-800">Edit</button>
                        )}
                        {confirmDelete === row.id ? (
                          <>
                            <button onClick={() => handleDelete(row.id)} disabled={deletingId === row.id} className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50">{deletingId === row.id ? "…" : "Confirm"}</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-neutral-400 hover:text-neutral-600">✕</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(row.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        )}
                      </div>
                      {error && editingId === row.id && <p className="mt-1 text-xs text-red-500">{error}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {allScores.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-12 text-center text-neutral-400">No score snapshots yet. Add one above.</div>
      )}
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
