export const metadata = {
  title: "Scoring Methodology — Drishti Nepal",
  description:
    "How Drishti Nepal calculates ministerial accountability scores. Outcome-only, open source, peer-reviewable. v1.0",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-neutral-800">
        Scoring Methodology
      </h1>
      <p className="mt-2 text-neutral-500">
        How Drishti Nepal calculates ministerial accountability scores.{" "}
        <span className="font-medium text-neutral-700">
          Version 1.0 — April 2026
        </span>{" "}
        — fully open source and peer-reviewable.
      </p>

      <div className="prose prose-neutral mt-10 max-w-none">
        {/* ── Philosophy ─────────────────────────────────────────── */}
        <h2>वाचा पालन — Electoral Accountability</h2>
        <p>
          Drishti Nepal exists to answer one question:{" "}
          <strong>did the government honor its vacha (वाचा)?</strong> The Bachha
          Patra and Karar Patra are commitment charters signed with the people.
          We translate those specific, measurable promises into verifiable
          outcome indicators and watch whether Nepal is actually moving toward
          them. No editorializing, no opinion — just the gap between{" "}
          <em>भनाइ</em> (rhetoric) and <em>गराइ</em> (action).
        </p>
        <ul>
          <li>
            A minister <em>reaffirming</em> a commitment is <strong>not</strong>{" "}
            delivery.
          </li>
          <li>
            A bill <em>introduced</em> is motion; a bill{" "}
            <em>passed and implemented</em> with measurable results is delivery.
          </li>
          <li>
            A budget <em>announced</em> is intent; a real-world improvement in
            the indicator is delivery.
          </li>
          <li>
            <strong>No credit for intent — only verifiable outcomes.</strong>
          </li>
        </ul>
        <p>
          The worst case this system must catch: all 100 government action items
          marked &quot;done&quot;, and yet GDP per capita falls. That is a
          failure — and the score will say so regardless of how busy the
          government appeared.
        </p>

        {/* ── What the score is ───────────────────────────────────── */}
        <h2>The Score — Outcome Progress Only</h2>
        <p>
          Each minister receives a single score from <strong>0 to 100</strong>.
          The score represents <strong>weighted progress</strong> toward the
          manifesto&apos;s measurable targets across the outcome indicators
          linked to that minister&apos;s portfolio.{" "}
          <strong>
            There are no separate weighted tiers contributing to the number.
          </strong>{" "}
          If real-world outcomes are not improving, the score falls — regardless
          of how many initiatives have been launched.
        </p>
        <p>Scores are recalculated as new indicator data arrives.</p>

        {/* ── From Manifesto to Indicators ────────────────────────── */}
        <h2>From Manifesto Promises to Measurable Indicators</h2>
        <p>
          Each of the 100 Bachha Patra items is translated into one or more
          concrete, measurable indicators. This is the hardest and most
          important work in the project — if an indicator is wrong, the score is
          wrong.
        </p>
        <p>
          Every indicator has four required values set at government formation
          (March 2026):
        </p>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Meaning</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>baseline</code>
              </td>
              <td>Value at government formation</td>
              <td>$1,500 GDP per capita</td>
            </tr>
            <tr>
              <td>
                <code>target</code>
              </td>
              <td>Manifesto commitment (5-year)</td>
              <td>$3,000 GDP per capita</td>
            </tr>
            <tr>
              <td>
                <code>current</code>
              </td>
              <td>Latest verified value</td>
              <td>$1,700 (April 2026)</td>
            </tr>
            <tr>
              <td>
                <code>direction</code>
              </td>
              <td>Which way is improvement?</td>
              <td>higher is better / lower is better</td>
            </tr>
            <tr>
              <td>
                <code>weight</code>
              </td>
              <td>Relative importance (1–100 scale)</td>
              <td>GDP per capita = 10, road km = 3</td>
            </tr>
          </tbody>
        </table>
        <p>
          Indicator weights are community-agreed and version-controlled.
          Strategically critical commitments (e.g. GDP per capita, poverty
          headcount) carry higher weights than secondary infrastructure metrics.
          Weight changes require a public discussion and editor consensus — the
          same process as a methodology change.
        </p>

        {/* ── Score Formula ───────────────────────────────────────── */}
        <h2>Score Formula</h2>
        <p>
          Progress for each indicator is the fraction of the journey from
          baseline to target that has been completed:
        </p>
        <div className="rounded-lg bg-neutral-100 p-4 font-mono text-sm leading-relaxed">
          <div>
            <span className="text-neutral-500">{"// higher-is-better:"}</span>
          </div>
          <div>progress = (current − baseline) ÷ (target − baseline)</div>
          <div className="mt-2">
            <span className="text-neutral-500">{"// lower-is-better:"}</span>
          </div>
          <div>progress = (baseline − current) ÷ (baseline − target)</div>
          <div className="mt-3 border-t border-neutral-200 pt-3">
            <span className="text-neutral-500">
              {"// clamped 0 → 1, then:"}
            </span>
          </div>
          <div className="mt-1">
            minister_score = Σ(weight_i × progress_i) ÷ Σ(weight_i) × 100
          </div>
        </div>
        <p className="mt-4">
          <strong>Example — GDP per capita:</strong>
        </p>
        <ul>
          <li>Baseline (March 2026): $1,500</li>
          <li>Target (5-year manifesto): $3,000 → gap to close: $1,500</li>
          <li>April 2026 value: $1,700 → progress = 200 ÷ 1,500 = 13.3%</li>
          <li>If it later rises to $2,000 → progress = 500 ÷ 1,500 = 33.3%</li>
          <li>
            If it then falls back to $1,800 → progress = 300 ÷ 1,500 = 20%
          </li>
        </ul>
        <p>
          The score moves with reality. A drop in any indicator immediately
          lowers the score, even if the number of &quot;completed&quot;
          government initiatives remains unchanged.
        </p>

        {/* ── Minister Attribution ────────────────────────────────── */}
        <h2>Minister Attribution</h2>
        <p>
          Each outcome indicator is tagged to one or more ministries based on
          the portfolio responsible for that manifesto commitment. A
          minister&apos;s score is the weighted average progress of all
          indicators tagged to their portfolio.
        </p>
        <p>
          When an indicator spans multiple portfolios (e.g. poverty rate touches
          Finance, Labour, and Health), each responsible minister carries it.
          This means ministers are held accountable for outcomes they share
          custody of — not just their siloed department.
        </p>
        <p>
          Attribution assignments are public and can be challenged via GitHub
          issue.
        </p>

        {/* ── Activity Tracker ────────────────────────────────────── */}
        <h2>Activity Tracker — What We Track But Do Not Score</h2>
        <p>
          Government initiatives — gazette decisions, bills, budget
          disbursements, policy announcements — are tracked against each
          manifesto item. Each initiative is assigned a status:
        </p>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fulfilled</td>
              <td>Completed and outcomes expected to follow</td>
            </tr>
            <tr>
              <td>In Progress</td>
              <td>Actively being executed</td>
            </tr>
            <tr>
              <td>Not Started</td>
              <td>No government action recorded yet</td>
            </tr>
            <tr>
              <td>Stalled</td>
              <td>Began but halted without completion</td>
            </tr>
          </tbody>
        </table>
        <p>
          This count is <strong>displayed prominently</strong> on each manifesto
          item page — &quot;12 completed · 4 in progress · 3 not started&quot; —
          but it <strong>does not contribute to the score</strong>. A government
          that completes all initiatives but fails to improve real-world
          outcomes will still score low.
        </p>
        <p>
          Sources: Nepal Gazette (Rajpatra), cabinet decisions, Parliamentary
          records, verified news.
        </p>

        {/* ── Editorial Context ────────────────────────────────────── */}
        <h2>Editorial Context — Evidence and Analysis</h2>
        <p>
          Each manifesto item page includes scholarly articles and policy
          analysis drawn from peer-reviewed research, World Bank evaluations,
          OECD evidence, and Nepal-specific studies. This context helps readers
          understand <em>why</em> indicators are moving (or not) and flags
          policies that international evidence suggests are unlikely to work.
        </p>
        <p>
          Editorial content <strong>does not affect the numerical score</strong>
          . The score is derived only from verifiable outcome data.
        </p>
        <p>
          AI agents draft assessments; community editors and domain experts
          review and approve before publication.
        </p>

        {/* ── Manifesto Item Pages ─────────────────────────────────── */}
        <h2>Manifesto Item Pages</h2>
        <p>
          Every one of the 100 Bachha Patra items has a dedicated page showing:
        </p>
        <ul>
          <li>
            <strong>Outcome indicators</strong> — charts tracking progress over
            time from baseline toward target
          </li>
          <li>
            <strong>Government initiatives</strong> — what the government has
            promised or done under this item
          </li>
          <li>
            <strong>Scholarly articles</strong> — evidence and analysis from
            researchers and editors
          </li>
          <li>
            <strong>Responsible ministers</strong> — who is accountable for
            delivery
          </li>
        </ul>
        <p>
          These pages are the primary unit of accountability. The minister score
          rolls up from them — not the other way around.
        </p>

        {/* ── Governance ──────────────────────────────────────────── */}
        <h2>Scoring Governance</h2>
        <table>
          <thead>
            <tr>
              <th>Decision</th>
              <th>Who Decides</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Outcome indicator data updates</td>
              <td>
                AI auto-publishes from verified sources (NRB, CBS, World Bank,
                IMF)
              </td>
            </tr>
            <tr>
              <td>Indicator baseline and target values</td>
              <td>Community-agreed; published in open data files</td>
            </tr>
            <tr>
              <td>Indicator weights</td>
              <td>Community discussion → editor consensus; versioned</td>
            </tr>
            <tr>
              <td>Initiative status updates</td>
              <td>AI extracts from gazette/news; moderators verify</td>
            </tr>
            <tr>
              <td>Editorial articles and analysis</td>
              <td>AI drafts; community editors + domain experts approve</td>
            </tr>
            <tr>
              <td>Methodology changes</td>
              <td>Public discussion (min 7 days) → editor consensus</td>
            </tr>
          </tbody>
        </table>

        {/* ── Score Labels ─────────────────────────────────────────── */}
        <h2>Score Labels</h2>
        <table>
          <thead>
            <tr>
              <th>Range</th>
              <th>Label</th>
              <th>Color</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>80–100</td>
              <td>Excellent</td>
              <td className="text-emerald-600 font-medium">Green</td>
            </tr>
            <tr>
              <td>60–79</td>
              <td>Good</td>
              <td className="text-blue-600 font-medium">Blue</td>
            </tr>
            <tr>
              <td>40–59</td>
              <td>Average</td>
              <td className="text-amber-600 font-medium">Amber</td>
            </tr>
            <tr>
              <td>20–39</td>
              <td>Below Average</td>
              <td className="text-orange-600 font-medium">Orange</td>
            </tr>
            <tr>
              <td>0–19</td>
              <td>Failing</td>
              <td className="text-red-600 font-medium">Red</td>
            </tr>
          </tbody>
        </table>

        {/* ── Data Integrity ──────────────────────────────────────── */}
        <h2>Data Integrity</h2>
        <ul>
          <li>
            All outcome data is sourced from authoritative, named institutions:
            NRB, CBS, World Bank, IMF, TI, ILO, NEA, DoFE, NTA
          </li>
          <li>Every data point links to its source URL and publication date</li>
          <li>
            AI extractions are confidence-scored; low-confidence items require
            human review before publication
          </li>
          <li>
            Score history is preserved — no retroactive changes to past scores
          </li>
          <li>
            Methodology and weight changes are versioned, announced publicly,
            and applied transparently
          </li>
          <li>
            No data is ever silently deleted — corrections are made with visible
            edit notices
          </li>
        </ul>

        {/* ── Version History ─────────────────────────────────────── */}
        <h2>Version History</h2>
        <ul>
          <li>
            <strong>v1.0</strong> (April 2026) — Outcome-only model. Score =
            weighted average progress across manifesto-derived indicators tagged
            to each ministry. Initiatives and evidence tracked and displayed but
            do not contribute to the numerical score.
          </li>
        </ul>

        {/* ── Peer Review ─────────────────────────────────────────── */}
        <h2>Peer Review</h2>
        <p>
          This methodology is entirely open to challenge. The indicator
          definitions, baseline values, targets, and weights are all public. If
          you believe an indicator is wrong, a target is unrealistic, or a
          weight is unfair, please{" "}
          <a href="https://github.com/rrijal1/DrishtiNepal/issues">
            open a GitHub issue
          </a>{" "}
          or <a href="/submit">submit feedback via the portal</a>. Methodology
          changes require a public discussion of at least 7 days and editor
          consensus before taking effect.
        </p>
      </div>
    </div>
  );
}
