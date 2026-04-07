"use client";

import {
  type OutcomeIndicator,
  calcProgress,
  formatValue,
} from "@/lib/manifesto-utils";
import Link from "next/link";
import { useState } from "react";
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
      ministers?: { id?: string; name_en: string } | null;
    }[];
  };
  indicators?: OutcomeIndicator[];
}

const PRIORITY_MAP: Record<string, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500", label: "Critical" },
  high: { dot: "bg-orange-400", label: "High" },
  medium: { dot: "bg-yellow-400", label: "Medium" },
  low: { dot: "bg-neutral-300", label: "Low" },
};

export function ManifestoItemRow({
  item,
  indicators = [],
}: ManifestoItemProps) {
  const [open, setOpen] = useState(false);

  const p = item.priority ? PRIORITY_MAP[item.priority] : null;
  const slug = item.source_id ?? item.id;
  const ministers = item.minister_manifesto_assignments ?? [];

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow duration-300 ease-in-out hover:shadow-md">
      {/* Header row — always visible */}
      <div
        onClick={() => setOpen((v) => !v)}
        className="w-full cursor-pointer"
        role="button"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            {/* Meta: ID pill · priority */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-500">
                {item.source_id}
              </span>
              {p && (
                <span className="flex items-center gap-1 text-xs font-medium text-neutral-500">
                  <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                  {p.label}
                </span>
              )}
            </div>
            {/* Title — navigates to detail page; row click toggles accordion */}
            <Link
              href={`/manifesto/${slug}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-1.5 block font-semibold text-neutral-800 transition hover:text-blue-700 hover:underline"
            >
              {item.title_en ?? item.item_text_en.slice(0, 100)}
            </Link>
            {/* Responsible ministers */}
            {ministers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ministers.map((a) => (
                  <Link
                    key={a.minister_id}
                    href={`/ministers/${a.ministers?.id ?? a.minister_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full bg-[#0EA5E9]/8 px-2.5 py-0.5 text-xs font-medium text-blue-700 transition hover:bg-[#0EA5E9]/15"
                  >
                    {a.ministers?.name_en}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3 pt-0.5">
            <StatusIndicator status={item.status} />
            {indicators.length > 0 && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {indicators.length} indicator
                {indicators.length !== 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              className="rounded p-0.5 text-neutral-400 transition hover:text-neutral-600 focus:outline-none"
              aria-label={open ? "Collapse" : "Expand"}
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
                className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 p-5">
          {/* ── Commitment text (only if it adds something beyond the title) ── */}
          {item.description_en &&
            item.description_en !== (item.title_en ?? "") && (
              <p className="mb-6 text-sm leading-relaxed text-neutral-600">
                {item.description_en}
              </p>
            )}

          {/* ── Outcome indicators ── */}
          {indicators.length > 0 ? (
            <div className="mb-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Outcome Indicators
              </h4>
              <div className="space-y-5">
                {indicators.map((ind) => {
                  const pct = calcProgress(ind);
                  return (
                    <div
                      key={ind.id}
                      className="rounded-lg border border-neutral-200 bg-white p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold capitalize text-neutral-800">
                          {(ind.indicator_label ?? ind.indicator_name).replace(
                            /_/g,
                            " ",
                          )}
                        </p>
                        {pct != null && (
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {Math.round(pct)}%
                          </span>
                        )}
                      </div>

                      {/* Three stat cards: Baseline · Achievement · Endline */}
                      <div className="mb-4 grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                            Baseline
                          </p>
                          <p className="mt-1.5 text-base font-extrabold text-neutral-700">
                            {formatValue(ind.baseline_value, ind.unit)}
                          </p>
                          <p className="mt-0.5 text-[8px] text-neutral-400">
                            Mar 2026
                          </p>
                        </div>
                        <div className="relative rounded-lg border-2 border-[#0EA5E9]/30 bg-[#0EA5E9]/5 p-3 text-center">
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-blue-700 px-2 py-0.5 text-[8px] font-bold text-white shadow">
                            NOW
                          </span>
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-700">
                            Achievement
                          </p>
                          <p className="mt-1.5 text-base font-extrabold text-blue-700">
                            {formatValue(
                              ind.current_value ?? ind.baseline_value,
                              ind.unit,
                            )}
                          </p>
                          <p className="mt-0.5 text-[8px] text-neutral-400">
                            {ind.measured_date
                              ? new Date(ind.measured_date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", year: "numeric" },
                                )
                              : "Mar 2026"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
                            Endline
                          </p>
                          <p className="mt-1.5 text-base font-extrabold text-emerald-700">
                            {formatValue(ind.target_value, ind.unit)}
                          </p>
                          <p className="mt-0.5 text-[8px] text-neutral-400">
                            {ind.target_deadline
                              ? new Date(
                                  ind.target_deadline,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Mar 2031"}
                          </p>
                        </div>
                      </div>

                      {ind.source && (
                        <p className="mt-1 text-[10px] text-neutral-400">
                          Source: {ind.source}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-lg border border-dashed border-neutral-200 p-3 text-center">
              <p className="text-xs text-neutral-400">
                No outcome indicators linked yet.{" "}
                <a
                  href="https://github.com"
                  className="underline underline-offset-2 hover:text-neutral-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Propose one on GitHub ↗
                </a>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 border-t border-neutral-200 pt-4">
            <Link
              href={`/manifesto/${slug}#propose-edit`}
              className="text-xs font-medium text-neutral-400 underline underline-offset-2 transition hover:text-neutral-700"
            >
              Propose correction
            </Link>
            <Link
              href={`/manifesto/${slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-opacity-90"
            >
              Full details
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
