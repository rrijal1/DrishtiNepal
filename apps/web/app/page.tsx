import { HeroSection } from "@/components/HeroSection";
import { MinisterCard } from "@/components/MinisterCard";
import { getLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export const revalidate = 300; // ISR: revalidate every 5 min

const KARAR_AREAS = [
  {
    id: "pp-001",
    label: "Integrity & Governance",
    bpRange: [1, 18],
    color: "#1e40af",
  },
  {
    id: "pp-002",
    label: "Prosperous Middle-Class",
    bpRange: [19, 60],
    color: "#0f6b3b",
  },
  {
    id: "pp-003",
    label: "Jobs & Opportunity",
    bpRange: [61, 80],
    color: "#92400e",
  },
  {
    id: "pp-004",
    label: "Connected Nepal",
    bpRange: [81, 95],
    color: "#5b21b6",
  },
  {
    id: "pp-005",
    label: "Diaspora & Global Nepal",
    bpRange: [96, 100],
    color: "#b91c1c",
  },
];

export default async function HomePage() {
  const locale = await getLocale();

  const { data: ministers } = await supabase
    .from("ministers")
    .select("*")
    .eq("status", "active")
    .order("overall_score", { ascending: false })
    .limit(12);

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, title_en, title_np, slug, published_at, category")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  const { data: recentDecisions } = await supabase
    .from("cabinet_decisions")
    .select("id, title_en, title_np, decision_date, significance")
    .order("decision_date", { ascending: false })
    .limit(4);

  // Manifesto progress data
  const { data: manifestoItems } = await supabase
    .from("manifesto_items")
    .select("source_id, status")
    .like("source_id", "bp-%");

  const allItems = manifestoItems ?? [];
  const totalItems = allItems.length;
  const fulfilledItems = allItems.filter(
    (i) => i.status === "fulfilled" || i.status === "completed",
  ).length;
  const inProgressItems = allItems.filter(
    (i) => i.status === "in_progress" || i.status === "partially_fulfilled",
  ).length;
  const overallPct =
    totalItems > 0
      ? Math.round(
          ((fulfilledItems + inProgressItems * 0.5) / totalItems) * 100,
        )
      : 0;

  const areaStats = KARAR_AREAS.map((area) => {
    const items = allItems.filter((item) => {
      const match = item.source_id?.match(/^bp-(\d+)$/);
      if (!match) return false;
      const num = parseInt(match[1]);
      return num >= area.bpRange[0] && num <= area.bpRange[1];
    });
    const fulfilled = items.filter(
      (i) => i.status === "fulfilled" || i.status === "completed",
    ).length;
    const inProg = items.filter(
      (i) => i.status === "in_progress" || i.status === "partially_fulfilled",
    ).length;
    const pct =
      items.length > 0
        ? Math.round(((fulfilled + inProg * 0.5) / items.length) * 100)
        : 0;
    return { ...area, total: items.length, fulfilled, inProgress: inProg, pct };
  });

  const circumference = 2 * Math.PI * 42;

  return (
    <>
      {/* ─── Hero ─── */}
      <HeroSection ministersCount={ministers?.length ?? 15} locale={locale} />

      {/* ─── Manifesto Progress ─── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800 sm:text-3xl">
                {locale === "en" ? "Manifesto Progress" : "वाचा पत्र प्रगति"}
              </h2>
              <p className="mt-1 text-neutral-500">
                {locale === "en"
                  ? "How far Nepal has moved toward the 100 Bachha Patra commitments."
                  : "१०० वाचा पत्र प्रतिबद्धताहरूतर्फ नेपाल कति अगाडि बढेको छ।"}
              </p>
            </div>
            <a
              href="/manifesto"
              className="shrink-0 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-blue-800 hover:text-blue-800"
            >
              {locale === "en" ? "View all →" : "सबै हेर्नुहोस् →"}
            </a>
          </div>

          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start">
            {/* Ring chart */}
            <div className="flex shrink-0 flex-col items-center">
              <div className="relative">
                <svg
                  width="180"
                  height="180"
                  viewBox="0 0 100 100"
                  className="-rotate-90"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#1e40af"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(circumference * overallPct) / 100} ${circumference}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-neutral-800">
                    {overallPct}%
                  </span>
                  <span className="text-xs text-neutral-400">overall</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {fulfilledItems} fulfilled
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  {inProgressItems} in progress
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-neutral-200" />
                  {totalItems - fulfilledItems - inProgressItems} not started
                </span>
              </div>
            </div>

            {/* 5 priority area bars */}
            <div className="w-full space-y-5">
              {areaStats.map((area) => (
                <a key={area.id} href="/manifesto" className="group block">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                        {area.label}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {area.total} items
                      </span>
                    </div>
                    <span
                      className="shrink-0 text-sm font-bold"
                      style={{ color: area.color }}
                    >
                      {area.pct}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${area.pct}%`,
                        backgroundColor: area.color,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-neutral-400">
                    <span>{area.fulfilled} fulfilled</span>
                    <span>{area.inProgress} in progress</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Minister Grid ─── */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            title={
              locale === "en" ? "Cabinet Ministers" : "मन्त्रिपरिषद्का सदस्यहरू"
            }
            subtitle={
              locale === "en"
                ? "Current scorecard for every minister in the Ra Swa Pa cabinet."
                : "रास्वपा क्याबिनेटका प्रत्येक मन्त्रीको हालको स्कोरकार्ड।"
            }
            href="/ministers"
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ministers?.map((m) => (
              <MinisterCard key={m.id} minister={m} locale={locale} />
            )) ?? (
              <p className="col-span-full text-center text-neutral-400">
                No ministers loaded yet. Check back soon.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── Cabinet Decisions · compact strip ─── */}
      <section className="border-y border-neutral-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {locale === "en" ? "Cabinet" : "क्याबिनेट"}
            </span>
            {recentDecisions?.length ? (
              recentDecisions.map((d) => (
                <a
                  key={d.id}
                  href="/decisions"
                  className="group flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 transition hover:border-[#0EA5E9]/40 hover:text-blue-800"
                >
                  <SignificanceBadge level={d.significance} locale={locale} />
                  <span className="max-w-[20rem] truncate group-hover:text-blue-800">
                    {locale === "en" ? d.title_en : d.title_np || d.title_en}
                  </span>
                  <span className="shrink-0 text-[11px] text-neutral-400">
                    {new Date(d.decision_date).toLocaleDateString(
                      locale === "en" ? "en-US" : "ne-NP",
                      { month: "short", day: "numeric" },
                    )}
                  </span>
                </a>
              ))
            ) : (
              <span className="text-sm text-neutral-400">
                {locale === "en" ? "No decisions yet." : "कुनै निर्णय छैन।"}
              </span>
            )}
            <a
              href="/decisions"
              className="ml-auto shrink-0 text-xs font-medium text-blue-800 transition hover:underline"
            >
              {locale === "en" ? "View all →" : "सबै →"}
            </a>
          </div>
        </div>
      </section>

      {/* ─── Recent Analysis · compact row ─── */}
      {recentPosts && recentPosts.length > 0 && (
        <section className="border-b border-neutral-100 bg-gray-50 py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {locale === "en" ? "Latest Analysis" : "ताजा विश्लेषण"}
              </span>
              <a
                href="/articles"
                className="text-xs font-medium text-blue-800 transition hover:underline"
              >
                {locale === "en" ? "View all →" : "सबै →"}
              </a>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
              {recentPosts.map((p) => (
                <a
                  key={p.id}
                  href={`/articles/${p.slug}`}
                  className="group flex items-start gap-2.5"
                >
                  <span className="mt-0.5 shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                    {p.category}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-neutral-700 group-hover:text-blue-800">
                      {locale === "en" ? p.title_en : p.title_np || p.title_en}
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {new Date(p.published_at).toLocaleDateString(
                        locale === "en" ? "en-US" : "ne-NP",
                        { month: "short", day: "numeric" },
                      )}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── How it works ─── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-800 sm:text-3xl">
              {locale === "en"
                ? "How Drishti Nepal Works"
                : "दृष्टि नेपालले कसरी काम गर्छ?"}
            </h2>
            <p className="mt-2 text-neutral-500">
              {locale === "en"
                ? "Fully transparent, autonomous political accountability pipeline."
                : "पूर्ण पारदर्शी, स्वायत्त राजनीतिक जवाफदेहिता पाइपलाइन।"}
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <HowStep
              step="01"
              title={locale === "en" ? "Monitor 24/7" : "२४/७ निगरानी"}
              desc={
                locale === "en"
                  ? "AI agents scrape 20+ Nepali & English news sources and government portals every 30 minutes."
                  : "AI एजेन्टहरूले प्रत्येक ३० मिनेटमा २० भन्दा बढी नेपाली र अंग्रेजी समाचार स्रोतहरू र सरकारी पोर्टलहरू स्क्रेप गर्छन्।"
              }
            />
            <HowStep
              step="02"
              title={
                locale === "en"
                  ? "Extract & Match"
                  : "निकाल्नुहोस् र मिलाउनुहोस्"
              }
              desc={
                locale === "en"
                  ? "Political actions are extracted and matched against Ra Swa Pa's bachha patra and karar patra commitments."
                  : "राजनीतिक कार्यहरू निकालिन्छन् र रास्वपाको वाचा पत्र र करार पत्रका प्रतिबद्धताहरूसँग मिलाइन्छन्।"
              }
            />
            <HowStep
              step="03"
              title={locale === "en" ? "Score" : "स्कोर"}
              desc={
                locale === "en"
                  ? "वाचा पालन — ministers receive outcome-based scores measuring real-world progress toward manifesto targets. No credit for intent."
                  : "वाचा पालन — मन्त्रीहरूले वाचा पत्रका लक्ष्यहरूतर्फ वास्तविक प्रगतिको आधारमा स्कोर प्राप्त गर्छन्।"
              }
            />
            <HowStep
              step="04"
              title={locale === "en" ? "Publish" : "प्रकाशन"}
              desc={
                locale === "en"
                  ? "Bilingual reports auto-publish to web, Facebook, and X. Citizens can submit evidence via PRs."
                  : "द्विभाषी रिपोर्टहरू वेब, फेसबुक र एक्समा स्वतः प्रकाशित हुन्छन्। नागरिकहरूले प्रमाण पेश गर्न सक्छन्।"
              }
            />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-blue-800 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              {locale === "en"
                ? "Democracy Needs Your Eyes"
                : "लोकतन्त्रलाई तपाईंको आँखा चाहिन्छ"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-100/70">
              {locale === "en"
                ? "Have evidence of a minister's actions? Found an error in our data? Contribute to a more accountable Nepal."
                : "मन्त्रीका कार्यहरूको प्रमाण छ? हाम्रो डाटामा त्रुटि फेला पार्नुभयो? अझ बढी जवाफदेही नेपालका लागि योगदान गर्नुहोस्।"}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/submit"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-800 transition hover:bg-neutral-100"
              >
                {locale === "en" ? "Submit Evidence" : "प्रमाण पेश गर्नुहोस्"}
              </a>
              <a
                href="https://github.com/rrijal1/DrishtiNepal"
                className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {locale === "en"
                  ? "Contribute on GitHub"
                  : "GitHub मा योगदान गर्नुहोस्"}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Small helper components ── */

function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 text-neutral-500">{subtitle}</p>
      </div>
      <a
        href={href}
        className="hidden text-sm font-medium text-blue-800 transition hover:underline sm:block"
      >
        View all →
      </a>
    </div>
  );
}

function HowStep({
  step,
  title,
  desc,
}: {
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0EA5E9]/10 text-lg font-bold text-blue-800">
        {step}
      </div>
      <h3 className="mt-4 font-semibold text-neutral-800">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500">{desc}</p>
    </div>
  );
}

function SignificanceBadge({
  level,
  locale,
}: {
  level: string;
  locale: string;
}) {
  const colors: Record<string, string> = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-green-50 text-green-700",
  };

  const labels: Record<string, Record<string, string>> = {
    en: { high: "High", medium: "Medium", low: "Low" },
    np: { high: "उच्च", medium: "मध्यम", low: "न्यून" },
  };

  return (
    <span
      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[level] ?? "bg-neutral-100 text-neutral-600"}`}
    >
      {labels[locale]?.[level] ?? level}
    </span>
  );
}
