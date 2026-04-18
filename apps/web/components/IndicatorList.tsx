"use client";

import {
  calcProgress,
  formatValue,
  nestIndicators,
  PROCESS_STATUS_CONFIG,
  type OutcomeIndicator,
  type ProcessStatus,
} from "@/lib/manifesto-utils";
import { useState } from "react";

interface Props {
  indicators: OutcomeIndicator[];
  locale: string;
}

export function IndicatorList({ indicators, locale }: Props) {
  const nested = nestIndicators(indicators);

  if (nested.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-400">
        {locale === "en"
          ? "No indicators assigned to this ministry yet."
          : "यस मन्त्रालयमा अझै कुनै सूचक तोकिएको छैन।"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {nested.map((ind) => (
        <ResultIndicatorCard key={ind.id} indicator={ind} locale={locale} />
      ))}
    </div>
  );
}

function ResultIndicatorCard({
  indicator: ind,
  locale,
}: {
  indicator: OutcomeIndicator;
  locale: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const progress = calcProgress(ind);
  const hasChildren = ind.children && ind.children.length > 0;
  const sourceName = (ind as any).sources?.name_en ?? ind.source ?? "";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      {/* Result indicator header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-800">
              {ind.indicator_label || ind.indicator_name}
            </p>
            {sourceName && (
              <p className="mt-0.5 text-[11px] text-neutral-400">
                {sourceName}
              </p>
            )}
          </div>
          {progress !== null && (
            <span
              className="shrink-0 text-lg font-bold tabular-nums"
              style={{ color: "#003893" }}
            >
              {Math.round(progress)}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ backgroundColor: "#003893", width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}

        {/* Metric line */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          <span>
            {locale === "en" ? "Baseline" : "आधार"}:{" "}
            {formatValue(ind.baseline_value, ind.unit)}
          </span>
          <span>
            {locale === "en" ? "Current" : "हालको"}:{" "}
            {formatValue(ind.current_value, ind.unit)}
          </span>
          <span>
            {locale === "en" ? "Target" : "लक्ष्य"}:{" "}
            {formatValue(ind.target_value, ind.unit)}
          </span>
        </div>

        {/* Toggle process indicators */}
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: "#003893" }}
          >
            <span
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
            >
              ▸
            </span>
            {ind.children!.length}{" "}
            {locale === "en" ? "process steps" : "प्रक्रिया चरणहरू"}
          </button>
        )}
      </div>

      {/* Nested process indicators */}
      {expanded && hasChildren && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 sm:px-5">
          <div className="space-y-2">
            {ind.children!.map((proc) => (
              <ProcessIndicatorRow
                key={proc.id}
                indicator={proc}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessIndicatorRow({
  indicator: proc,
  locale,
}: {
  indicator: OutcomeIndicator;
  locale: string;
}) {
  const status = (proc.process_status ?? "not_started") as ProcessStatus;
  const config = PROCESS_STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm">
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${config.color}`}
      >
        {locale === "en" ? config.label_en : config.label_np}
      </span>
      <span className="min-w-0 flex-1 text-neutral-700">
        {proc.indicator_label || proc.indicator_name}
      </span>
    </div>
  );
}
