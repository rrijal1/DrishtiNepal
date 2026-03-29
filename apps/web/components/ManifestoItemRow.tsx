"use client";

import Link from "next/link";
import { useState } from "react";
import { Timeline } from "./Timeline";
import { StatusIndicator } from "./StatusIndicator";

interface ManifestoItemProps {
  item: {
    id: string;
    source_id: string;
    title_en: string | null;
    title_np: string | null;
    description_en?: string | null;
    item_text_en: string;
    key_commitments?: string[] | null;
    target_metrics?: Record<string, string> | null;
    priority?: string | null;
    status: string;
    category: string;
    start_date?: string | null;
    end_date?: string | null;
    minister_manifesto_assignments?: {
      minister_id: string;
      ministers?: { name_en: string } | null;
    }[];
  };
}

const PRIORITY_MAP: Record<string, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500", label: "Critical" },
  high: { dot: "bg-orange-400", label: "High" },
  medium: { dot: "bg-yellow-400", label: "Medium" },
  low: { dot: "bg-neutral-300", label: "Low" },
};

export function ManifestoItemRow({ item }: ManifestoItemProps) {
  const [open, setOpen] = useState(false);

  const p = item.priority ? PRIORITY_MAP[item.priority] : null;
  const slug = item.source_id ?? item.id;

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow duration-300 ease-in-out hover:shadow-md">
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full cursor-pointer text-left focus:outline-none"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {p && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                  <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                  {p.label} Priority
                </span>
              )}
              <span className="text-xs font-medium text-neutral-400">
                {item.category.replace(/_/g, " ")}
              </span>
            </div>
            <h3 className="mt-1.5 font-semibold text-neutral-800">
              {item.title_en ?? item.item_text_en.slice(0, 100)}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <StatusIndicator status={item.status} />
            <span
              className={`text-neutral-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 p-5">
          {/* Timeline */}
          <div className="mb-5">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Timeline
            </h4>
            <Timeline startDate={item.start_date} endDate={item.end_date} />
          </div>

          {/* Description */}
          {(item.description_en || item.item_text_en) && (
            <div className="mb-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Description
              </h4>
              <p className="text-sm leading-relaxed text-neutral-600">
                {item.description_en ?? item.item_text_en}
              </p>
            </div>
          )}

          {/* Key Commitments & Metrics */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Key Commitments
              </h4>
              {(item.key_commitments?.length ?? 0) > 0 ? (
                <ul className="space-y-2">
                  {item.key_commitments!.map((c, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-neutral-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-400 italic">Not specified.</p>
              )}
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Target Metrics
              </h4>
              {(Object.keys(item.target_metrics ?? {}).length) > 0 ? (
                 <ul className="space-y-2">
                  {Object.entries(item.target_metrics!).map(([k, v]) => (
                    <li key={k} className="flex gap-2.5 text-sm text-neutral-700">
                       <span className="font-semibold">{k}:</span> {String(v)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-400 italic">Not specified.</p>
              )}
            </div>
          </div>
          
          {/* Responsible Ministers */}
          {(item.minister_manifesto_assignments?.length ?? 0) > 0 && (
             <div className="mt-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Responsible Ministers
              </h4>
              <div className="flex flex-wrap gap-2">
                {item.minister_manifesto_assignments!.map((a) => (
                  <Link
                    key={a.minister_id}
                    href={`/ministers/${a.minister_id}`}
                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-200"
                  >
                    {a.ministers?.name_en}
                  </Link>
                ))}
              </div>
            </div>
          )}


          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-4 border-t border-neutral-200 pt-4">
            <Link
              href={`/manifesto/${slug}#propose-edit`}
              className="text-sm font-medium text-neutral-500 underline underline-offset-2 transition hover:text-neutral-800"
            >
              Propose a correction
            </Link>
             <Link
              href={`/manifesto/${slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-opacity-90"
            >
              View Full Details
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
