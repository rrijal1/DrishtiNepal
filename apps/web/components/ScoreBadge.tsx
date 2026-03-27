import clsx from "clsx";

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const label = getScoreLabel(score);
  const color = getScoreColor(score);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  return (
    <div
      className={clsx(
        "flex flex-shrink-0 items-center justify-center rounded-full font-bold",
        sizeClasses[size],
        color,
      )}
      title={`Score: ${score}/100 — ${label}`}
    >
      {score > 0 ? score : "—"}
    </div>
  );
}

export function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = getBarColor(score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-neutral-600">{label}</span>
        <span className="font-semibold text-neutral-800">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={clsx("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-blue-100 text-blue-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  if (score >= 20) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

function getBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Average";
  if (score >= 20) return "Below Average";
  return "Failing";
}
