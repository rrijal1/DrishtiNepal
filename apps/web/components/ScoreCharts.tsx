"use client";

import { getBarColor } from "./ScoreBadge";

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
