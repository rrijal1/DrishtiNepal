/**
 * Shared types, constants, and helpers for manifesto components.
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const GOVT_FORMATION = "2026-03-27";

// ── Types ────────────────────────────────────────────────────────────────────

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
