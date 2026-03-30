import { MinisterCard } from "@/components/MinisterCard";
import { supabase } from "@/lib/supabase";
import { getLocale, translations } from "@/lib/i18n";

export const revalidate = 300; // ISR: revalidate every 5 min

export default async function HomePage() {
  const locale = await getLocale();
  const t = translations[locale].home;

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
    .limit(6);

  const { data: recentDecisions } = await supabase
    .from("cabinet_decisions")
    .select("id, title_en, title_np, decision_date, significance")
    .order("decision_date", { ascending: false })
    .limit(4);

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#2a4a73] to-[#1a2f4a]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-blue-200/80">
              AI-Powered Government Accountability
            </p>
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              {t.heroTitle}
              <br />
              <span className="text-red-400">{t.heroSubtitle}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-blue-100/80">
              {t.heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/ministers"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#1e3a5f] shadow-lg transition hover:bg-neutral-100"
              >
                {t.viewMinisters}
              </a>
              <a
                href="/scores"
                className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                {t.scoreDashboard}
              </a>
            </div>
          </div>

          {/* Live stat pills */}
          <div className="mt-12 flex flex-wrap gap-4">
            <StatPill
              label={t.ministersTracked}
              value={ministers?.length ?? 0}
            />
            <StatPill
              label={t.postsPublished}
              value={recentPosts?.length ?? 0}
              suffix="+"
            />
            <StatPill label={t.sourcesMonitored} value={20} />
          </div>
        </div>
      </section>

      {/* ─── Minister Grid ─── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title={locale === "en" ? "Cabinet Ministers" : "मन्त्रिपरिषद्का सदस्यहरू"}
          subtitle={locale === "en" ? "Current scorecard for every minister in the Ra Swa Pa cabinet." : "रास्वपा क्याबिनेटका प्रत्येक मन्त्रीको हालको स्कोरकार्ड।"}
          href="/ministers"
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ministers?.map((m) => <MinisterCard key={m.id} minister={m} locale={locale} />) ?? (
            <p className="col-span-full text-center text-neutral-400">
              No ministers loaded yet. Check back soon.
            </p>
          )}
        </div>
      </section>

      {/* ─── Recent Decisions ─── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            title={locale === "en" ? "Latest Cabinet Decisions" : "पछिल्ला क्याबिनेट निर्णयहरू"}
            subtitle={locale === "en" ? "Major government decisions and their impact on manifesto commitments." : "प्रमुख सरकारी निर्णयहरू र वाचा पत्रका प्रतिबद्धताहरूमा उनीहरूको प्रभाव।"}
            href="/decisions"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {recentDecisions?.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-neutral-200 p-5 transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-neutral-800">
                      {locale === "en" ? d.title_en : (d.title_np || d.title_en)}
                    </h3>
                    {locale === "en" && d.title_np && (
                      <p className="mt-0.5 text-sm text-neutral-400 font-nepali">
                        {d.title_np}
                      </p>
                    )}
                  </div>
                  <SignificanceBadge level={d.significance} locale={locale} />
                </div>
                <p className="mt-2 text-xs text-neutral-400">
                  {new Date(d.decision_date).toLocaleDateString(locale === "en" ? "en-US" : "ne-NP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )) ?? (
              <p className="col-span-full text-center text-neutral-400">
                No decisions tracked yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── Recent Posts ─── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title={locale === "en" ? "Recent Analysis" : "हालैका विश्लेषणहरू"}
          subtitle={locale === "en" ? "AI-generated and human-reviewed accountability reports." : "AI द्वारा उत्पन्न र मानव-समीक्षा गरिएका जवाफदेहिता रिपोर्टहरू।"}
          href="/articles"
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recentPosts?.map((p) => (
            <a
              key={p.id}
              href={`/articles/${p.slug}`}
              className="group rounded-xl border border-neutral-200 p-5 transition hover:border-[#1e3a5f]/30 hover:shadow-md"
            >
              <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#1e3a5f]">
                {p.category}
              </span>
              <h3 className="mt-3 font-semibold text-neutral-800 group-hover:text-[#1e3a5f]">
                {locale === "en" ? p.title_en : (p.title_np || p.title_en)}
              </h3>
              {locale === "en" && p.title_np && (
                <p className="mt-1 text-sm text-neutral-400 font-nepali">
                  {p.title_np}
                </p>
              )}
              <p className="mt-3 text-xs text-neutral-400">
                {new Date(p.published_at).toLocaleDateString(locale === "en" ? "en-US" : "ne-NP", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </a>
          )) ?? (
            <p className="col-span-full text-center text-neutral-400">
              No articles published yet. Agents are initializing…
            </p>
          )}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-800 sm:text-3xl">
              {locale === "en" ? "How Drishti Nepal Works" : "दृष्टि नेपालले कसरी काम गर्छ?"}
            </h2>
            <p className="mt-2 text-neutral-500">
              {locale === "en" ? "Fully transparent, autonomous political accountability pipeline." : "पूर्ण पारदर्शी, स्वायत्त राजनीतिक जवाफदेहिता पाइपलाइन।"}
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <HowStep
              step="01"
              title={locale === "en" ? "Monitor 24/7" : "२४/७ निगरानी"}
              desc={locale === "en" ? "AI agents scrape 20+ Nepali & English news sources and government portals every 30 minutes." : "AI एजेन्टहरूले प्रत्येक ३० मिनेटमा २० भन्दा बढी नेपाली र अंग्रेजी समाचार स्रोतहरू र सरकारी पोर्टलहरू स्क्रेप गर्छन्।"}
            />
            <HowStep
              step="02"
              title={locale === "en" ? "Extract & Match" : "निकाल्नुहोस् र मिलाउनुहोस्"}
              desc={locale === "en" ? "Political actions are extracted and matched against Ra Swa Pa's bachha patra and karar patra commitments." : "राजनीतिक कार्यहरू निकालिन्छन् र रास्वपाको वाचा पत्र र करार पत्रका प्रतिबद्धताहरूसँग मिलाइन्छन्।"}
            />
            <HowStep
              step="03"
              title={locale === "en" ? "Score" : "स्कोर"}
              desc={locale === "en" ? "वाचा पालन — ministers receive transparent scores based on manifesto compliance and public accountability." : "वाचा पालन — मन्त्रीहरूले वाचा पत्रको पालना र सार्वजनिक जवाफदेहिताको आधारमा पारदर्शी स्कोर प्राप्त गर्छन्।"}
            />
            <HowStep
              step="04"
              title={locale === "en" ? "Publish" : "प्रकाशन"}
              desc={locale === "en" ? "Bilingual reports auto-publish to web, Facebook, and X. Citizens can submit evidence via PRs." : "द्विभाषी रिपोर्टहरू वेब, फेसबुक र एक्समा स्वतः प्रकाशित हुन्छन्। नागरिकहरूले प्रमाण पेश गर्न सक्छन्।"}
            />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#1e3a5f] p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {locale === "en" ? "Democracy Needs Your Eyes" : "लोकतन्त्रलाई तपाईंको आँखा चाहिन्छ"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100/70">
            {locale === "en" ? "Have evidence of a minister's actions? Found an error in our data? Contribute to a more accountable Nepal." : "मन्त्रीका कार्यहरूको प्रमाण छ? हाम्रो डाटामा त्रुटि फेला पार्नुभयो? अझ बढी जवाफदेही नेपालका लागि योगदान गर्नुहोस्।"}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/submit"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#1e3a5f] transition hover:bg-neutral-100"
            >
              {locale === "en" ? "Submit Evidence" : "प्रमाण पेश गर्नुहोस्"}
            </a>
            <a
              href="https://github.com/rrijal1/DrishtiNepal"
              className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              {locale === "en" ? "Contribute on GitHub" : "GitHub मा योगदान गर्नुहोस्"}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Small helper components ── */

function StatPill({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
      <span className="text-lg font-bold text-white">
        {value}
        {suffix}
      </span>
      <span className="text-xs text-blue-200/70">{label}</span>
    </div>
  );
}

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
        className="hidden text-sm font-medium text-[#1e3a5f] transition hover:underline sm:block"
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
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f]/10 text-lg font-bold text-[#1e3a5f]">
        {step}
      </div>
      <h3 className="mt-4 font-semibold text-neutral-800">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500">{desc}</p>
    </div>
  );
}

function SignificanceBadge({ level, locale }: { level: string; locale: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-green-50 text-green-700",
  };
  
  const labels: Record<string, Record<string, string>> = {
    en: { high: "High", medium: "Medium", low: "Low" },
    np: { high: "उच्च", medium: "मध्यम", low: "न्यून" }
  };

  return (
    <span
      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[level] ?? "bg-neutral-100 text-neutral-600"}`}
    >
      {labels[locale]?.[level] ?? level}
    </span>
  );
}
