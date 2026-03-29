"use client";

import Link from "next/link";
import { useState } from "react";

interface ManifestoItemProps {
  item: {
    id: string;
    source_id: string;
    title_en: string | null;
    title_np: string | null;
    description_en?: string | null;
    description_np?: string | null;
    item_text_en: string;
    item_text_np: string;
    key_commitments?: string[] | null;
    target_metrics?: Record<string, string> | null;
    priority?: string | null;
    status: string;
    category: string;
    minister_manifesto_assignments?: {
      minister_id: string;
      ministers?: { name_en: string; name_np?: string } | null;
    }[];
  };
}

const STATUS_MAP: Record<string, { bg: string; label: string }> = {
  completed: { bg: "bg-emerald-100 text-emerald-700", label: "Completed" },
  in_progress: { bg: "bg-blue-100 text-blue-700", label: "In Progress" },
  partially_fulfilled: {
    bg: "bg-amber-100 text-amber-700",
    label: "Partial",
  },
  fulfilled: { bg: "bg-emerald-100 text-emerald-700", label: "Fulfilled" },
  broken: { bg: "bg-red-100 text-red-700", label: "Broken" },
  not_started: {
    bg: "bg-neutral-100 text-neutral-500",
    label: "Not Started",
  },
  contradicted: { bg: "bg-red-100 text-red-700", label: "Contradicted" },
};

const PRIORITY_MAP: Record<string, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500", label: "Critical" },
  high: { dot: "bg-orange-400", label: "High" },
  medium: { dot: "bg-yellow-400", label: "Medium" },
  low: { dot: "bg-neutral-300", label: "Low" },
};

export function ManifestoItemRow({ item }: ManifestoItemProps) {
  const [open, setOpen] = useState(false);

  const s = STATUS_MAP[item.status] ?? STATUS_MAP.not_started;
  const p = item.priority ? PRIORITY_MAP[item.priority] : null;
  const keyCommitments: string[] = Array.isArray(item.key_commitments)
    ? item.key_commitments
    : [];
  const targetMetrics = item.target_metrics ?? {};
  const metricEntries = Object.entries(targetMetrics);
  const slug = item.source_id ?? item.id;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-sm">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full cursor-pointer text-left"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-3 p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {p && (
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                  {p.label}
                </span>
              )}
              <h3 className="font-semibold text-neutral-800">
                {item.title_en ?? item.item_text_en.slice(0, 80)}
              </h3>
            </div>
            {item.title_np && (
              <p className="mt-0.5 text-sm text-neutral-400 font-nepali">
                {item.title_np}
              </p>
            )}
            {/* Ministers */}
            {(item.minister_manifesto_assignments?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.minister_manifesto_assignments!.map((a) => (
                  <a
                    key={a.minister_id}
                    href={`/ministers/${a.minister_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full bg-[#1e3a5f]/5 px-2.5 py-0.5 text-xs font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                  >
                    {a.ministers?.name_en}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg}`}
            >
              {s.label}
            </span>
            <span
              className={`text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-neutral-100 px-5 pb-5 pt-4">
          {/* Excerpt / description */}
          {(item.description_en || item.item_text_en) && (
            <p className="mb-4 text-sm leading-relaxed text-neutral-600">
              {item.description_en ?? item.item_text_en.slice(0, 300)}
            </p>
          )}

          {/* Key commitments */}
          {keyCommitments.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Key Commitments
              </h4>
              <ul className="space-y-1.5">
                {keyCommitments.slice(0, 5).map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm text-neutral-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e3a5f]/40" />
                    {c}
                  </li>
                ))}
                {keyCommitments.length > 5 && (
                  <li className="text-xs text-neutral-400">
                    +{keyCommitments.length - 5} more — see full details
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Target metrics */}
          {metricEntries.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Target Metrics
              </h4>
              <div className="flex flex-wrap gap-2">
                {metricEntries.map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded-md bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 ring-1 ring-neutral-200"
                  >
                    <span className="font-medium">{k}:</span> {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <Link
              href={`/manifesto/${slug}`}
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1e3a5f]/90"
            >
              Full Details →
            </Link>
            <Link
              href={`/manifesto/${slug}#propose-edit`}
              className="text-sm text-neutral-400 underline underline-offset-2 hover:text-[#1e3a5f]"
            >
              Propose a correction
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
