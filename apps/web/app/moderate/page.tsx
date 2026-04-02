import { supabase } from "@/lib/supabase";

export const revalidate = 60;

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

export default async function ModeratePage() {
  // Fetch review queue items grouped by status
  const { data: pending } = await supabase
    .from("content_review_queue")
    .select("*")
    .in("status", ["pending", "in_review"])
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(50);

  const { data: recent } = await supabase
    .from("content_review_queue")
    .select("*")
    .in("status", ["approved", "rejected", "needs_revision"])
    .order("reviewed_at", { ascending: false })
    .limit(20);

  // Fetch stats
  const { count: pendingCount } = await supabase
    .from("content_review_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: reviewCount } = await supabase
    .from("content_review_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_review");

  const { count: todayApproved } = await supabase
    .from("content_review_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .gte("reviewed_at", new Date(Date.now() - 86400000).toISOString());

  // Fetch counts by content type
  const { data: gazetteItems } = await supabase
    .from("gazette_entries")
    .select("id", { count: "exact", head: true })
    .eq("review_status", "needs_review");

  const { data: parliamentItems } = await supabase
    .from("parliament_records")
    .select("id", { count: "exact", head: true })
    .eq("review_status", "needs_review");

  const { data: evidenceItems } = await supabase
    .from("initiative_evidence")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft");

  const { data: submissions } = await supabase
    .from("public_submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          Moderator Dashboard
        </h1>
        <p className="mt-2 text-neutral-500">
          Review AI-generated content, approve evidence assessments, and manage
          flagged items.
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Pending Review"
          value={pendingCount ?? 0}
          color="amber"
        />
        <StatCard label="In Review" value={reviewCount ?? 0} color="blue" />
        <StatCard
          label="Approved Today"
          value={todayApproved ?? 0}
          color="emerald"
        />
        <StatCard label="Public Submissions" value={0} color="violet" />
      </div>

      {/* Content Type Breakdown */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SourceCard type="Gazette Entries" icon="📜" status="needs_review" />
        <SourceCard type="Parliament Records" icon="🏛" status="needs_review" />
        <SourceCard type="Evidence Assessments" icon="🔬" status="draft" />
        <SourceCard type="Public Submissions" icon="📩" status="pending" />
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
                <ReviewCard key={item.id} item={item} />
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
  status,
}: {
  type: string;
  icon: string;
  status: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <span className="text-2xl">{icon}</span>
      <p className="mt-2 text-sm font-semibold text-neutral-700">{type}</p>
      <p className="text-xs text-neutral-400">Status: {status}</p>
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
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
      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-neutral-100 text-neutral-500"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
