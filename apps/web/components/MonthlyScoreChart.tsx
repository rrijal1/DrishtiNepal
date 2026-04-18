"use client";

import dynamic from "next/dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlotData = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Layout = any;

// Plotly uses browser APIs — must be loaded client-side only
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface MonthlyDataPoint {
  label: string; // e.g. "Apr 2026"
  score: number;
}

interface Props {
  data: MonthlyDataPoint[];
}

export function MonthlyScoreChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          height: 160,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.3)",
          fontSize: 13,
        }}
      >
        No monthly data yet
      </div>
    );
  }

  const xs = data.map((d) => d.label);
  const ys = data.map((d) => d.score);

  const trace: Partial<PlotData> = {
    x: xs,
    y: ys,
    type: "scatter",
    mode: "lines+markers",
    fill: "tozeroy",
    fillcolor: "rgba(255,255,255,0.08)",
    line: { color: "#60A5FA", width: 2.5, shape: "spline" },
    marker: { color: "#fff", size: 6, line: { color: "#60A5FA", width: 2 } },
    hovertemplate: "<b>%{x}</b><br>Score: %{y}<extra></extra>",
  };

  const layout: Partial<Layout> = {
    height: 170,
    margin: { t: 10, r: 10, b: 32, l: 36 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "inherit", color: "rgba(255,255,255,0.5)", size: 11 },
    xaxis: {
      type: "category",
      tickfont: { color: "rgba(255,255,255,0.45)", size: 11 },
      gridcolor: "rgba(255,255,255,0.06)",
      zeroline: false,
    },
    yaxis: {
      range: [0, 100],
      tickfont: { color: "rgba(255,255,255,0.45)", size: 11 },
      gridcolor: "rgba(255,255,255,0.06)",
      zeroline: false,
      dtick: 25,
    },
    showlegend: false,
  };

  return (
    <Plot
      data={[trace]}
      layout={layout}
      config={{
        displayModeBar: false,
        responsive: true,
      }}
      style={{ width: "100%", height: "170px" }}
    />
  );
}
