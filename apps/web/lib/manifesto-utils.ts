/**
 * Shared types, constants, and helpers for manifesto components.
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const GOVT_FORMATION = "2026-03-27";

export const KARAR_AREAS = [
  {
    id: "pp-001",
    label_en: "Integrity & Good Governance",
    label_np: "सुशासन र स्वच्छता",
    bpRange: [1, 18] as const,
    color: "#1d4ed8",
    colorLight: "#eef2f7",
  },
  {
    id: "pp-002",
    label_en: "Prosperous Middle-Class",
    label_np: "समृद्ध मध्यमवर्गीय नेपाल",
    bpRange: [19, 60] as const,
    color: "#0f6b3b",
    colorLight: "#edf7f2",
  },
  {
    id: "pp-003",
    label_en: "Jobs & Opportunity",
    label_np: "रोजगारी र अवसर",
    bpRange: [61, 80] as const,
    color: "#92400e",
    colorLight: "#fdf6ed",
  },
  {
    id: "pp-004",
    label_en: "Connected Nepal",
    label_np: "जडान नेपाल",
    bpRange: [81, 95] as const,
    color: "#5b21b6",
    colorLight: "#f3f0fb",
  },
  {
    id: "pp-005",
    label_en: "Diaspora & Global Nepal",
    label_np: "प्रवासी र विश्व नेपाल",
    bpRange: [96, 100] as const,
    color: "#b91c1c",
    colorLight: "#fef2f2",
  },
] as const;

// ── Types ────────────────────────────────────────────────────────────────────

export type IndicatorType = "result" | "process";
export type ProcessStatus =
  | "not_started"
  | "ongoing"
  | "resolved"
  | "blocked"
  | "reversed";

export interface Source {
  id: string;
  slug: string;
  name_en: string;
  name_np?: string | null;
  document_date?: string | null;
  document_url?: string | null;
}

export interface OutcomeIndicator {
  id: string;
  indicator_name: string;
  indicator_label?: string | null;
  unit: string | null;
  baseline_value: number | null;
  baseline_date?: string | null;
  current_value: number | null;
  measured_date?: string | null;
  target_value: number | null;
  target_deadline: string | null;
  direction: string | null;
  source: string | null;
  source_url?: string | null;
  weight?: number | null;
  indicator_type: IndicatorType;
  process_status?: ProcessStatus | null;
  parent_indicator_id?: string | null;
  source_id?: string | null;
  sources?: Source | null;
  children?: OutcomeIndicator[]; // populated client-side for nesting
}

export interface MonthlyDataPoint {
  label: string;
  value: number;
  isCurrent: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function calcProgress(ind: {
  baseline_value: number | null;
  target_value: number | null;
  current_value: number | null;
  direction: string | null;
}): number | null {
  if (
    ind.baseline_value == null ||
    ind.target_value == null ||
    ind.current_value == null
  )
    return null;
  const range = ind.target_value - ind.baseline_value;
  if (range === 0) return ind.current_value >= ind.target_value ? 100 : 0;
  if (ind.direction === "lower_is_better") {
    return Math.min(
      100,
      Math.max(
        0,
        ((ind.baseline_value - ind.current_value) /
          (ind.baseline_value - ind.target_value)) *
          100,
      ),
    );
  }
  return Math.min(
    100,
    Math.max(0, ((ind.current_value - ind.baseline_value) / range) * 100),
  );
}

export function formatValue(v: number | null, unit: string | null): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  const s =
    abs >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : abs >= 1_000
        ? `${(v / 1_000).toFixed(1)}K`
        : v % 1 === 0
          ? String(v)
          : v.toFixed(2);
  return unit ? `${s} ${unit}` : s;
}

export function formatDate(
  d: string | null,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(
    "en-US",
    opts ?? { month: "short", day: "numeric", year: "numeric" },
  );
}

export function mandateElapsedPct(
  start: string | null,
  end: string | null,
): number | null {
  const s = new Date(start ?? GOVT_FORMATION).getTime();
  const e = end ? new Date(end).getTime() : null;
  if (!e) return null;
  const now = Date.now();
  return Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
}

export function buildMonthlyData(ind: {
  baseline_date?: string | null;
  baseline_value: number | null;
  current_value: number | null;
}): MonthlyDataPoint[] {
  const start = new Date(ind.baseline_date ?? GOVT_FORMATION);
  const now = new Date();
  const months: MonthlyDataPoint[] = [];
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

/**
 * Nest process indicators under their parent result indicators.
 * Returns only result indicators (with children[] populated).
 * Orphan process indicators (no parent) become standalone entries.
 */
export function nestIndicators(flat: OutcomeIndicator[]): OutcomeIndicator[] {
  const results = flat.filter((i) => i.indicator_type === "result");
  const processes = flat.filter((i) => i.indicator_type === "process");

  const byId = new Map(
    results.map((r) => [r.id, { ...r, children: [] as OutcomeIndicator[] }]),
  );

  for (const p of processes) {
    const parent = p.parent_indicator_id
      ? byId.get(p.parent_indicator_id)
      : null;
    if (parent) {
      parent.children.push(p);
    }
    // orphan process indicators are not displayed in the score view
  }

  return Array.from(byId.values());
}

/** Process status display config */
export const PROCESS_STATUS_CONFIG: Record<
  ProcessStatus,
  { label_en: string; label_np: string; color: string }
> = {
  not_started: {
    label_en: "Not Started",
    label_np: "सुरु नभएको",
    color: "bg-neutral-100 text-neutral-500",
  },
  ongoing: {
    label_en: "Ongoing",
    label_np: "जारी",
    color: "bg-blue-100 text-blue-700",
  },
  resolved: {
    label_en: "Resolved",
    label_np: "समाधान",
    color: "bg-emerald-100 text-emerald-700",
  },
  blocked: {
    label_en: "Blocked",
    label_np: "अवरुद्ध",
    color: "bg-red-100 text-red-700",
  },
  reversed: {
    label_en: "Reversed",
    label_np: "उल्टो",
    color: "bg-orange-100 text-orange-700",
  },
};
