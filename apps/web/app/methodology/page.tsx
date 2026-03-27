export const metadata = {
  title: "Scoring Methodology — Drishti Nepal",
  description:
    "How we calculate ministerial accountability scores across 6 transparent dimensions.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-neutral-800">
        Scoring Methodology
      </h1>
      <p className="mt-2 text-neutral-500">
        How Drishti Nepal calculates ministerial accountability scores. Version
        1.0 — fully open source and peer-reviewable.
      </p>

      <div className="prose prose-neutral mt-10 max-w-none">
        <h2>Overview</h2>
        <p>
          Each minister receives a composite score from 0 to 100, calculated
          across six weighted dimensions. Scores are recalculated daily at
          midnight NPT (18:15 UTC).
        </p>

        <h2>Dimensions & Weights</h2>

        <h3>1. Manifesto Compliance — 30%</h3>
        <p>
          Measures how well a minister&apos;s actions align with the
          party&apos;s election commitments (bachha patra + pratigya patra).
        </p>
        <ul>
          <li>Each manifesto item assigned to the minister is tracked</li>
          <li>
            Status values: completed (100), in_progress (50),
            partially_fulfilled (30), not_started (0), contradicted (-20)
          </li>
          <li>Score = average status value across all assigned items</li>
        </ul>

        <h3>2. Policy Effectiveness — 20%</h3>
        <p>Evaluates the quality and impact of policy decisions.</p>
        <ul>
          <li>Based on AI analysis of action outcomes</li>
          <li>Considers sector diversity and follow-through</li>
        </ul>

        <h3>3. Transparency — 15%</h3>
        <p>How open and communicative the minister is with the public.</p>
        <ul>
          <li>Press conference frequency</li>
          <li>Responses to RTI requests</li>
          <li>Public disclosure of decisions</li>
        </ul>

        <h3>4. Financial Prudence — 15%</h3>
        <p>Responsible use of government resources.</p>
        <ul>
          <li>Audit findings from Office of the Auditor General</li>
          <li>Budget adherence in their ministry</li>
          <li>Procurement transparency</li>
        </ul>

        <h3>5. Public Sentiment — 10%</h3>
        <p>Aggregate media sentiment about the minister.</p>
        <ul>
          <li>
            AI-analyzed sentiment from news articles (positive/negative/neutral)
          </li>
          <li>
            Converted to 0–100 scale: positive = 80, neutral = 50, negative =
            20, mixed = 40
          </li>
          <li>Averaged across all articles mentioning the minister</li>
        </ul>

        <h3>6. Parliamentary Activity — 10%</h3>
        <p>Engagement in legislative activities.</p>
        <ul>
          <li>Bills introduced or supported</li>
          <li>Parliamentary committee participation</li>
          <li>Question & answer sessions</li>
        </ul>

        <h2>Composite Score Formula</h2>
        <div className="rounded-lg bg-neutral-100 p-4 font-mono text-sm">
          Overall = (manifesto × 0.30) + (policy × 0.20) + (transparency × 0.15)
          + (fiscal × 0.15) + (sentiment × 0.10) + (parliament × 0.10)
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
