import { MinisterCard } from "@/components/MinisterCard";
import { supabase } from "@/lib/supabase";
import { getLocale } from "@/lib/i18n";

export const revalidate = 300;

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title: locale === "en" ? "Cabinet Ministers — Drishti Nepal" : "मन्त्रिपरिषद्का सदस्यहरू — दृष्टि नेपाल",
    description: locale === "en" 
      ? "Scorecard and profile for every minister in Nepal's current cabinet."
      : "नेपालको वर्तमान मन्त्रिपरिषद्का प्रत्येक मन्त्रीको स्कोरकार्ड र प्रोफाइल।",
  };
}

export default async function MinistersPage() {
  const locale = await getLocale();
  
  const { data: ministers } = await supabase
    .from("ministers")
    .select("*")
    .eq("status", "active")
    .order("overall_score", { ascending: false });

  const t = {
    title: locale === "en" ? "Cabinet Ministers" : "मन्त्रिपरिषद्का सदस्यहरू",
    subtitle: locale === "en" 
      ? "Performance scorecards for every minister in Nepal's cabinet, ranked by overall accountability score."
      : "नेपालको मन्त्रिपरिषद्का प्रत्येक मन्त्रीको कार्यसम्पादन स्कोरकार्ड, समग्र जवाफदेहिता स्कोरको आधारमा श्रेणीबद्ध।",
    noData: locale === "en" ? "No minister data available yet. Agents are initializing…" : "मन्त्रीको विवरण उपलब्ध छैन। एजेन्टहरू सुरु हुँदैछन्...",
    filters: {
      all: locale === "en" ? "All" : "सबै",
      top: locale === "en" ? "Top Performers" : "उत्कृष्ट प्रदर्शन",
      needs: locale === "en" ? "Needs Improvement" : "सुधार आवश्यक",
      ministry: locale === "en" ? "By Ministry" : "मन्त्रालय अनुसार",
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">
          {t.title}
        </h1>
        <p className="mt-2 text-neutral-500">
          {t.subtitle}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterPill label={t.filters.all} active />
        <FilterPill label={t.filters.top} />
        <FilterPill label={t.filters.needs} />
        <FilterPill label={t.filters.ministry} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ministers?.map((m) => <MinisterCard key={m.id} minister={m} locale={locale} />) ?? (
          <p className="col-span-full py-20 text-center text-neutral-400">
            {t.noData}
          </p>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-[#1e3a5f] text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {label}
    </button>
  );
}
