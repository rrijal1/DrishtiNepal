import { MinisterCard } from "@/components/MinisterCard";
import { supabase } from "@/lib/supabase";

export const revalidate = 300; // ISR: revalidate every 5 min

export default async function HomePage() {
  const { data: ministers } = await supabase
    .from("ministers")
    .select("*")
    .eq("is_active", true)
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
              Tracking Every Promise.
              <br />
              <span className="text-red-400">Every Decision.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-blue-100/80">
              Drishti Nepal monitors cabinet ministers 24/7 — matching their
              actions against their election manifestos so citizens can see who
              delivers and who doesn&apos;t.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/ministers"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#1e3a5f] shadow-lg transition hover:bg-neutral-100"
              >
                View Ministers →
              </a>
              <a
                href="/scores"
                className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Score Dashboard
              </a>
            </div>
          </div>

          {/* Live stat pills */}
          <div className="mt-12 flex flex-wrap gap-4">
            <StatPill
              label="Ministers Tracked"
              value={ministers?.length ?? 0}
            />
            <StatPill
              label="Posts Published"
              value={recentPosts?.length ?? 0}
              suffix="+"
            />
            <StatPill label="Sources Monitored" value={20} />
          </div>
        </div>
      </section>

      {/* ─── Minister Grid ─── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          title="Cabinet Ministers"
          subtitle="Current scorecard for every minister in the Ra Swa Pa cabinet."
          href="/ministers"
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ministers?.map((m) => <MinisterCard key={m.id} minister={m} />) ?? (
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
            title="Latest Cabinet Decisions"
            subtitle="Major government decisions and their impact on manifesto commitments."
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
                      {d.title_en}
                    </h3>
                    {d.title_np && (
                      <p className="mt-0.5 text-sm text-neutral-400 font-nepali">
                        {d.title_np}
                      </p>
                    )}
                  </div>
                  <SignificanceBadge level={d.significance} />
                </div>
                <p className="mt-2 text-xs text-neutral-400">
                  {new Date(d.decision_date).toLocaleDateString("en-US", {
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
          title="Recent Analysis"
          subtitle="AI-generated and human-reviewed accountability reports."
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
                {p.title_en}
              </h3>
              {p.title_np && (
                <p className="mt-1 text-sm text-neutral-400 font-nepali">
                  {p.title_np}
                </p>
              )}
              <p className="mt-3 text-xs text-neutral-400">
                {new Date(p.published_at).toLocaleDateString("en-US", {
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
              How Drishti Nepal Works
            </h2>
            <p className="mt-2 text-neutral-500">
              Fully transparent, autonomous political accountability pipeline.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <HowStep
              step="01"
              title="Monitor 24/7"
              desc="AI agents scrape 20+ Nepali & English news sources and government portals every 30 minutes."
            />
            <HowStep
              step="02"
              title="Extract & Match"
              desc="Political actions are extracted and matched against Ra Swa Pa's bachha patra and pratigya patra commitments."
            />
            <HowStep
              step="03"
              title="Score"
              desc="Ministers receive transparent scores across 6 dimensions: compliance, effectiveness, transparency, fiscal prudence, sentiment, and parliamentary activity."
            />
            <HowStep
              step="04"
              title="Publish"
              desc="Bilingual reports auto-publish to web, Facebook, and X. Citizens can submit evidence via PRs."
            />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#1e3a5f] p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Democracy Needs Your Eyes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100/70">
            Have evidence of a minister&apos;s actions? Found an error in our
            data? Contribute to a more accountable Nepal.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/submit"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#1e3a5f] transition hover:bg-neutral-100"
            >
              Submit Evidence
            </a>
            <a
              href="https://github.com/rrijal1/DrishtiNepal"
              className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Contribute on GitHub
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

function SignificanceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-green-50 text-green-700",
  };
  return (
    <span
      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[level] ?? "bg-neutral-100 text-neutral-600"}`}
    >
      {level}
    </span>
  );
}
