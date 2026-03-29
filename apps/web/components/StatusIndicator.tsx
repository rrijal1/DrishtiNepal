"use client";

import {
  CheckCircle,
  XCircle,
  AlertCircle,
  CircleDashed,
  TrendingUp,
} from "lucide-react";

const STATUS_MAP: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; bgColor: string }
> = {
  completed: {
    icon: <CheckCircle size={16} />,
    label: "Completed",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  fulfilled: {
    icon: <CheckCircle size={16} />,
    label: "Fulfilled",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  in_progress: {
    icon: <TrendingUp size={16} />,
    label: "In Progress",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  partially_fulfilled: {
    icon: <TrendingUp size={16} />,
    label: "Partially Fulfilled",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  broken: {
    icon: <XCircle size={16} />,
    label: "Broken",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  contradicted: {
    icon: <AlertCircle size={16} />,
    label: "Contradicted",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  not_started: {
    icon: <CircleDashed size={16} />,
    label: "Not Started",
    color: "text-neutral-500",
    bgColor: "bg-neutral-100",
  },
};

export function StatusIndicator({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.not_started;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${s.bgColor} ${s.color}`}
    >
      {s.icon}
      <span>{s.label}</span>
    </div>
  );
}
