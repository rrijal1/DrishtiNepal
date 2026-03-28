export const metadata = {
  title: "About — Drishti Nepal",
  description: "Learn about Drishti Nepal's mission, methodology, and team.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-neutral-800">
        About Drishti Nepal
      </h1>
      <p className="mt-2 text-lg text-neutral-400 font-nepali">
        दृष्टि नेपालको बारेमा
      </p>

      <div className="prose prose-neutral mt-10 max-w-none">
        <h2>Our Mission</h2>
        <p>
          Drishti Nepal (दृष्टि नेपाल) is a non-partisan civic technology
          platform that holds Nepal&apos;s elected representatives accountable
          by tracking their actions against their vacha patra (election
          commitments).
        </p>
        <p>
          Using AI-powered agents that monitor 20+ news sources and government
          portals 24/7, we provide transparent, data-driven scorecards for every
          cabinet minister — helping citizens make informed judgments.
        </p>

        <h2>What We Track</h2>
        <ul>
          <li>
            <strong>Bachha Patra (बच्चा पत्र)</strong> — The 100 policy
            foundations for transformation, the detailed commitments.
          </li>
          <li>
            <strong>Karar Patra (करार पत्र)</strong> — The citizen&apos;s
            agreement with 5 priority areas and accountability clause.
          </li>
          <li>
            <strong>Cabinet Decisions</strong> — Every major government decision
            and its connection to manifesto commitments.
          </li>
          <li>
            <strong>Ministerial Actions</strong> — Day-to-day activities of
            ministers, policy statements, and public engagements.
          </li>
        </ul>

        <h2>वाचा पालन — Electoral Accountability</h2>
        <p>
          At the heart of Drishti Nepal is वाचा पालन (vacha palan) — did they
          honor their vacha? The government signed a commitment charter (वाचा
          पत्र) with the people. We take the specific, measurable commitments
          from the bachha patra and karar patra and track whether the government
          actually delivers on them. No editorializing, no opinion — just the
          gap between भनाइ (rhetoric) and गराइ (action), measured objectively.
        </p>

        <h2>Scoring Methodology</h2>
        <p>
          Ministers are scored across 2 transparent dimensions with publicly
          documented weights:
        </p>
        <table>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Weight</th>
              <th>What It Measures</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Manifesto Compliance</td>
              <td>70%</td>
              <td>
                Delivery against specific bachha patra &amp; karar patra
                commitments assigned to the minister
              </td>
            </tr>
            <tr>
              <td>Public Accountability</td>
              <td>30%</td>
              <td>
                Media sentiment, transparency (press conferences, RTI), and
                parliamentary engagement
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          Full methodology documentation is available at{" "}
          <a href="/methodology">/methodology</a> and in our{" "}
          <a href="https://github.com/rrijal1/DrishtiNepal">
            open-source repository
          </a>
          .
        </p>

        <h2>Data Sources</h2>
        <p>We monitor these whitelisted, verified sources:</p>
        <h3>Nepali News</h3>
        <ul>
          <li>Ekantipur (ekantipur.com)</li>
          <li>Online Khabar (onlinekhabar.com)</li>
          <li>Ratopati (ratopati.com)</li>
          <li>Setopati (setopati.com)</li>
          <li>Nagarik News (nagariknews.nagariknetwork.com)</li>
          <li>Himalaya Khabar (himalayakhabar.com)</li>
        </ul>
        <h3>English News</h3>
        <ul>
          <li>The Kathmandu Post (kathmandupost.com)</li>
          <li>Nepali Times (nepalitimes.com)</li>
          <li>Record Nepal (recordnepal.com)</li>
          <li>The Annapurna Express (theannapurnaexpress.com)</li>
          <li>My República (myrepublica.nagariknetwork.com)</li>
        </ul>
        <h3>Government Portals</h3>
        <ul>
          <li>Nepal Gazette (rajpatra.dop.gov.np)</li>
          <li>Office of the PM (opmcm.gov.np)</li>
          <li>House of Representatives (hr.parliament.gov.np)</li>
          <li>National Assembly (na.parliament.gov.np)</li>
          <li>Ministry of Finance (mof.gov.np)</li>
          <li>National Planning Commission (npc.gov.np)</li>
          <li>Office of the Auditor General (oag.gov.np)</li>
          <li>Election Commission (election.gov.np)</li>
          <li>CIAA (ciaa.gov.np)</li>
        </ul>

        <h2>Editorial Principles</h2>
        <ul>
          <li>
            <strong>Non-partisan:</strong> We do not support any political
            party.
          </li>
          <li>
            <strong>Transparent:</strong> All scoring is publicly documented and
            open source.
          </li>
          <li>
            <strong>AI-labeled:</strong> AI-generated content is clearly marked.
          </li>
          <li>
            <strong>Evidence-based:</strong> Every claim links to a verifiable
            source.
          </li>
          <li>
            <strong>Bilingual:</strong> All content is published in both English
            and Nepali.
          </li>
        </ul>

        <h2>Open Source</h2>
        <p>
          Drishti Nepal is 100% open source. Our entire codebase — agents,
          scoring algorithms, and this web portal — is available on{" "}
          <a href="https://github.com/rrijal1/DrishtiNepal">GitHub</a>. We
          welcome contributions via Pull Requests.
        </p>

        <h2>Team</h2>
        <p>
          Drishti Nepal is built and maintained by a small team of Nepali
          technologists and civic advocates. We aim to employ 5 people in Nepal
          to manage content, community, and operations.
        </p>

        <h2>Contact</h2>
        <ul>
          <li>
            Facebook:{" "}
            <a href="https://facebook.com/DrishtiNepalHQ">@DrishtiNepalHQ</a>
          </li>
          <li>
            X (Twitter):{" "}
            <a href="https://x.com/DrishtiNepalHQ">@DrishtiNepalHQ</a>
          </li>
          <li>
            Instagram:{" "}
            <a href="https://www.instagram.com/drishtinepal_hq/">
              @drishtinepal_hq
            </a>
          </li>
          <li>
            GitHub:{" "}
            <a href="https://github.com/rrijal1/DrishtiNepal">
              rrijal1/DrishtiNepal
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
