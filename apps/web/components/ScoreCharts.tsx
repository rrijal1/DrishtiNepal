"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface TierRadarProps {
  outcome: number;
  initiative: number;
  evidence: number;
}

export function TierRadar({ outcome, initiative, evidence }: TierRadarProps) {
  const data = [
    { tier: "Outcomes", value: outcome, fullMark: 100 },
    { tier: "Initiatives", value: initiative, fullMark: 100 },
    { tier: "Evidence", value: evidence, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e5e5e5" />
        <PolarAngleAxis
          dataKey="tier"
          tick={{ fontSize: 12, fill: "#737373" }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar
          dataKey="value"
          stroke="#1e3a5f"
          fill="#1e3a5f"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value) => [`${value}/100`, "Score"]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e5e5",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

interface OutcomeAreaBarProps {
  areas: { label: string; score: number; weight: string }[];
}

export function OutcomeAreaBars({ areas }: OutcomeAreaBarProps) {
  return (
    <div className="space-y-3">
      {areas.map((area) => (
        <div key={area.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-neutral-600">
              {area.label}{" "}
              <span className="text-neutral-400">({area.weight})</span>
            </span>
            <span className="font-semibold text-neutral-800">
              {area.score}/100
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full transition-all ${getBarColor(area.score)}`}
              style={{ width: `${Math.min(area.score, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function getBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
}
