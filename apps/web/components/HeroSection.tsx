"use client";

import { useEffect, useState } from "react";

// ─── Brand palette ───────────────────────────────────────────────────────────
// Primary:  #1e40af (deep sky)   Light: #0EA5E9   Dark: #1e3a8a
// Red:      #E63946 (warm crimson)

const BRAND = "#1e40af";
const BRAND_LIGHT = "#0EA5E9";
const BRAND_DARK = "#1e3a8a";
const BRAND_RED = "#e63946";

// ─── Globe constants ─────────────────────────────────────────────────────────

const CX = 250;
const CY = 190;
const R = 155;

const NODES = [
  { id: "gov", label: "Governance", x: 250, y: 35, color: BRAND, delay: 0.3 },
  { id: "eco", label: "Economy", x: 397, y: 142, color: "#2dba6e", delay: 0.5 },
  { id: "job", label: "Jobs", x: 341, y: 315, color: BRAND_RED, delay: 0.7 },
  {
    id: "con",
    label: "Connectivity",
    x: 159,
    y: 315,
    color: "#7c6df0",
    delay: 0.9,
  },
  {
    id: "dia",
    label: "Diaspora",
    x: 103,
    y: 142,
    color: "#e8873a",
    delay: 1.1,
  },
] as const;

const ARCS = [
  {
    path: `M 250,35  C 252,90  251,148 ${CX},${CY}`,
    color: BRAND,
    dur: 2.4,
    delay: 1.2,
  },
  {
    path: `M 397,142 C 358,154 306,174 ${CX},${CY}`,
    color: "#2dba6e",
    dur: 2.7,
    delay: 1.6,
  },
  {
    path: `M ${CX},${CY} C 272,224 304,272 341,315`,
    color: BRAND_RED,
    dur: 2.2,
    delay: 2.0,
  },
  {
    path: `M ${CX},${CY} C 226,224 196,272 159,315`,
    color: "#7c6df0",
    dur: 2.5,
    delay: 2.3,
  },
  {
    path: `M 103,142 C 142,154 194,174 ${CX},${CY}`,
    color: "#e8873a",
    dur: 2.8,
    delay: 1.4,
  },
  {
    path: `M 103,142 C 178,62  322,62  397,142`,
    color: BRAND_LIGHT,
    dur: 3.1,
    delay: 2.8,
  },
];

const LAT_LINES = [
  { cy: 56, rx: 78, ry: 23 },
  { cy: 112, rx: 134, ry: 40 },
  { cy: 190, rx: 155, ry: 47 },
  { cy: 268, rx: 134, ry: 40 },
  { cy: 324, rx: 78, ry: 23 },
];

const LONG_PATHS = [
  "M 250,35 L 250,345",
  "M 250,35 C 282,112 293,268 250,345",
  "M 250,35 C 328,118 338,262 250,345",
  "M 250,35 C 366,128 374,252 250,345",
  "M 250,35 C 218,112 207,268 250,345",
  "M 250,35 C 172,118 162,262 250,345",
  "M 250,35 C 134,128 126,252 250,345",
];

// ─── Counter animation ────────────────────────────────────────────────────────

function useCounter(target: number, delay = 0, duration = 1500) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tid = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        setVal(Math.round((1 - (1 - t) ** 3) * target));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(tid);
      cancelAnimationFrame(raf);
    };
  }, [target, delay, duration]);

  return val;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  ministersCount?: number;
  locale?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HeroSection({ ministersCount = 15, locale = "en" }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const daysSince = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date("2026-03-27T00:00:00Z").getTime()) / 86_400_000,
    ),
  );

  const cMinisters = useCounter(ministersCount, 400);
  const cPromises = useCounter(100, 600);
  const cSources = useCounter(20, 800);
  const cDays = useCounter(daysSince, 1000);

  const en = {
    eyebrow: "Live \u00b7 Government Accountability",
    title: (
      <>
        Nepal&apos;s promises,
        <br />
        <span style={{ color: BRAND_RED }}>held to account.</span>
      </>
    ),
    desc: "AI agents monitor every minister 24/7 \u2014 matching government actions against Ra Swa Pa\u2019s Bachha Patra and scoring real outcomes, not activity.",
    ctaA: "View Manifesto \u2192",
    ctaB: "Minister Scorecards",
    stats: ["Ministers", "Promises", "News Sources", "Days Active"],
  };
  const np = {
    eyebrow:
      "\u0932\u093e\u0907\u092d \u00b7 \u0938\u0930\u0915\u093e\u0930\u0940 \u091c\u0935\u093e\u092b\u0926\u0947\u0939\u0940\u0924\u093e",
    title: (
      <>
        \u0928\u0947\u092a\u093e\u0932\u0915\u093e
        \u0935\u093e\u091a\u093e\u0939\u0930\u0942,
        <br />
        <span style={{ color: BRAND_RED }}>
          \u091c\u0935\u093e\u092b\u0926\u0947\u0939\u094b
          \u092c\u0928\u093e\u0907\u0901\u0926\u0948\u0964
        </span>
      </>
    ),
    desc: "AI \u090f\u091c\u0947\u0928\u094d\u091f\u0939\u0930\u0942\u0932\u0947 \u092a\u094d\u0930\u0924\u094d\u092f\u0947\u0915 \u092e\u0928\u094d\u0924\u094d\u0930\u0940\u0932\u093e\u0908 \u0968\u096a/\u096d \u0928\u093f\u0917\u0930\u093e\u0928\u0940 \u0917\u0930\u094d\u091b\u0928\u094d \u2014 \u0938\u0930\u0915\u093e\u0930\u0940 \u0915\u093e\u0930\u094d\u092f\u0939\u0930\u0942\u0932\u093e\u0908 \u0935\u093e\u091a\u093e \u092a\u0924\u094d\u0930\u0938\u0901\u0917 \u092e\u093f\u0932\u093e\u0909\u0901\u0926\u0948 \u0935\u093e\u0938\u094d\u0924\u0935\u093f\u0915 \u0928\u0924\u093f\u091c\u093e\u0915\u094b \u0938\u094d\u0915\u094b\u0930 \u0926\u093f\u0928\u094d\u091b\u0928\u094d\u0964",
    ctaA: "\u0935\u093e\u091a\u093e \u092a\u0924\u094d\u0930 \u0939\u0947\u0930\u094d\u0928\u0941\u0939\u094b\u0938\u094d \u2192",
    ctaB: "\u092e\u0928\u094d\u0924\u094d\u0930\u0940 \u0938\u094d\u0915\u094b\u0930\u0915\u093e\u0930\u094d\u0921",
    stats: [
      "\u092e\u0928\u094d\u0924\u094d\u0930\u0940",
      "\u0935\u093e\u091a\u093e\u0939\u0930\u0942",
      "\u0938\u092e\u093e\u091a\u093e\u0930 \u0938\u094d\u0930\u094b\u0924",
      "\u0926\u093f\u0928 \u0938\u0915\u094d\u0930\u093f\u092f",
    ],
  };
  const t = locale === "en" ? en : np;

  return (
    <section className="relative overflow-hidden bg-gray-50">
      {/* Subtle background washes */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full blur-[100px]"
          style={{ backgroundColor: BRAND_LIGHT + "0a" }}
        />
        <div
          className="absolute -left-24 bottom-0 h-72 w-72 rounded-full blur-[80px]"
          style={{ backgroundColor: BRAND_RED + "08" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-14 sm:px-6 sm:pt-24 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* ── Text column ── */}
          <div>
            {/* Live badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
              style={{
                borderColor: BRAND + "20",
                backgroundColor: BRAND + "08",
              }}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: BRAND_LIGHT }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: BRAND }}
              >
                {t.eyebrow}
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-neutral-500">
              {t.desc}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/manifesto"
                className="rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
                style={{
                  backgroundColor: BRAND,
                  boxShadow: `0 8px 24px ${BRAND}30`,
                }}
              >
                {t.ctaA}
              </a>
              <a
                href="/ministers"
                className="rounded-lg border border-neutral-200 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                {t.ctaB}
              </a>
            </div>
          </div>

          {/* ── Globe visualization column ── */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-[500px]">
              <svg
                viewBox="0 0 500 380"
                className="h-auto w-full"
                aria-hidden="true"
              >
                <defs>
                  <filter
                    id="dn-pencil"
                    x="-4%"
                    y="-4%"
                    width="108%"
                    height="108%"
                  >
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.04"
                      numOctaves="2"
                      result="noise"
                      seed="9"
                    />
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="noise"
                      scale="1.3"
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                  </filter>
                  <filter
                    id="dn-glow"
                    x="-80%"
                    y="-80%"
                    width="260%"
                    height="260%"
                  >
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Globe outer circle */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke="#c8cdd6"
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
                  filter="url(#dn-pencil)"
                />

                {/* Latitude lines */}
                {LAT_LINES.map((l, i) => (
                  <ellipse
                    key={i}
                    cx={CX}
                    cy={l.cy}
                    rx={l.rx}
                    ry={l.ry}
                    fill="none"
                    stroke="#c8cdd6"
                    strokeWidth="0.6"
                    strokeDasharray="3.5 2"
                    filter="url(#dn-pencil)"
                  />
                ))}

                {/* Longitude arcs */}
                {LONG_PATHS.map((p, i) => (
                  <path
                    key={i}
                    d={p}
                    fill="none"
                    stroke="#c8cdd6"
                    strokeWidth="0.6"
                    strokeDasharray="3.5 2"
                    filter="url(#dn-pencil)"
                  />
                ))}

                {/* Static arc rails */}
                {ARCS.map((arc, i) => (
                  <path
                    key={`rail-${i}`}
                    d={arc.path}
                    fill="none"
                    stroke="#b8bec9"
                    strokeWidth="0.9"
                    filter="url(#dn-pencil)"
                  />
                ))}

                {/* Animated traveling data segments */}
                {mounted &&
                  ARCS.map((arc, i) => (
                    <path
                      key={`travel-${i}`}
                      d={arc.path}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray="7 100"
                      opacity="0.85"
                      style={{
                        animation: `dn-travel ${arc.dur}s linear ${arc.delay}s infinite`,
                        filter: `drop-shadow(0 0 3px ${arc.color}40)`,
                      }}
                    />
                  ))}

                {/* Centre node */}
                <circle
                  cx={CX}
                  cy={CY}
                  r="18"
                  fill="white"
                  stroke="#c8cdd6"
                  strokeWidth="1.5"
                />
                <circle cx={CX} cy={CY} r="5.5" fill={BRAND} opacity="0.9" />
                <text
                  x={CX}
                  y={CY + 28}
                  fill="#94a3b8"
                  fontSize="7.5"
                  fontFamily="ui-monospace, monospace"
                  textAnchor="middle"
                >
                  OUTCOME
                </text>

                {/* Priority area nodes */}
                {NODES.map((n) => (
                  <g key={n.id}>
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="15"
                      fill="none"
                      stroke={n.color}
                      strokeWidth="0.8"
                      opacity="0.18"
                      style={
                        mounted
                          ? {
                              animation: `dn-node-pulse 3s ease-in-out ${n.delay}s infinite`,
                            }
                          : undefined
                      }
                    />
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="7.5"
                      fill="white"
                      stroke={n.color}
                      strokeWidth="1.5"
                      filter="url(#dn-glow)"
                      style={
                        mounted
                          ? {
                              animation: `dn-node-appear 0.5s ease-out ${n.delay}s both`,
                            }
                          : undefined
                      }
                    />
                    <circle cx={n.x} cy={n.y} r="2.8" fill={n.color} />
                  </g>
                ))}

                {/* Node labels */}
                {NODES.map((n) => {
                  const dx = n.x - CX;
                  const dy = n.y - CY;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const nx = dx / len;
                  const ny = dy / len;
                  const lx = n.x + nx * 20;
                  const ly = n.y + ny * 16 + 4;
                  const anchor =
                    dx > 20 ? "start" : dx < -20 ? "end" : "middle";
                  return (
                    <text
                      key={`lbl-${n.id}`}
                      x={lx}
                      y={ly}
                      fill={n.color}
                      fontSize="8.5"
                      fontFamily="ui-monospace, monospace"
                      textAnchor={anchor}
                      opacity="0.75"
                      style={
                        mounted
                          ? {
                              animation: `dn-fade-in 0.6s ease-out ${n.delay + 0.2}s both`,
                            }
                          : undefined
                      }
                    >
                      {n.label.toUpperCase()}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="mt-12 border-t border-gray-300 grid grid-cols-2 sm:grid-cols-4">
          <StatCell
            value={cMinisters}
            label={t.stats[0]}
            color={BRAND}
            mounted={mounted}
            animDelay="0.5s"
          />
          <StatCell
            value={cPromises}
            label={t.stats[1]}
            color="#2dba6e"
            mounted={mounted}
            animDelay="0.7s"
          />
          <StatCell
            value={cSources}
            suffix="+"
            label={t.stats[2]}
            color={BRAND_RED}
            mounted={mounted}
            animDelay="0.9s"
          />
          <StatCell
            value={cDays}
            label={t.stats[3]}
            color="#7c6df0"
            mounted={mounted}
            animDelay="1.1s"
          />
        </div>
      </div>
    </section>
  );
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({
  value,
  label,
  color,
  suffix = "",
  mounted,
  animDelay = "0s",
}: {
  value: number;
  label: string;
  color: string;
  suffix?: string;
  mounted: boolean;
  animDelay?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center [&:not(:last-child)]:border-r [&:not(:last-child)]:border-gray-300">
      <span
        className="font-mono text-3xl font-black tabular-nums sm:text-4xl"
        style={{ color }}
      >
        {value}
        {suffix}
      </span>

      <svg
        width="44"
        height="5"
        viewBox="0 0 44 5"
        className="overflow-visible"
        aria-hidden="true"
      >
        <path
          d="M0,2.5 Q11,1 22,2.5 Q33,4 44,2.5"
          fill="none"
          stroke="#c8cdd6"
          strokeWidth="1"
        />
        <path
          d="M0,2.5 Q11,1 22,2.5 Q33,4 44,2.5"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100 0"
          style={
            mounted
              ? {
                  animation: `dn-expand-line 1.2s ease-out ${animDelay} both`,
                }
              : { strokeDashoffset: 100 }
          }
        />
      </svg>

      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
        {label}
      </span>
    </div>
  );
}
