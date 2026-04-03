"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusIndicator } from "./StatusIndicator";

// Government formation date — used as the baseline reference
const GOVT_FORMATION = new Date("2026-03-27");

function MandateTimeline({
  startDate,
  endDate,
}: {
  startDate?: string | null;
  endDate?: string | null;
}) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const start = startDate ? new Date(startDate) : GOVT_FORMATION;
  const end = endDate ? new Date(endDate) : null;
  const now = new Date();

  const totalMs = end ? end.getTime() - start.getTime() : null;
  const elapsedMs = now.getTime() - start.getTime();
  const elapsedPct =
    totalMs && totalMs > 0
      ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)))
      : null;

  return (
    <div className="mb-6">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        Mandate Timeline
      </h4>
      <div className="relative">
        {/* Track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          {elapsedPct != null && (
            <div
              className="h-full rounded-full bg-[#1e3a5f]/30 transition-all"
              style={{ width: `${elapsedPct}%` }}
            />
          )}
        </div>
        {/* Today marker */}
        {elapsedPct != null && (
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${elapsedPct}%` }}
          >
            <div className="h-4 w-1 rounded-full bg-[#1e3a5f]" />
          </div>
        )}
      </div>
      {/* Date labels */}
      <div className="mt-2 flex items-start justify-between gap-2 text-[10px] text-neutral-400">
        <div>
          <span className="block font-medium text-neutral-600">
            {fmt(start)}
          </span>
          <span>Start{startDate ? "" : " (govt. formation)"}</span>
        </div>
        {elapsedPct != null && (
          <div className="text-center">
            <span className="block font-semibold text-[#1e3a5f]">
              {elapsedPct}% elapsed
            </span>
            <span>{fmt(now)} — Today</span>
          </div>
        )}
        {end && (
          <div className="text-right">
            <span className="block font-medium text-neutral-600">
              {fmt(end)}
            </span>
            <span>Target deadline</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface OutcomeIndicator {
  id: string;
  indicator_name: string;
  indicator_label?: string | null;
  unit: string | null;
  baseline_value: number | null;
  baseline_date: string | null;
  current_value: number | null;
  target_value: number | null;
  target_deadline: string | null;
  direction: string | null;
  source: string | null;
  measured_date: string | null;
}

function buildMonthlyData(
  ind: OutcomeIndicator,
): { label: string; value: number; isCurrent: boolean }[] {
  const start = new Date(ind.baseline_date ?? "2026-03-27");
  const now = new Date();
  const months: { label: string; value: number; isCurrent: boolean }[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cursor <= endMonth) {
    const isBaseline =
      cursor.getFullYear() === start.getFullYear() &&
      cursor.getMonth() === start.getMonth();
    const isCurrent =
      cursor.getFullYear() === now.getFullYear() &&
      cursor.getMonth() === now.getMonth();
    let value = 0;
    if (isBaseline) value = ind.baseline_value ?? 0;
    else if (isCurrent && ind.current_value != null) value = ind.current_value;
    months.push({
      label: cursor.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      value,
      isCurrent,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
}

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

function calcProgress(ind: OutcomeIndicator): number | null {
  if (
    ind.baseline_value == null ||
    ind.target_value == null ||
    ind.current_value == null
  )
    return null;
  const range = ind.target_value - ind.baseline_value;
  if (range === 0) return ind.current_value >= ind.target_value ? 100 : 0;
  if (ind.direction === "lower_is_better") {
    const prog =
      ((ind.baseline_value - ind.current_value) /
        (ind.baseline_value - ind.target_value)) *
      100;
    return Math.min(100, Math.max(0, prog));
  }
  const prog = ((ind.current_value - ind.baseline_value) / range) * 100;
  return Math.min(100, Math.max(0, prog));
}

function formatValue(value: number | null, unit: string | null): string {
  if (value == null) return "—";
  const formatted =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}M`
      : value >= 1_000
        ? `${(value / 1_000).toFixed(1)}K`
        : value % 1 === 0
          ? String(value)
          : value.toFixed(2);
  return unit ? `${formatted} ${unit}` : formatted;
}

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
              className="mt-1.5 block font-semibold text-neutral-800 transition hover:text-[#1e3a5f] hover:underline"
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
                    className="rounded-full bg-[#1e3a5f]/8 px-2.5 py-0.5 text-xs font-medium text-[#1e3a5f] transition hover:bg-[#1e3a5f]/15"
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
                  const chartData = buildMonthlyData(ind);
                  const allVals = chartData.map((d) => d.value);
                  const dataMax = Math.max(
                    ...allVals,
                    ind.target_value ?? 0,
                    1,
                  );
                  const yMax = dataMax * 1.25;
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
                        <div className="relative rounded-lg border-2 border-[#1e3a5f]/30 bg-[#1e3a5f]/5 p-3 text-center">
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[8px] font-bold text-white shadow">
                            NOW
                          </span>
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-[#1e3a5f]">
                            Achievement
                          </p>
                          <p className="mt-1.5 text-base font-extrabold text-[#1e3a5f]">
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

                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={chartData}
                            margin={{ top: 8, right: 16, left: -28, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id={`row-grad-${ind.id}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#1e3a5f"
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#1e3a5f"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 9, fill: "#a3a3a3" }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              domain={[0, yMax]}
                              tick={{ fontSize: 9, fill: "#a3a3a3" }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                fontSize: 11,
                                borderRadius: 8,
                                border: "1px solid #e5e5e5",
                                padding: "4px 10px",
                              }}
                              formatter={(v: unknown) => [
                                formatValue(
                                  v != null ? Number(v) : null,
                                  ind.unit,
                                ),
                                "Value",
                              ]}
                            />
                            {ind.target_value != null && (
                              <ReferenceLine
                                y={ind.target_value}
                                stroke="#10b981"
                                strokeDasharray="5 4"
                                label={{
                                  value: `Target: ${formatValue(ind.target_value, ind.unit)}`,
                                  fill: "#10b981",
                                  fontSize: 9,
                                  position: "insideTopRight",
                                }}
                              />
                            )}
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#1e3a5f"
                              strokeWidth={2}
                              fill={`url(#row-grad-${ind.id})`}
                              dot={(props: any) => {
                                const { cx, cy, payload, index } = props;
                                if (payload?.isCurrent) {
                                  return (
                                    <g key={`dot-curr-${index}`}>
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={6}
                                        fill="#1e3a5f"
                                        fillOpacity={0.18}
                                      />
                                      <circle
                                        cx={cx}
                                        cy={cy}
                                        r={3}
                                        fill="#1e3a5f"
                                        stroke="white"
                                        strokeWidth={2}
                                      />
                                    </g>
                                  );
                                }
                                return (
                                  <circle
                                    key={`dot-${index}`}
                                    cx={cx}
                                    cy={cy}
                                    r={2.5}
                                    fill="#1e3a5f"
                                    fillOpacity={0.6}
                                  />
                                );
                              }}
                              activeDot={{ r: 5 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-opacity-90"
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
