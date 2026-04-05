"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  reviewItemId: string;
  contentType: string;
  reviewer: string;
}

export function ModerationActions({
  reviewItemId,
  contentType,
  reviewer,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [done, setDone] = useState<
    "approved" | "rejected" | "needs_revision" | null
  >(null);

  if (done) {
    const styles = {
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
      needs_revision: "bg-orange-50 text-orange-700 border-orange-200",
    };
    const labels = {
      approved: "Approved ✓",
      rejected: "Rejected ✗",
      needs_revision: "Revision Requested ↩",
    };
    return (
      <div
        className={`mt-3 rounded-lg border px-3 py-1.5 text-xs font-semibold ${styles[done]}`}
      >
        {labels[done]}
      </div>
    );
  }

  async function act(action: "approve" | "reject" | "needs_revision") {
    setLoading(action);
    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_item_id: reviewItemId,
          action,
          reviewer,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        setDone(
          action === "approve"
            ? "approved"
            : action === "reject"
              ? "rejected"
              : "needs_revision",
        );
        router.refresh();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error ?? "Action failed"}`);
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional review note…"
          rows={2}
          className="mb-2 w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => act("approve")}
          disabled={loading !== null}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          onClick={() => act("needs_revision")}
          disabled={loading !== null}
          className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
        >
          {loading === "needs_revision" ? "Updating…" : "Needs Revision"}
        </button>
        <button
          onClick={() => act("reject")}
          disabled={loading !== null}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          {loading === "reject" ? "Rejecting…" : "Reject"}
        </button>
        <button
          onClick={() => setShowNotes((v) => !v)}
          className="ml-auto text-xs text-neutral-400 underline hover:text-neutral-600"
        >
          {showNotes ? "Hide notes" : "Add note"}
        </button>
      </div>
    </div>
  );
}
