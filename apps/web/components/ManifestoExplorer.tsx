"use client";

import { useState } from "react";
import { ManifestoItemRow } from "./ManifestoItemRow";

interface KararArea {
  id: string;
  title_en: string;
  title_np: string;
  description_en?: string;
  color: string;
  colorLight: string;
  bpRange: readonly [number, number];
}

interface AreaStat extends KararArea {
  areaItems: any[];
  areaFulfilled: number;
  areaInProgress: number;
  areaPct: number;
}

interface Props {
  areaStats: AreaStat[];
  defaultAreaId?: string;
}

export function ManifestoExplorer({
  areaStats,
  defaultAreaId = "pp-002",
}: Props) {
  const [selectedId, setSelectedId] = useState(defaultAreaId);

  const selected = areaStats.find((a) => a.id === selectedId) ?? areaStats[0];

  return (
    <>
      {/* 5 Priority Area Cards */}
      <div className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          5 Priority Areas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {areaStats.map((area) => {
            const isActive = area.id === selectedId;
            return (
              <button
                key={area.id}
                onClick={() => setSelectedId(area.id)}
                className={`group flex flex-col overflow-hidden rounded-xl border-2 bg-white text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isActive ? "shadow-md" : "border-neutral-200"
                }`}
                style={isActive ? { borderColor: area.color } : undefined}
              >
                {/* Colour top bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: area.color }}
                />
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: area.color }}
                    >
                      {area.id.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {area.areaItems.length} commitments
                    </span>
                  </div>
                  <h3
                    className="text-sm font-bold leading-snug group-hover:underline"
                    style={{ color: area.color }}
                  >
                    {area.title_en}
                  </h3>
                  <p className="mt-0.5 text-xs text-neutral-400 font-nepali">
                    {area.title_np}
                  </p>
                  <div className="mt-auto pt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Progress</span>
                      <span className="font-bold" style={{ color: area.color }}>
                        {area.areaPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${area.areaPct}%`,
                          backgroundColor: area.color,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-neutral-400">
                      {area.areaFulfilled} fulfilled · {area.areaInProgress} in
                      progress
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items for selected area */}
      {selected && (
        <div>
          <h2
            className="mb-5 text-xl font-bold"
            style={{ color: selected.color }}
          >
            {selected.title_en}
          </h2>

          {selected.areaItems.length > 0 ? (
            <div className="space-y-3">
              {selected.areaItems.map((item: any) => (
                <ManifestoItemRow
                  key={item.id}
                  item={item}
                  indicators={item.outcome_indicators ?? []}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-neutral-400">
              No items loaded for this area yet.
            </p>
          )}
        </div>
      )}
    </>
  );
}
