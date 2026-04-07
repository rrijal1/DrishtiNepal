"use client";

import {
  GOVT_FORMATION,
  type OutcomeIndicator,
  buildMonthlyData,
  calcProgress,
  formatDate as fmtDate,
  formatValue as fmtVal,
  mandateElapsedPct as mandatePct,
} from "@/lib/manifesto-utils";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

type Indicator = OutcomeIndicator;

interface ActionLink {
  link_type: string;
  actions: {
    id: string;
    title_en: string;
    action_date: string | null;
    category: string | null;
    sentiment: string | null;
    description_en: string | null;
    sources: string[] | null;
  } | null;
}

interface DecisionLink {
  cabinet_decisions: {
    id: string;
    title_en: string;
    decision_date: string | null;
    summary_en: string | null;
    significance: string | null;
  } | null;
}

interface NewsPost {
  id: string;
  title_en: string;
  slug: string;
  published_at: string | null;
  category: string | null;
  image_url: string | null;
}

interface EvidenceItem {
  id: string;
  assessment_en: string | null;
  citations: string[] | null;
  probability: number | null;
  assessed_at: string | null;
}

interface ManifestoItem {
  id: string;
  source_id: string;
  title_en: string | null;
  title_np: string | null;
  item_text_en: string;
  item_text_np: string | null;
  description_en: string | null;
  key_commitments: string[] | null;
  target_metrics: Record<string, string> | null;
  status: string;
  category: string;
  priority: string | null;
  start_date: string | null;
  end_date: string | null;
  minister_manifesto_assignments: {
    minister_id: string;
    ministers: { id: string; name_en: string; name_np: string | null } | null;
  }[];
}

interface KararArea {
  id: string;
  title_en: string;
  color: string;
}

export interface ManifestoItemDetailProps {
  item: ManifestoItem;
  indicators: Indicator[];
  actionLinks: ActionLink[];
  decisionLinks: DecisionLink[];
  evidenceItems: EvidenceItem[];
  relatedPosts: NewsPost[];
  aggregateScore: number | null;
  kararArea: KararArea | null;
  locale: "en" | "np";
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Completed",
  },
  fulfilled: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Fulfilled",
  },
  in_progress: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    label: "In Progress",
  },
  partially_fulfilled: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    label: "Partially Fulfilled",
  },
  not_started: {
    bg: "bg-neutral-50",
    text: "text-neutral-500",
    border: "border-neutral-200",
    dot: "bg-neutral-300",
    label: "Not Started",
  },
  broken: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "Broken",
  },
  contradicted: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "Contradicted",
  },
};

const SENTIMENT_MAP: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  positive: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Supports",
  },
  negative: { bg: "bg-red-50", text: "text-red-700", label: "Against" },
  neutral: { bg: "bg-neutral-100", text: "text-neutral-600", label: "Neutral" },
  mixed: { bg: "bg-amber-50", text: "text-amber-700", label: "Mixed" },
};

const LINK_TYPE_MAP: Record<string, { accent: string; label: string }> = {
  supports: { accent: "border-l-emerald-400", label: "✓ Supports" },
  contradicts: { accent: "border-l-red-400", label: "✗ Contradicts" },
  related: { accent: "border-l-neutral-300", label: "~ Related" },
};

const GITHUB_REPO = "https://github.com/rrijal1/DrishtiNepal";
const CIRCUMFERENCE = 2 * Math.PI * 38;

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">
      {children}
    </h2>
  );
}

function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function IndicatorChart({ ind, color }: { ind: Indicator; color: string }) {
  const pct = calcProgress(ind);
  const chartData = buildMonthlyData(ind);
  const allValues = chartData.map((d) => d.value);
  const dataMax = Math.max(...allValues, ind.target_value ?? 0, 1);
  const yMax = dataMax * 1.25;

  return (
    <Card className="overflow-hidden">
      {/* ── Header: indicator name + description + verification ── */}
      <div className="border-b border-neutral-100 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold capitalize text-neutral-800">
              {(ind.indicator_label ?? ind.indicator_name).replace(/_/g, " ")}
            </p>
            <p className="mt-0.5 text-xs text-neutral-400 capitalize">
              Tracking:{" "}
              <span className="font-mono">
                {ind.indicator_name.replace(/_/g, " ")}
              </span>
              {ind.unit ? ` · ${ind.unit}` : ""}
              {ind.direction === "lower_is_better"
                ? " · ↓ lower is better"
                : " · ↑ higher is better"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {pct != null ? (
              <>
                <div className="text-2xl font-extrabold" style={{ color }}>
                  {Math.round(pct)}%
                </div>
                <div className="text-[10px] text-neutral-400">
                  toward target
                </div>
              </>
            ) : (
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500">
                Baseline set
              </span>
            )}
          </div>
        </div>

        {/* Verification source — always clickable */}
        {ind.source && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2">
            <svg
              className="h-3.5 w-3.5 shrink-0 text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-[10px] font-medium text-neutral-500">
              Verification source:
            </span>
            {ind.source_url ? (
              <a
                href={ind.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold text-blue-600 underline underline-offset-2 transition hover:text-blue-700"
              >
                {ind.source} ↗
              </a>
            ) : (
              <span className="text-[10px] font-semibold text-neutral-700">
                {ind.source}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Monthly progress chart ── */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Monthly Progress
          </p>
          {pct != null && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-[10px] font-semibold" style={{ color }}>
                {Math.round(pct)}%
              </span>
            </div>
          )}
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 20, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`grad-${ind.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f5f5f5"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#a3a3a3" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, yMax]}
                tick={{ fontSize: 10, fill: "#a3a3a3" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: "1px solid #e5e5e5",
                  padding: "6px 12px",
                }}
                formatter={(v: unknown, _name: unknown, props: any) => [
                  fmtVal(v != null ? Number(v) : null, ind.unit),
                  props.payload?.isCurrent ? "Current ★" : "Value",
                ]}
              />
              {ind.target_value != null && (
                <ReferenceLine
                  y={ind.target_value}
                  stroke="#10b981"
                  strokeDasharray="5 4"
                  label={{
                    value: `Target: ${fmtVal(ind.target_value, ind.unit)}`,
                    fill: "#10b981",
                    fontSize: 9,
                    position: "insideTopRight",
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#grad-${ind.id})`}
                dot={(props: any) => {
                  const { cx, cy, payload, index } = props;
                  if (payload?.isCurrent) {
                    return (
                      <g key={`dot-curr-${index}`}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={8}
                          fill={color}
                          fillOpacity={0.18}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={color}
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
                      r={3}
                      fill={color}
                      fillOpacity={0.7}
                    />
                  );
                }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {ind.direction === "lower_is_better" && (
          <p className="mt-2 text-[10px] text-neutral-400">
            ↓ Lower values indicate better performance
          </p>
        )}
      </div>
    </Card>
  );
}

function MandateBar({
  startDate,
  endDate,
}: {
  startDate: string | null;
  endDate: string | null;
}) {
  const pct = mandatePct(startDate, endDate);
  const start = new Date(startDate ?? GOVT_FORMATION);
  const end = endDate ? new Date(endDate) : null;
  const now = new Date();

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        Mandate Timeline
      </p>
      <div className="relative h-2 rounded-full bg-neutral-100">
        {pct != null && (
          <>
            <div
              className="absolute h-full rounded-full bg-[#0EA5E9]/25"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-blue-700"
              style={{ left: `${pct}%` }}
            />
          </>
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] text-neutral-400">
        <span>
          {start.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
          {!startDate && " (govt. formation)"}
        </span>
        {pct != null && (
          <span className="font-medium text-blue-700">
            {now.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}{" "}
            · {pct}% elapsed
          </span>
        )}
        {end && (
          <span>
            {end.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ManifestoItemDetail({
  item,
  indicators,
  actionLinks,
  decisionLinks,
  evidenceItems,
  relatedPosts,
  aggregateScore,
  kararArea,
  locale,
}: ManifestoItemDetailProps) {
  const lang = locale;

  const s = STATUS_MAP[item.status] ?? STATUS_MAP.not_started;
  const color = kararArea?.color ?? "#1d4ed8";
  const keyCommitments: string[] = Array.isArray(item.key_commitments)
    ? item.key_commitments
    : [];
  const ministers = item.minister_manifesto_assignments ?? [];
  const hasActions = actionLinks.length > 0;
  const hasDecisions = decisionLinks.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Breadcrumb ── */}
      <div className="mb-6 flex items-center gap-1.5 text-sm text-neutral-400">
        <Link href="/manifesto" className="hover:text-neutral-700">
          Vacha Patra
        </Link>
        {kararArea && (
          <>
            <span>/</span>
            <Link href="/manifesto" className="hover:text-neutral-700">
              {kararArea.title_en}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-mono text-neutral-600">{item.source_id}</span>
      </div>

      {/* ── Hero header ── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Badge row */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs font-semibold text-neutral-600">
              {item.source_id}
            </span>
            {kararArea && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {kararArea.title_en}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            {item.priority && (
              <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600 capitalize">
                {item.priority} priority
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl leading-tight">
            {lang === "en"
              ? (item.title_en ?? item.item_text_en)
              : (item.title_np ?? item.title_en ?? item.item_text_en)}
          </h1>

          {/* Ministers */}
          {ministers.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-400">Accountable:</span>
              {ministers.map((a) => (
                <Link
                  key={a.minister_id}
                  href={`/ministers/${a.ministers?.id ?? a.minister_id}`}
                  className="rounded-full bg-[#0EA5E9]/8 px-2.5 py-0.5 text-xs font-medium text-blue-700 transition hover:bg-[#0EA5E9]/15"
                >
                  {lang === "en"
                    ? a.ministers?.name_en
                    : (a.ministers?.name_np ?? a.ministers?.name_en)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* ══ Main content (left/primary) ══════════════════════════════════ */}
        <div className="min-w-0 flex-1 space-y-8">
          {/* 1. Outcome Indicators */}
          <section>
            <SectionHeading>Outcome Indicators</SectionHeading>
            {indicators.length > 0 ? (
              <div className="space-y-5">
                {indicators.map((ind) => (
                  <IndicatorChart key={ind.id} ind={ind} color={color} />
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-sm text-neutral-500">
                  No measurable indicators linked yet.
                </p>
                <a
                  href={`${GITHUB_REPO}/issues/new?title=Indicator+proposal%3A+${encodeURIComponent(item.source_id)}&labels=indicator&body=Commitment%3A+${encodeURIComponent(item.source_id)}%0A%0AProposed+indicator%3A`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 transition hover:border-neutral-400"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  Propose an indicator on GitHub
                </a>
              </Card>
            )}
          </section>

          {/* 2. Full Commitment Text */}
          <section>
            <SectionHeading>Commitment Text</SectionHeading>
            <Card className="p-6">
              <p className="leading-relaxed text-neutral-700">
                {lang === "en"
                  ? item.item_text_en || item.description_en || "—"
                  : item.item_text_np || item.item_text_en || "—"}
              </p>
              {keyCommitments.length > 0 && (
                <div className="mt-5 border-t border-neutral-100 pt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Specific commitments
                  </p>
                  <ul className="space-y-2">
                    {keyCommitments.map((c, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-neutral-700"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </section>

          {/* 3. Government Actions & Decisions */}
          <section>
            <SectionHeading>Government Actions & Decisions</SectionHeading>
            {hasActions || hasDecisions ? (
              <div className="space-y-3">
                {decisionLinks.map((dl, i) => {
                  const d = dl.cabinet_decisions;
                  if (!d) return null;
                  return (
                    <div
                      key={i}
                      className="rounded-xl border-l-4 border-l-purple-400 border border-neutral-200 bg-white px-5 py-4"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                          Cabinet Decision
                        </span>
                        <span className="text-xs text-neutral-400">
                          {fmtDate(d.decision_date)}
                        </span>
                        {d.significance && (
                          <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] capitalize text-neutral-500">
                            {d.significance}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-neutral-800">
                        {d.title_en}
                      </p>
                      {d.summary_en && (
                        <p className="mt-1 text-sm text-neutral-600">
                          {d.summary_en}
                        </p>
                      )}
                    </div>
                  );
                })}
                {actionLinks.map((al, i) => {
                  const a = al.actions;
                  if (!a) return null;
                  const lt =
                    LINK_TYPE_MAP[al.link_type] ?? LINK_TYPE_MAP.related;
                  const sent = a.sentiment ? SENTIMENT_MAP[a.sentiment] : null;
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border-l-4 ${lt.accent} border border-neutral-200 bg-white px-5 py-4`}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold text-neutral-500">
                          {lt.label}
                        </span>
                        {sent && (
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-medium ${sent.bg} ${sent.text}`}
                          >
                            {sent.label}
                          </span>
                        )}
                        {a.category && (
                          <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] capitalize text-neutral-500">
                            {a.category}
                          </span>
                        )}
                        <span className="text-xs text-neutral-400">
                          {fmtDate(a.action_date)}
                        </span>
                      </div>
                      <p className="font-medium text-neutral-800">
                        {a.title_en}
                      </p>
                      {a.description_en && (
                        <p className="mt-1 text-sm leading-relaxed text-neutral-600 line-clamp-2">
                          {a.description_en}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-sm text-neutral-400">
                  No cabinet decisions or government actions have been recorded
                  for this commitment yet.
                </p>
                <a
                  href={`${GITHUB_REPO}/issues/new?title=Action+report%3A+${encodeURIComponent(item.source_id)}&labels=action&body=Commitment%3A+${encodeURIComponent(item.source_id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 transition hover:border-neutral-400"
                >
                  Report a government action →
                </a>
              </Card>
            )}
          </section>

          {/* 4. News & Evidence */}
          <section>
            <SectionHeading>News & Evidence</SectionHeading>
            {relatedPosts.length > 0 || evidenceItems.length > 0 ? (
              <div className="space-y-3">
                {evidenceItems.map((ev) => (
                  <Card key={ev.id} className="px-5 py-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        Evidence Assessment
                      </span>
                      {ev.probability != null && (
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                          {Math.round(ev.probability * 100)}% confidence
                        </span>
                      )}
                      <span className="text-xs text-neutral-400">
                        {fmtDate(ev.assessed_at)}
                      </span>
                    </div>
                    {ev.assessment_en && (
                      <p className="mt-1 text-sm leading-relaxed text-neutral-700">
                        {ev.assessment_en}
                      </p>
                    )}
                    {ev.citations && ev.citations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ev.citations.map((cite, ci) => (
                          <a
                            key={ci}
                            href={cite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                          >
                            <svg
                              className="h-3 w-3 shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Source {ci + 1} ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
                {relatedPosts.map((p, i) => {
                  if (!p) return null;
                  return (
                    <Link
                      key={i}
                      href={`/articles/${p.slug}`}
                      className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4 transition hover:shadow-sm"
                    >
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-14 w-20 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          {p.category && (
                            <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] capitalize text-neutral-500">
                              {p.category}
                            </span>
                          )}
                          <span className="text-xs text-neutral-400">
                            {fmtDate(p.published_at)}
                          </span>
                        </div>
                        <p className="font-medium text-neutral-800 hover:text-blue-700 line-clamp-2">
                          {p.title_en}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-sm text-neutral-400">
                  No news articles or evidence assessments linked yet.
                </p>
              </Card>
            )}
          </section>

          {/* 5. Community / GitHub */}
          <section>
            <SectionHeading>Community & Sources</SectionHeading>
            <Card className="p-5">
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${GITHUB_REPO}/issues?q=label%3A${encodeURIComponent(item.source_id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-white"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  View open issues for {item.source_id}
                </a>
                <a
                  href={`${GITHUB_REPO}/issues/new?title=Data+correction%3A+${encodeURIComponent(item.source_id)}&labels=data-correction&body=Commitment%3A+${encodeURIComponent(item.source_id)}%0ATitle%3A+${encodeURIComponent(item.title_en ?? "")}%0A%0APlease+describe+the+correction%3A`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-white"
                >
                  + Propose a correction
                </a>
                <a
                  href={`${GITHUB_REPO}/issues/new?title=Indicator+proposal%3A+${encodeURIComponent(item.source_id)}&labels=indicator&body=Commitment%3A+${encodeURIComponent(item.source_id)}%0A%0AProposed+indicator+name%3A%0AData+source%3A%0ABaseline+value%3A%0ATarget+value%3A`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-white"
                >
                  + Propose an indicator
                </a>
              </div>
              <p className="mt-3 text-xs text-neutral-400">
                This project is open source. Data corrections and indicator
                proposals are reviewed publicly on GitHub before being merged.
              </p>
            </Card>
          </section>
        </div>

        {/* ══ Sticky sidebar (right) ═══════════════════════════════════════ */}
        <aside className="w-full lg:sticky lg:top-6 lg:w-72 lg:shrink-0 space-y-5">
          {/* Status verdict card */}
          <Card
            className={`overflow-hidden border-2`}
            style={{ borderColor: color }}
          >
            <div className="px-5 py-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Current Status
              </p>
              <div className="flex items-center justify-between gap-4">
                {/* Ring */}
                <div className="relative shrink-0">
                  <svg
                    width="84"
                    height="84"
                    viewBox="0 0 84 84"
                    className="-rotate-90"
                  >
                    <circle
                      cx="42"
                      cy="42"
                      r="38"
                      fill="none"
                      stroke="#f0f0f0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="42"
                      cy="42"
                      r="38"
                      fill="none"
                      stroke={color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${aggregateScore != null ? (CIRCUMFERENCE * aggregateScore) / 100 : 0} ${CIRCUMFERENCE}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold text-neutral-800">
                      {aggregateScore != null ? `${aggregateScore}%` : "—"}
                    </span>
                  </div>
                </div>
                <div>
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    {s.label}
                  </div>
                  {aggregateScore != null && (
                    <p className="mt-2 text-xs text-neutral-400">
                      {aggregateScore}% toward outcome targets
                    </p>
                  )}
                  {indicators.length > 0 && (
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {indicators.filter((i) => i.current_value != null).length}
                      /{indicators.length} indicators measured
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Mandate timeline */}
          <Card className="px-5 py-4">
            <MandateBar startDate={item.start_date} endDate={item.end_date} />
            <div className="mt-4 space-y-1.5 text-xs text-neutral-500">
              <div className="flex justify-between">
                <span className="text-neutral-400">Start</span>
                <span className="font-medium">
                  {fmtDate(item.start_date ?? GOVT_FORMATION)}
                </span>
              </div>
              {item.end_date && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Target deadline</span>
                  <span className="font-medium">{fmtDate(item.end_date)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-400">Baseline set</span>
                <span className="font-medium">Mar 27, 2026</span>
              </div>
            </div>
          </Card>

          {/* Responsible ministers */}
          {ministers.length > 0 && (
            <Card className="px-5 py-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Accountable Ministers
              </p>
              <div className="space-y-2">
                {ministers.map((a) => (
                  <Link
                    key={a.minister_id}
                    href={`/ministers/${a.ministers?.id ?? a.minister_id}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-[#0EA5E9]/5"
                  >
                    <span className="h-6 w-6 rounded-full bg-[#0EA5E9]/10 text-center text-[10px] font-bold leading-6 text-blue-700">
                      {(a.ministers?.name_en?.[0] ?? "?").toUpperCase()}
                    </span>
                    <span>
                      {lang === "en"
                        ? a.ministers?.name_en
                        : (a.ministers?.name_np ?? a.ministers?.name_en)}
                    </span>
                    <svg
                      className="ml-auto h-3.5 w-3.5 text-neutral-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Quick links */}
          <Card className="divide-y divide-neutral-100 overflow-hidden">
            <Link
              href="/manifesto"
              className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              <svg
                className="h-4 w-4 text-neutral-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Vacha Patra
            </Link>
            <a
              href={`${GITHUB_REPO}/issues/new?title=Data+correction%3A+${encodeURIComponent(item.source_id)}&labels=data-correction`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              <svg
                className="h-4 w-4 text-neutral-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Propose a correction
            </a>
            <a
              href={`${GITHUB_REPO}/issues?q=label%3A${encodeURIComponent(item.source_id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              <svg
                className="h-4 w-4 text-neutral-400"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Open issues on GitHub
            </a>
          </Card>
        </aside>
      </div>
    </div>
  );
}
