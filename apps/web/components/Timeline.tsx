"use client";
import { Clock } from "lucide-react";

export function Timeline({
  startDate,
  endDate,
}: {
  startDate?: string | null;
  endDate?: string | null;
}) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "TBD";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="flex items-center gap-4 text-sm text-neutral-500">
      <div className="flex items-center gap-1.5">
        <Clock size={14} className="text-neutral-400" />
        <span className="font-medium text-neutral-600">Start:</span>
        <span>{formatDate(startDate)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock size={14} className="text-neutral-400" />
        <span className="font-medium text-neutral-600">End:</span>
        <span>{formatDate(endDate)}</span>
      </div>
    </div>
  );
}
