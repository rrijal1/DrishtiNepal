import clsx from "clsx";
import { ScoreBadge } from "./ScoreBadge";

interface Minister {
  id: string;
  name_en: string;
  name_np: string;
  portfolio_en: string;
  portfolio_np?: string;
  photo_url?: string;
  party: string;
  overall_score: number;
}

export function MinisterCard({ minister, locale = "en" }: { minister: Minister; locale?: string }) {
  const m = minister;
  const name = locale === "en" ? m.name_en : (m.name_np || m.name_en);
  const portfolio = locale === "en" ? m.portfolio_en : (m.portfolio_np || m.portfolio_en);
  
  return (
    <a
      href={`/ministers/${m.id}`}
      className="group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-[#1e3a5f]/30 hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-100">
          {m.photo_url ? (
            <img
              src={m.photo_url}
              alt={m.name_en}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-neutral-300">
              {m.name_en.charAt(0)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-neutral-800 group-hover:text-[#1e3a5f]">
            {name}
          </h3>
          {locale === "en" && (
            <p className="truncate text-sm text-neutral-400 font-nepali">
              {m.name_np}
            </p>
          )}
          <p className={clsx("mt-1 truncate text-xs text-neutral-500", locale === "np" && "font-nepali")}>
            {portfolio}
          </p>
        </div>

        {/* Score */}
        <ScoreBadge score={m.overall_score} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="rounded-full bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
          {m.party}
        </span>
        <span className="text-xs font-medium text-[#1e3a5f] opacity-0 transition group-hover:opacity-100">
          {locale === "en" ? "View Profile →" : "प्रोफाइल हेर्नुहोस् →"}
        </span>
      </div>
    </a>
  );
}

