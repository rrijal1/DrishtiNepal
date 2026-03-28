export const metadata = {
  title: "Scoring Methodology — Drishti Nepal",
  description:
    "How we calculate ministerial accountability scores across 2 transparent dimensions.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-neutral-800">
        Scoring Methodology
      </h1>
      <p className="mt-2 text-neutral-500">
        How Drishti Nepal calculates ministerial accountability scores. Version
        2.0 — fully open source and peer-reviewable.
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

        <h2>Overview</h2>
        <p>
          Each minister receives a composite score from 0 to 100 across two
          dimensions. Scores are recalculated daily at midnight NPT (18:15 UTC).
        </p>
        <p>
          We keep scoring lean deliberately. Ra Swa Pa&apos;s bachha patra and
          karar patra already define what ministers promised — GDP targets,
          remittance policy, industrialization, education, infrastructure, and
          more. That is the primary accountability lens. The second dimension
          captures everything the manifesto cannot: how the public and press
          perceive a minister, whether they communicate openly, and whether they
          participate in the legislature they were elected to serve.
        </p>

        <h2>Dimensions & Weights</h2>

        <h3>1. Manifesto Compliance — 70%</h3>
        <p>
          How well a minister&apos;s actions match their party&apos;s election
          commitments (bachha patra + karar patra). This covers every stated
          commitment — GDP growth targets, remittance policy, industrialization,
          education access, infrastructure, agriculture, and any other item in
          the manifesto assigned to their ministry.
        </p>
        <ul>
          <li>Each manifesto item assigned to the minister is tracked</li>
          <li>
            Status values: completed (100), in_progress (50),
            partially_fulfilled (30), not_started (0), contradicted (−20)
          </li>
          <li>Score = average status value across all assigned items</li>
          <li>
            Ministers with no assigned items default to 50 pending data entry
          </li>
        </ul>

        <h3>2. Public Accountability — 30%</h3>
        <p>
          Captures dimensions the manifesto cannot quantify. Composed of three
          equally weighted sub-signals:
        </p>
        <ul>
          <li>
            <strong>Media sentiment (50% of this score)</strong> — AI-analyzed
            tone of news coverage over the rolling 30-day window. Positive = 80,
            Neutral = 50, Mixed = 40, Negative = 20.
          </li>
          <li>
            <strong>Transparency (30% of this score)</strong> — Press
            conferences held, public statements made, RTI responses. Measures
            whether the minister communicates openly.
          </li>
          <li>
            <strong>Parliamentary engagement (20% of this score)</strong> —
            Q&amp;A sessions attended, bills introduced or supported, committee
            participation.
          </li>
        </ul>

        <h2>Composite Score Formula</h2>
        <div className="rounded-lg bg-neutral-100 p-4 font-mono text-sm">
          Overall = (manifesto_compliance × 0.70) + (public_accountability ×
          0.30)
        </div>

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

        <h2>Data Integrity</h2>
        <ul>
          <li>
            All source data is traceable to whitelisted news sources and
            government portals
          </li>
          <li>
            New data sources may be added over time, but the core electoral
            accountability scoring model stays fixed unless a versioned
            methodology change is publicly announced
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
