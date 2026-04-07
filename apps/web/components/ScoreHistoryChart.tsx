"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ScoreHistoryEntry {
  date: string;
  overall: number;
  outcome_score: number | null;
}

interface ScoreHistoryChartProps {
  scores: ScoreHistoryEntry[];
}

export function ScoreHistoryChart({ scores }: ScoreHistoryChartProps) {
  if (!scores || scores.length === 0) return null;

  const data = scores.map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    Overall: s.overall,
    Outcomes: s.outcome_score ?? undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#a3a3a3" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#a3a3a3" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e5e5",
          }}
        />
        <Line
          type="monotone"
          dataKey="Overall"
          stroke="#1d4ed8"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="Overall"
        />
        <Line
          type="monotone"
          dataKey="Outcomes"
          stroke="#10b981"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          dot={false}
          name="Outcome Score"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
