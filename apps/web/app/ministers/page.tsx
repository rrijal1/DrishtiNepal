import { MinisterCard } from "@/components/MinisterCard";
import { MinistrySelect } from "@/components/MinistrySelect";
import { getLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 300;

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title:
      locale === "en"
        ? "Cabinet Ministers — Drishti Nepal"
        : "मन्त्रिपरिषद्का सदस्यहरू — दृष्टि नेपाल",
    description:
      locale === "en"
        ? "Scorecard and profile for every minister in Nepal's current cabinet."
        : "नेपालको वर्तमान मन्त्रिपरिषद्का प्रत्येक मन्त्रीको स्कोरकार्ड र प्रोफाइल।",
  };
}

type FilterKey = "all" | "top" | "needs" | "ministry";

interface Props {
  searchParams: Promise<{ filter?: string; ministry?: string }>;
}

export default async function MinistersPage({ searchParams }: Props) {
  const locale = await getLocale();
  const params = await searchParams;
  const activeFilter = (params.filter as FilterKey) || "all";
  const selectedMinistry = params.ministry || "";

  const { data: allMinisters } = await supabase
    .from("ministers")
    .select("*")
    .eq("status", "active")
    .order("overall_score", { ascending: false });

  const ministers = allMinisters || [];

  // Apply filters
  let filtered = ministers;
  if (activeFilter === "top") {
    filtered = ministers.filter((m) => m.overall_score >= 60);
  } else if (activeFilter === "needs") {
    filtered = ministers.filter((m) => m.overall_score < 40);
  } else if (activeFilter === "ministry" && selectedMinistry) {
    filtered = ministers.filter((m) => m.portfolio_en === selectedMinistry);
  }

  // Collect unique ministries for the dropdown
  const ministries = [...new Set(ministers.map((m) => m.portfolio_en))].sort();

  const t = {
    title: locale === "en" ? "Cabinet Ministers" : "मन्त्रिपरिषद्का सदस्यहरू",
    subtitle:
      locale === "en"
        ? "Performance scorecards for every minister in Nepal's cabinet, ranked by overall accountability score."
        : "नेपालको मन्त्रिपरिषद्का प्रत्येक मन्त्रीको कार्यसम्पादन स्कोरकार्ड, समग्र जवाफदेहिता स्कोरको आधारमा श्रेणीबद्ध।",
    noData:
      locale === "en"
        ? "No minister data available yet. Agents are initializing…"
        : "मन्त्रीको विवरण उपलब्ध छैन। एजेन्टहरू सुरु हुँदैछन्...",
    noMatch:
      locale === "en"
        ? "No ministers match this filter."
        : "यो फिल्टरमा कुनै मन्त्री भेटिएन।",
    filters: {
      all: locale === "en" ? "All" : "सबै",
      top: locale === "en" ? "Top Performers" : "उत्कृष्ट प्रदर्शन",
      needs: locale === "en" ? "Needs Improvement" : "सुधार आवश्यक",
      ministry: locale === "en" ? "By Ministry" : "मन्त्रालय अनुसार",
    },
  };

  const filterEntries: { key: FilterKey; label: string }[] = [
    { key: "all", label: t.filters.all },
    { key: "top", label: t.filters.top },
    { key: "needs", label: t.filters.needs },
    { key: "ministry", label: t.filters.ministry },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">{t.title}</h1>
        <p className="mt-2 text-neutral-500">{t.subtitle}</p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filterEntries.map(({ key, label }) => (
          <Link
            key={key}
            href={key === "all" ? "/ministers" : `/ministers?filter=${key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeFilter === key
                ? "bg-blue-800 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {label}
          </Link>
        ))}

        {/* Ministry dropdown — shown when "By Ministry" is active */}
        {activeFilter === "ministry" && (
          <MinistrySelect ministries={ministries} selected={selectedMinistry} />
        )}
      </div>

      {ministers.length === 0 ? (
        <p className="py-20 text-center text-neutral-400">{t.noData}</p>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-neutral-400">{t.noMatch}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <MinisterCard key={m.id} minister={m} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
