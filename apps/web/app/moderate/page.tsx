import { LogoutButton } from "@/components/LogoutButton";
import { ModerationActions } from "@/components/ModerationActions";
import { supabase } from "@/lib/supabase";
import { headers } from "next/headers";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moderator Dashboard — Drishti Nepal",
  description:
    "Review queue for gazette entries, parliament records, evidence assessments, and flagged content.",
};

type ReviewItem = {
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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeQuery<T = any>(
  fn: () => PromiseLike<{ data: T | null; count?: number | null; error: any }>,
): Promise<{ data: T | null; count: number }> {
  try {
    const res = await fn();
    if (res.error) return { data: null, count: 0 };
    return { data: res.data, count: res.count ?? 0 };
  } catch {
    return { data: null, count: 0 };
  }
}

export default async function ModeratePage() {
  const hdrs = await headers();
  const reviewer = hdrs.get("x-admin-user") ?? "moderator";

  const [
    { data: pending },
    { data: recent },
    { count: todayApproved },
    { count: gazetteCount },
    { count: parliamentCount },
    { count: evidenceCount },
    { count: submissionCount },
  ] = await Promise.all([
    safeQuery(() =>
      supabase
        .from("content_review_queue")
        .select("*")
        .in("status", ["pending", "in_review"])
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(50),
    ),
    safeQuery(() =>
      supabase
        .from("content_review_queue")
        .select("*")
        .in("status", ["approved", "rejected", "needs_revision"])
        .order("reviewed_at", { ascending: false })
        .limit(20),
    ),
    safeQuery(() =>
      supabase
        .from("content_review_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("reviewed_at", new Date(Date.now() - 86400000).toISOString()),
    ),
    safeQuery(() =>
      supabase
        .from("gazette_entries")
        .select("*", { count: "exact", head: true })
        .eq("review_status", "needs_review"),
    ),
    safeQuery(() =>
      supabase
        .from("parliament_records")
        .select("*", { count: "exact", head: true })
        .eq("review_status", "needs_review"),
    ),
    safeQuery(() =>
      supabase
        .from("initiative_evidence")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft"),
    ),
    safeQuery(() =>
      supabase
        .from("public_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
  ]);

  // Derive counts from already-fetched data instead of extra queries
  const pendingItems = pending as ReviewItem[] | null;
  const pendingCount =
    pendingItems?.filter((i) => i.status === "pending").length ?? 0;
  const reviewCount =
    pendingItems?.filter((i) => i.status === "in_review").length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">
            Moderator Dashboard
          </h1>
          <p className="mt-2 text-neutral-500">
            Review AI-generated content, approve evidence assessments, and
            manage flagged items.
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Signed in as{" "}
            <span className="font-medium text-neutral-600">{reviewer}</span>
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Pending Review" value={pendingCount} color="amber" />
        <StatCard label="In Review" value={reviewCount} color="blue" />
        <StatCard
          label="Approved Today"
          value={todayApproved ?? 0}
          color="emerald"
        />
        <StatCard
          label="Public Submissions"
          value={submissionCount}
          color="violet"
        />
      </div>

      {/* Content Type Breakdown */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SourceCard type="Gazette Entries" icon="📜" count={gazetteCount} />
        <SourceCard
          type="Parliament Records"
          icon="🏛"
          count={parliamentCount}
        />
        <SourceCard
          type="Evidence Assessments"
          icon="🔬"
          count={evidenceCount}
        />
        <SourceCard
          type="Public Submissions"
          icon="📩"
          count={submissionCount}
        />
      </div>

      {/* Two-column layout: Queue + Recent */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Review Queue */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-neutral-800">
            Review Queue
          </h2>
          {pending && pending.length > 0 ? (
            <div className="space-y-3">
              {(pending as ReviewItem[]).map((item) => (
                <ReviewCard key={item.id} item={item} reviewer={reviewer} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-400">
              No items pending review. All caught up!
            </div>
          )}
        </div>

        {/* Recently Reviewed */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-neutral-800">
            Recently Reviewed
          </h2>
          {recent && recent.length > 0 ? (
            <div className="space-y-3">
              {(recent as ReviewItem[]).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-700 line-clamp-2">
                        {item.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                        <ContentTypeChip type={item.content_type} />
                        <span>·</span>
                        <StatusChip status={item.status} />
                      </div>
                    </div>
                  </div>
                  {item.review_notes && (
                    <p className="mt-2 text-xs text-neutral-500 italic">
                      {item.review_notes}
                    </p>
                  )}
                  {item.reviewed_at && (
                    <p className="mt-1 text-xs text-neutral-300">
                      {new Date(item.reviewed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
    </div>
  );
}

/* ─── Components ─── */

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

function SourceCard({
  type,
  icon,
  count,
}: {
  type: string;
  icon: string;
  count: number;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <span className="text-2xl">{icon}</span>
      <p className="mt-2 text-sm font-semibold text-neutral-700">{type}</p>
      <p className="text-xs text-neutral-400">{count} pending</p>
    </div>
  );
}

function ReviewCard({
  item,
  reviewer,
}: {
  item: ReviewItem;
  reviewer: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={item.priority} />
            <ContentTypeChip type={item.content_type} />
          </div>
          <h3 className="mt-2 font-medium text-neutral-800 line-clamp-2">
            {item.title}
          </h3>
          {item.summary && (
            <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
              {item.summary}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400">
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
                  AI Confidence:{" "}
                  <span className="font-medium text-neutral-600">
                    {(item.ai_confidence * 100).toFixed(0)}%
                  </span>
                </span>
              </>
            )}
            {item.assigned_to && (
              <>
                <span>·</span>
                <span>Assigned: {item.assigned_to}</span>
              </>
            )}
          </div>
          {item.flagged_reason && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-600">
              Flag: {item.flagged_reason}
            </p>
          )}
        </div>
        <StatusChip status={item.status} />
      </div>
      <ModerationActions
        reviewItemId={item.id}
        contentType={item.content_type}
        contentId={item.content_id}
        reviewer={reviewer}
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

function StatusChip({ status }: { status: string }) {
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
    needs_revision: "Revision Needed",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-neutral-100 text-neutral-500"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
