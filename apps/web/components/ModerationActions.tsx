"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  reviewItemId: string;
  contentType: string;
  contentId: string;
  reviewer: string;
}

type D = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));

// ── Full-content renderers ────────────────────────────────────────────────────

function EvidenceContent({ data }: { data: D }) {
  const meta = (data.metadata ?? {}) as D;
  const mi = data.manifesto_item as D | null;
  const probability =
    typeof data.probability === "number" ? data.probability : null;
  return (
    <div className="space-y-3 text-sm">
      {mi ? (
        <div className="rounded-lg bg-blue-50 px-3 py-2">
          <span className="text-xs font-semibold text-blue-600">
            Manifesto Item
          </span>
          <p className="mt-0.5 font-medium text-blue-900">
            {str(mi.source_id)} — {str(mi.title_en)}
          </p>
          {mi.item_text_en ? (
            <p className="mt-1 text-xs text-blue-700">{str(mi.item_text_en)}</p>
          ) : null}
        </div>
      ) : null}

      <div>
        <span className="text-xs font-semibold text-neutral-500">
          AI Assessment
        </span>
        {data.assessment_en ? (
          <p className="mt-1 leading-relaxed text-neutral-700">
            {str(data.assessment_en)}
          </p>
        ) : (
          <p className="mt-1 text-neutral-400 italic">No assessment text</p>
        )}
      </div>

      {data.assessment_np ? (
        <div>
          <span className="text-xs font-semibold text-neutral-500">
            Assessment (नेपाली)
          </span>
          <p className="mt-1 leading-relaxed text-neutral-700">
            {str(data.assessment_np)}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4 text-xs">
        <span>
          <span className="font-semibold text-neutral-500">Probability: </span>
          <span className="font-bold text-neutral-800">
            {probability !== null ? `${Math.round(probability * 100)}%` : "—"}
          </span>
        </span>
        {meta.confidence_level ? (
          <span>
            <span className="font-semibold text-neutral-500">Confidence: </span>
            <span className="capitalize text-neutral-700">
              {str(meta.confidence_level)}
            </span>
          </span>
        ) : null}
      </div>

      {Array.isArray(meta.key_risks) &&
      (meta.key_risks as unknown[]).length > 0 ? (
        <div>
          <span className="text-xs font-semibold text-neutral-500">
            Key Risks
          </span>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-neutral-600">
            {(meta.key_risks as unknown[]).map((r, i) => (
              <li key={i}>{str(r)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {Array.isArray(data.citations) &&
      (data.citations as unknown[]).length > 0 ? (
        <div>
          <span className="text-xs font-semibold text-neutral-500">
            Citations
          </span>
          <ul className="mt-1 space-y-0.5">
            {(data.citations as unknown[]).map((c, i) => (
              <li key={i}>
                <a
                  href={str(c)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline break-all hover:text-blue-700"
                >
                  {str(c)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function GazetteContent({ data }: { data: D }) {
  return (
    <div className="space-y-3 text-sm">
      {data.title_np ? (
        <div>
          <span className="text-xs font-semibold text-neutral-500">
            Title (नेपाली)
          </span>
          <p className="mt-1 text-neutral-700">{str(data.title_np)}</p>
        </div>
      ) : null}
      {data.summary_en ? (
        <div>
          <span className="text-xs font-semibold text-neutral-500">
            Summary
          </span>
          <p className="mt-1 leading-relaxed text-neutral-700">
            {str(data.summary_en)}
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
        {data.gazette_number ? (
          <span>
            <b>Issue:</b> {str(data.gazette_number)}
          </span>
        ) : null}
        {data.category ? (
          <span>
            <b>Category:</b> {str(data.category)}
          </span>
        ) : null}
        {data.significance ? (
          <span>
            <b>Significance:</b> {str(data.significance)}
          </span>
        ) : null}
        {data.published_date ? (
          <span>
            <b>Date:</b> {str(data.published_date)}
          </span>
        ) : null}
      </div>
      {data.source_url || data.pdf_url ? (
        <div className="flex gap-3">
          {data.source_url ? (
            <a
              href={str(data.source_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 underline hover:text-blue-700"
            >
              Source ↗
            </a>
          ) : null}
          {data.pdf_url ? (
            <a
              href={str(data.pdf_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 underline hover:text-blue-700"
            >
              PDF ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PostContent({ data }: { data: D }) {
  const [showFull, setShowFull] = useState(false);
  const content = data.content_en ? str(data.content_en) : "";
  const preview = content.slice(0, 600);
  return (
    <div className="space-y-3 text-sm">
      {data.excerpt_en ? (
        <p className="text-neutral-600 italic">{str(data.excerpt_en)}</p>
      ) : null}
      <div>
        <span className="text-xs font-semibold text-neutral-500">Content</span>
        <p className="mt-1 whitespace-pre-wrap leading-relaxed text-neutral-700">
          {showFull ? content : preview}
          {!showFull && content.length > 600 ? "…" : null}
        </p>
        {content.length > 600 ? (
          <button
            onClick={() => setShowFull((v) => !v)}
            className="mt-1 text-xs text-blue-600 underline hover:text-blue-700"
          >
            {showFull ? "Show less" : "Read full article"}
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
        {data.category ? (
          <span>
            <b>Category:</b> {str(data.category)}
          </span>
        ) : null}
        {data.ai_generated ? (
          <span className="text-amber-600 font-semibold">AI-generated</span>
        ) : null}
        {data.source_url ? (
          <a
            href={str(data.source_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-700"
          >
            Source ↗
          </a>
        ) : null}
      </div>
      {Array.isArray(data.tags) && (data.tags as unknown[]).length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {(data.tags as unknown[]).map((t, i) => (
            <span
              key={i}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500"
            >
              {str(t)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GenericContent({ data }: { data: D }) {
  return (
    <div className="space-y-1.5 text-xs text-neutral-600">
      {Object.entries(data)
        .filter(([k]) => !["id", "metadata"].includes(k))
        .map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="w-32 shrink-0 font-semibold capitalize text-neutral-500">
              {k.replace(/_/g, " ")}
            </span>
            <span className="break-all">
              {v == null
                ? "—"
                : typeof v === "object"
                  ? JSON.stringify(v)
                  : String(v)}
            </span>
          </div>
        ))}
    </div>
  );
}

function FullContent({ type, data }: { type: string; data: D }) {
  switch (type) {
    case "evidence_assessment":
      return <EvidenceContent data={data} />;
    case "gazette_entry":
      return <GazetteContent data={data} />;
    case "post":
      return <PostContent data={data} />;
    default:
      return <GenericContent data={data} />;
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ModerationActions({
  reviewItemId,
  contentType,
  contentId,
  reviewer,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [done, setDone] = useState<
    "approved" | "rejected" | "needs_revision" | null
  >(null);
  const [expanded, setExpanded] = useState(false);
  const [fullContent, setFullContent] = useState<D | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  async function toggleExpand() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (fullContent) return;
    setContentLoading(true);
    setContentError(null);
    try {
      const res = await fetch(
        `/api/moderate/content?type=${encodeURIComponent(contentType)}&id=${encodeURIComponent(contentId)}`,
      );
      if (res.ok) {
        const json = (await res.json()) as { data: D };
        setFullContent(json.data);
      } else {
        setContentError("Could not load content");
      }
    } catch {
      setContentError("Network error");
    } finally {
      setContentLoading(false);
    }
  }

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
        const data = (await res.json()) as D;
        alert(`Error: ${String(data.error ?? "Action failed")}`);
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      {/* Expand / collapse full content */}
      <button
        onClick={toggleExpand}
        className="mb-3 flex w-full items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {expanded ? "Hide content" : "Read full content before deciding"}
      </button>

      {expanded ? (
        <div className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          {contentLoading ? (
            <p className="text-xs text-neutral-400">Loading…</p>
          ) : null}
          {contentError ? (
            <p className="text-xs text-red-500">{contentError}</p>
          ) : null}
          {fullContent ? (
            <FullContent type={contentType} data={fullContent} />
          ) : null}
        </div>
      ) : null}

      {/* Notes textarea */}
      {showNotes ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional review note…"
          rows={2}
          className="mb-2 w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400"
        />
      ) : null}

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
