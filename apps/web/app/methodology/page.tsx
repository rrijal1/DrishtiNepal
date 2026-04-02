export const metadata = {
  title: "Scoring Methodology — Drishti Nepal",
  description:
    "How we calculate ministerial accountability scores across 3 tiers: Outcomes, Initiatives, and Evidence.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-neutral-800">
        Scoring Methodology
      </h1>
      <p className="mt-2 text-neutral-500">
        How Drishti Nepal calculates ministerial accountability scores. Version
        3.0 — fully open source and peer-reviewable.
      </p>

      <div className="prose prose-neutral mt-10 max-w-none">
        <h2>वाचा पालन — Electoral Accountability</h2>
        <p>
          Drishti Nepal exists to answer one question:{" "}
          <strong>did the government honor its vacha (वाचा)?</strong> The vacha
          patra is a commitment charter signed with the people. We take those
          specific, measurable commitments and track verifiable government
          actions against them. No editorializing, no opinion — just the gap
          between भनाइ (rhetoric) and गराइ (action).
        </p>
        <ul>
          <li>
            A minister making a <em>statement</em> reaffirming a commitment is{" "}
            <strong>not</strong> delivery.
          </li>
          <li>
            A bill <em>introduced</em> is partial progress; a bill{" "}
            <em>passed and implemented</em> is delivery.
          </li>
          <li>
            A budget <em>announced</em> is intent; funds <em>disbursed</em> is
            delivery.
          </li>
          <li>No credit for intent — only verifiable results.</li>
        </ul>

        <h2>The Three-Tier Model</h2>
        <p>
          Each minister receives a composite score from 0 to 100 across{" "}
          <strong>three tiers</strong>. Scores are recalculated daily at
          midnight NPT (18:15 UTC). The tiers are designed to answer three
          distinct questions:
        </p>
        <ol>
          <li>
            <strong>Tier 1 — Outcomes (50%):</strong> Is Nepal actually getting
            better? Are real-world indicators moving toward manifesto targets?
          </li>
          <li>
            <strong>Tier 2 — Initiatives (30%):</strong> Is the government
            acting on its commitments? How many manifesto items are being
            executed?
          </li>
          <li>
            <strong>Tier 3 — Evidence (20%):</strong> Will these initiatives
            actually work? What does international and local evidence say?
          </li>
        </ol>
        <p>
          The worst case scenario this system must catch: all 100 action items
          marked &quot;done&quot;, every minister gets a 100 on initiatives, but
          GDP per capita drops. That&apos;s a failure — and Tier 1 will say so.
        </p>

        <h2>Tier 1 — Outcome Score (50%)</h2>
        <p>
          Measures whether Nepal is <em>actually moving</em> toward the
          manifesto&apos;s stated goals. This is the primary score — results
          matter, not activity.
        </p>
        <p>
          Indicator areas are derived directly from the Karar Patra&apos;s 5
          priority areas, which collectively cover all 100 Bachha Patra items.
          Each area is weighted by its proportion of manifesto items:
        </p>
        <table>
          <thead>
            <tr>
              <th>Karar Patra Area</th>
              <th>Weight</th>
              <th>Key Indicators</th>
              <th>Sources</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Integrity &amp; Good Governance</td>
              <td>18%</td>
              <td>TI CPI, E-Gov Index, WGI Corruption Percentile</td>
              <td>TI, UN, World Bank</td>
            </tr>
            <tr>
              <td>Middle-Class Expansion</td>
              <td>42%</td>
              <td>
                GDP per capita, GDP growth, health insurance, poverty rate
              </td>
              <td>NRB, CBS, World Bank</td>
            </tr>
            <tr>
              <td>Jobs, Jobs, Jobs</td>
              <td>20%</td>
              <td>Formal jobs created, unemployment rate, migration outflow</td>
              <td>CBS, ILO, DoFE</td>
            </tr>
            <tr>
              <td>Connectivity</td>
              <td>15%</td>
              <td>Installed MW, highway km, internet penetration</td>
              <td>NEA, DoR, NTA</td>
            </tr>
            <tr>
              <td>Diaspora</td>
              <td>5%</td>
              <td>Online voting, diaspora fund, remittance dependency</td>
              <td>EC, NRB, MoFA</td>
            </tr>
          </tbody>
        </table>
        <p>How it works:</p>
        <ul>
          <li>
            Each manifesto target is base-lined at government formation (March
            2026)
          </li>
          <li>
            Current values are pulled from authoritative sources (NRB, CBS,
            World Bank, IMF)
          </li>
          <li>
            Score = weighted distance toward each target, grouped by priority
            area
          </li>
          <li>
            Updated as new data becomes available (quarterly for most macro
            indicators)
          </li>
          <li>
            Direction-aware: for indicators like poverty rate, lower is better
          </li>
        </ul>

        <h2>Tier 2 — Initiative Score (30%)</h2>
        <p>
          A factual count of government activity toward manifesto commitments.
          Not a quality judgment — just what&apos;s moving.
        </p>
        <ul>
          <li>Tracks all 100 Bachha Patra items + Karar Patra commitments</li>
          <li>
            Status values: fulfilled (100%), partially_fulfilled (60%),
            in_progress (30%), not_started (0%), broken (−30%)
          </li>
          <li>
            Score = average status value across all items assigned to a minister
          </li>
          <li>
            Source: gazette notifications, cabinet decisions, parliamentary
            records, news
          </li>
          <li>
            Ministers with no assigned items default to 50 pending data entry
          </li>
        </ul>

        <h2>Tier 3 — Evidence Score (20%)</h2>
        <p>
          For each initiative, does international and local evidence suggest it
          will actually produce the intended outcome? This is{" "}
          <strong>not a yes/no verdict</strong> — it&apos;s a probability with
          citations.
        </p>
        <ul>
          <li>
            Based on: peer-reviewed research, World Bank evaluations, OECD
            evidence library, comparable country experiences, Nepal-specific
            studies
          </li>
          <li>
            AI agent drafts the assessment; community editors + domain experts
            review and approve
          </li>
          <li>Score = average probability across assessed items × 100</li>
          <li>
            Revisited over time: as actual results arrive, assessments are
            compared against reality for a feedback loop
          </li>
        </ul>
        <p>Example:</p>
        <blockquote>
          <strong>Initiative:</strong> &quot;Build 500km of new highway in first
          year&quot;
          <br />
          <strong>Evidence probability:</strong> 0.35 (Low-Moderate)
          <br />
          <strong>Citations:</strong> World Bank Transport Sector Review (2024)
          shows Nepal&apos;s average highway construction pace at 80km/year.
        </blockquote>

        <h2>Composite Score Formula</h2>
        <div className="rounded-lg bg-neutral-100 p-4 font-mono text-sm">
          Overall = (outcome_score × 0.50) + (initiative_score × 0.30) +
          (evidence_score × 0.20)
        </div>

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
              <td>Outcome data entry (Tier 1)</td>
              <td>AI auto-publishes from verified sources</td>
            </tr>
            <tr>
              <td>Initiative status updates (Tier 2)</td>
              <td>AI extracts from gazette/news; moderators verify</td>
            </tr>
            <tr>
              <td>Evidence assessments (Tier 3)</td>
              <td>AI drafts; community editors + domain experts approve</td>
            </tr>
            <tr>
              <td>Methodology changes</td>
              <td>Public discussion → editor consensus</td>
            </tr>
          </tbody>
        </table>

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
              <td className="text-emerald-600">Green</td>
            </tr>
            <tr>
              <td>60–79</td>
              <td>Good</td>
              <td className="text-blue-600">Blue</td>
            </tr>
            <tr>
              <td>40–59</td>
              <td>Average</td>
              <td className="text-amber-600">Amber</td>
            </tr>
            <tr>
              <td>20–39</td>
              <td>Below Average</td>
              <td className="text-orange-600">Orange</td>
            </tr>
            <tr>
              <td>0–19</td>
              <td>Failing</td>
              <td className="text-red-600">Red</td>
            </tr>
          </tbody>
        </table>

        <h2>Version History</h2>
        <ul>
          <li>
            <strong>v3.0</strong> (April 2026) — Three-tier model: Outcomes
            (50%), Initiatives (30%), Evidence (20%). Added 20 baseline outcome
            indicators across 5 karar patra areas. Evidence probability
            assessments for manifesto items.
          </li>
          <li>
            <strong>v2.0</strong> (March 2026) — Two-dimension model: Manifesto
            Compliance (70%), Public Accountability (30%). Initial launch.
          </li>
        </ul>

        <h2>Data Integrity</h2>
        <ul>
          <li>
            All source data is traceable to whitelisted news sources and
            government portals
          </li>
          <li>
            Outcome indicators are sourced from NRB, CBS, World Bank, IMF, and
            other authoritative bodies
          </li>
          <li>
            AI extractions are confidence-scored; low-confidence items require
            human review
          </li>
          <li>Score history is preserved — no retroactive changes</li>
          <li>Methodology changes are versioned and announced publicly</li>
        </ul>

        <h2>Peer Review</h2>
        <p>
          This methodology is open to peer review. If you have suggestions for
          improvement, please{" "}
          <a href="https://github.com/rrijal1/DrishtiNepal/issues">
            open a GitHub issue
          </a>{" "}
          or <a href="/submit">submit feedback</a>.
        </p>
      </div>
    </div>
  );
}
