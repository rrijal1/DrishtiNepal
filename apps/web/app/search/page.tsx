"use client";

import { ScoreBadge } from "@/components/ScoreBadge";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

interface SearchResult {
  type: "minister" | "manifesto" | "article";
  id: string;
  title: string;
  titleNp?: string;
  subtitle?: string;
  score?: number;
  status?: string;
  ai_generated?: boolean;
  href: string;
}

function TypeIcon({ type }: { type: SearchResult["type"] }) {
  if (type === "minister")
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0EA5E9]/10 text-blue-800 font-bold text-sm">
        म
      </span>
    );
  if (type === "manifesto")
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-sm">
        📋
      </span>
    );
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm">
      📰
    </span>
  );
}

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  minister: "Minister",
  manifesto: "Manifesto",
  article: "Article",
};

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQ) doSearch(initialQ);
  }, [initialQ, doSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(val ? `/search?q=${encodeURIComponent(val)}` : "/search", {
        scroll: false,
      });
      doSearch(val);
    }, 300);
  };

  const grouped = {
    minister: results.filter((r) => r.type === "minister"),
    manifesto: results.filter((r) => r.type === "manifesto"),
    article: results.filter((r) => r.type === "article"),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-neutral-800">Search</h1>

      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          autoFocus
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="Search ministers, manifesto commitments, articles…"
          className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-blue-800 focus:ring-2 focus:ring-[#0EA5E9]/10"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {searched && results.length === 0 && (
          <p className="py-12 text-center text-neutral-400">
            No results found for <strong>&quot;{query}&quot;</strong>
          </p>
        )}

        {(["minister", "manifesto", "article"] as const).map((type) => {
          const group = grouped[type];
          if (!group.length) return null;
          return (
            <div key={type} className="mb-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {TYPE_LABEL[type]}s
              </h2>
              <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {group.map((r) => (
                  <a
                    key={r.id}
                    href={r.href}
                    className="flex items-center gap-3 p-4 transition hover:bg-neutral-50"
                  >
                    <TypeIcon type={r.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-800">
                        {r.title}
                      </p>
                      {r.titleNp && (
                        <p className="truncate text-xs text-neutral-400 font-nepali">
                          {r.titleNp}
                        </p>
                      )}
                      {r.subtitle && (
                        <p className="mt-0.5 truncate text-xs text-neutral-500">
                          {r.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.ai_generated && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                          AI
                        </span>
                      )}
                      {r.score != null && (
                        <ScoreBadge score={r.score} size="sm" />
                      )}
                      {r.status && r.type === "manifesto" && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                          {r.status.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}

        {!searched && !loading && (
          <div className="mt-12 text-center text-neutral-400">
            <svg
              className="mx-auto mb-3 text-neutral-300"
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-sm">
              Search across ministers, manifesto commitments, and articles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}
