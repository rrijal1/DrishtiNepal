# Drishti Nepal (दृष्टि नेपाल) — Implementation Plan

## Mission

Hold Nepal's government accountable by measuring **real outcomes** — not just activity — against Ra Swa Pa's _Bachha Patra_ and _Karar Patra_ (citizen's agreement). Deliver verifiable, evidence-based accountability to the public 24/7 through autonomous agents and open-source community governance.

---

## 1. Core Philosophy

### What We Measure

The manifesto (Bachha Patra + Karar Patra) is the **source of truth**. It contains specific, measurable promises: a $100B economy, poverty reduction, infrastructure targets, governance reforms.

We don't just check if the government is busy. We check if Nepal is actually getting better.

**The worst case scenario this system must catch:** All 100 action items are marked "done", every minister gets a 100 rating, but GDP per capita drops from $1,500 to $1,000. That's a failure, and our system must say so.

### How We Govern Content

| Content Type                                          | Who Publishes                                          |
| ----------------------------------------------------- | ------------------------------------------------------ |
| Factual data (indicator updates, initiative counts)   | AI auto-publishes                                      |
| Analysis (evidence assessments, trend interpretation) | AI drafts → community editors + domain experts approve |

This is an **open-source project**. "Human review" means community contributors + editors, not a single gatekeeper.

### What We Will Never Do

- Accept money from political parties or politicians
- Run paid political ads or sponsored political content
- Sell user data
- Suppress or alter content based on financial pressure
- Hide our funding sources
- Make absolute verdicts without evidence — we present probabilities and citations

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DRISHTI NEPAL ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐  │
│  │  DATA AGENTS    │─▶│  CONTENT       │─▶│  WEB PORTAL         │  │
│  │  - News scraper │  │  PIPELINE      │  │  (Next.js SSG+ISR)  │  │
│  │  - Gazette mon. │  │  - AI extract  │  │  - Minister cards   │  │
│  │  - Parliament   │  │  - Classify    │  │  - Manifesto tracker│  │
│  │  - Action extr. │  │  - Match to    │  │  - Scores (3 tiers) │  │
│  │  - Outcome pull │  │    manifesto   │  │  - Articles         │  │
│  └───────┬────────┘  └───────┬────────┘  └──────────┬──────────┘  │
│          │                   │                       │              │
│          ▼                   ▼                       ▼              │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐  │
│  │  DATA SOURCES   │  │  SUPABASE      │  │  SOCIAL MEDIA       │  │
│  │  - News RSS     │  │  (Postgres +   │  │  PUBLISHER          │  │
│  │  - Nepal Gazette│  │   pgvector +   │  │  (FB + X + IG)      │  │
│  │  - Parliament   │  │   Storage)     │  │                     │  │
│  │  - NRB/CBS/     │  │                │  │                     │  │
│  │    World Bank   │  │                │  │                     │  │
│  └────────────────┘  └────────────────┘  └─────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  SCORING ENGINE (3-Tier: Outcomes → Initiatives → Evidence)   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  COMMUNITY GOVERNANCE (Open Source: PRs + Review Queue)       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. The Scoring Engine (v1)

This is the intellectual core of the project. Every score is grounded in verifiable, observable data.

**Methodology version: v1** — The score is 100% outcome-based. Initiatives and evidence are tracked and displayed, but do not affect the score. वाचा पालन — keeping promises — means results, not activity.

### The Outcome Score (The Only Score)

Measures whether Nepal is actually moving toward the manifesto's stated goals.

```
minister_score = Σ(weight_i × progress_i) / Σ(weight_i) × 100

# higher_is_better:  progress_i = (current - baseline) / (target - baseline)
# lower_is_better:   progress_i = (baseline - current) / (baseline - target)
# clamped to [0.0, 1.0]
```

Each indicator has a **weight (1–100)** reflecting its centrality in the manifesto. Core numeric targets (GDP per capita $3,000, 500,000 jobs, 15,000 MW) carry weight 10. Supporting or binary metrics carry weight 3–5. Weights are community-reviewed and versioned.

Indicator areas are **derived directly from the Karar Patra's 5 priority areas**, which collectively cover all 100 Bachha Patra items.

| Karar Patra Area                        | Key Targets (from manifesto)                                                                                                                                              | Bachha Patra Items                                                                                   | Sources                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **pp-001: Integrity & Good Governance** | Anti-Corruption Mega-Campaign; Universal digital government services; Major TI CPI improvement; End politicization of state institutions; Investigate deals since 2076 BS | bp-001 → bp-018 (18 items: governance, justice, social justice)                                      | TI CPI, World Bank WGI, e-Gov Index, CBS |
| **pp-002: Middle-Class Expansion**      | 7% GDP growth; Per capita ≥ $3,000; $100B economy; 100% insured health; Education reform; Integrated social security; Universal financial inclusion; End usurious lending | bp-019 → bp-060 (42 items: economy, agriculture, energy, tourism, technology, infrastructure, labor) | NRB, CBS, World Bank, IMF, MoF           |
| **pp-003: Jobs, Jobs, Jobs**            | 500,000 new formal jobs; Reduce forced migration; Priority sectors: IT, construction, tourism, agriculture, minerals, industry, service trade                             | bp-061 → bp-080 (20 items: education, health, labor, sports, social justice)                         | CBS, ILO, DoFE, MoLESS                   |
| **pp-004: Connectivity**                | 15,000 MW installed; 30,000 km national highways; High-speed internet to all settlements; Reliable energy grid; 10 signature projects completed                           | bp-081 → bp-095 (15 items: infrastructure, environment, health, social justice)                      | NEA, DoR, NTA, NPC, CBS                  |
| **pp-005: Diaspora**                    | Online voting for Nepalis abroad; Citizenship continuity for descendants; Sovereign Diaspora Fund; Safe investment & dignified return; Decent foreign employment          | bp-096 → bp-100 (5 items: foreign policy, diaspora, governance)                                      | NRB, DoFE, Election Commission, MoFA     |

Each indicator is tagged to a **primary ministry** (and optionally shared ministries). A minister's score is the weighted average of all indicators tagged to their portfolio.

**How it works:**

1. Each manifesto target is base-lined at the time of government formation (March 27, 2026)
2. Current values are pulled from authoritative sources (quarterly for most macro indicators)
3. Progress = weighted distance toward target, clamped to [0, 1] per indicator
4. Minister score = weighted average across their tagged indicators × 100
5. National score = weighted average across all 29 indicators × 100

**Key principle:** Results matter, not activity. If all initiatives are "done" but outcomes worsen, the outcome score reflects reality. The indicators are not our opinion — they are the party's own commitments.

### Activity Tracker (Not Scored)

A factual count of government activity displayed on each manifesto item page. Not a quality judgment — just what's moving.

- Track all 100 bachha patra items + karar patra commitments
- Status: completed / in_progress / not_started / stalled / cancelled
- Displayed as: "67 completed · 18 in progress · 15 not started"
- Each initiative links to gazette, cabinet decisions, parliamentary records
- Start/end dates tracked; checked against promised timeline

### Editorial Context (Not Scored)

For each initiative, scholarly articles and evidence assessments provide context — not a probability or a score.

- Based on: peer-reviewed research, World Bank project evaluations, comparable country experiences
- AI agent drafts; community editors + domain experts review and approve
- Displayed as long-form articles on manifesto item pages (one per initiative)

### Scoring Governance

| Decision                    | Who Decides                                                |
| --------------------------- | ---------------------------------------------------------- |
| Outcome data updates        | AI auto-publishes from verified sources; moderators verify |
| Initiative status updates   | AI extracts from gazette/news; moderators verify           |
| Editorial articles          | AI drafts; community editors + domain experts approve      |
| Indicator weight changes    | Public discussion → editor consensus → versioned           |
| Methodology version changes | Public discussion → editor consensus                       |
| Reassessment triggers       | AI flags when new data arrives; humans make final call     |

---

## 4. Data Agents

Lightweight Python agents running via GitHub Actions cron (free for public repos). No always-on server required.

### Current Agents (Built)

| Agent               | Schedule          | Source                                                          | Purpose                                                             | Status                            |
| ------------------- | ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| `news_scraper`      | 3×/day            | RSS: ekantipur, onlinekhabar (en), setopati (en), kathmandupost | Collect minister-related news (cross-source dedup, 2+ keyword gate) | ✅ Running                        |
| `action_extractor`  | After generator   | `raw_news` table                                                | Extract structured actions from news, generate embeddings           | ✅ Running                        |
| `content_generator` | After scraper     | `raw_news` + AI (5 concurrent calls, 25-item cap, 3-day window) | Generate bilingual analysis posts                                   | ✅ Running                        |
| `manifesto_matcher` | Daily             | `actions` + `manifesto_items`                                   | Match actions to manifesto via vector similarity + AI verification  | ✅ Running                        |
| `scoring_agent`     | Daily             | All tables                                                      | Calculate minister scores                                           | ✅ Running (needs tiered rewrite) |
| `social_publisher`  | After content gen | `posts` table                                                   | Publish to Facebook, X, Instagram                                   | ✅ Running                        |
| `image_enricher`    | After content gen | `posts` table                                                   | Scrape og:image from source URLs                                    | ✅ Running                        |

### Agents To Build

| Agent                | Schedule           | Source                                             | Purpose                                                                                                   |
| -------------------- | ------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `gazette_monitor`    | Every 6 hrs        | rajpatra.dop.gov.np + manual entry dashboard       | Track official government decisions, gazette notifications                                                |
| `parliament_tracker` | Every 2 hrs        | hr.parliament.gov.np, na.parliament.gov.np         | Track bills, committees, Q&A sessions                                                                     |
| `outcome_tracker`    | Weekly             | NRB API, CBS, World Bank Open Data, IMF            | Pull and store economic/social indicators for outcome scoring                                             |
| `evidence_assessor`  | On new initiatives | Research databases, World Bank evaluations         | Draft editorial context articles per initiative                                                           |
| `scholarly_curator`  | Weekly             | Academic sources + AI                              | Generate long-form political analysis                                                                     |
| `open_data_monitor`  | Daily              | opennepal.net + National Data Exchange (when live) | Pull structured government datasets (economy, health, education, infrastructure) as they become available |

### Agent Pipeline

```
News RSS ──▶ news_scraper ──▶ action_extractor ──▶ manifesto_matcher
                                     │                      │
                                     ▼                      ▼
                              content_generator      scoring_agent
                                     │                      │
                                     ▼                      ▼
                              social_publisher        Score snapshots
                                     │
                                     ▼
                              FB / X / Instagram

Gazette ──▶ gazette_monitor ──▶ initiative status updates ──▶ Activity Tracker

NRB/CBS/WB ──▶ outcome_tracker ──▶ outcome_indicators ──▶ Outcome Score (scored)

Open Data Nepal ──▶ open_data_monitor ──▶ structured indicators ──▶ Outcome Score + Activity Tracker

New initiative ──▶ evidence_assessor ──▶ draft article ──▶ Editor review ──▶ Editorial Context (not scored)
```

### Content Review Tiers

| Tier            | What                                                                             | Action                                      |
| --------------- | -------------------------------------------------------------------------------- | ------------------------------------------- |
| Auto-publish    | Factual news summaries, gazette references, indicator updates, initiative counts | AI publishes directly                       |
| Quick review    | Action classifications, manifesto linkages, score updates                        | AI publishes; flagged for retroactive check |
| Full review     | Evidence assessments, scholarly articles, trend analysis                         | AI drafts → community + editors approve     |
| Editor-in-chief | Anything potentially defamatory, legally sensitive, or politically explosive     | Senior editor must approve                  |

### AI Configuration

All AI is OpenAI-API-compatible. Currently using NVIDIA NIM (free tier). Models are swappable via environment variables.

| Task                                              | Model                        | Env Var             |
| ------------------------------------------------- | ---------------------------- | ------------------- |
| Routine (extraction, classification, translation) | Qwen/DeepSeek via NVIDIA NIM | `NVIDIA_MODEL`      |
| Deep analysis (scholarly, complex matching)       | Claude Sonnet (Anthropic)    | `ANTHROPIC_API_KEY` |
| Embeddings                                        | Any OpenAI-compatible model  | `EMBEDDING_MODEL`   |

Embedding dimensions are **not locked in the schema** — pgvector columns accept any size. Switch models by changing the env var and re-running the embed script with `--force`.

---

## 5. The Manifesto as Source of Truth

### Why the Manifesto, Not the Government's Action Plan

**The manifesto is a party document.** RSP published the Bachha Patra and Karar Patra to win votes — these are the specific promises made to citizens in exchange for a mandate to govern. We track against the manifesto because that is the only binding commitment: it is what they asked for votes on.

**The 100-point governance agenda is the government's own action plan.** It was released after taking power and represents how the cabinet intends to operate. Because RSP holds close to a two-thirds majority, the plan is heavily shaped by the manifesto — but it is not the same thing. The government wrote its own report card. We don't score against that.

This distinction matters: the government may mark all 100 agendas as "completed" and call it a success. We will ask a different question — did the manifesto promises actually get fulfilled? Those are not always the same answer.

The government may release further action plans (100-day plans, annual programmes, sectoral roadmaps). These are all useful **evidence of activity**, and we track them as inputs. The scorecard is still the manifesto.

### Data Files

| File                               | What it is                                                                                                           | Items |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----- |
| `data/manifesto/bachha_patra.json` | **RSP party manifesto** — 100 policy foundations, the scorecard (bp-001 → bp-100)                                    | 100   |
| `data/manifesto/karar_patra.json`  | **RSP party manifesto** — 5 priority areas with measurable targets (pp-001 → pp-005)                                 | 5     |
| `data/government/100_agendas.json` | **Government action plan** — cabinet's 100-point reform agenda (ga-001 → ga-100); useful evidence, not the scorecard | 100   |
| `data/ministers/cabinet_2026.json` | Cabinet members with portfolio assignments                                                                           | 16    |

### Relationship: Manifesto → Government Plans → Actions → Outcomes

```
MANIFESTO (Bachha Patra + Karar Patra)  ← THE SCORECARD
  = RSP's promises to voters
  = Party document, published pre-election
  = What we measure against. Full stop.

        ▼ (government's interpretation of those promises)

GOVERNMENT ACTION PLANS (100-point agenda + future plans)
  = Cabinet's operational plan for governing
  = Written by the govt itself — not a neutral source
  = Useful as evidence of intent and activity
  = NOT the scorecard (they could complete all 100 and still break manifesto promises)

        ▼ (actual execution)

ACTIONS (What actually happens)
  = Bills passed, budgets allocated, policies enacted, people arrested
  = Tracked by agents from news, gazette, parliament
  = Mapped back to manifesto items, not to the govt's own plan

        ▼ (real-world results)

OUTCOMES (What actually changes in Nepal)
  = GDP, poverty rate, employment, infrastructure, health, governance
  = Verified from NRB, CBS, World Bank, IMF
  = THE REAL VERDICT on whether manifesto promises are being kept
```

### Translation & Versioning

- Manifesto text is AI-translated from original Nepali. Translation will be reviewed and corrected over time.
- **Any change to manifesto JSON files triggers automatic re-sync**: GitHub Action re-seeds DB + re-embeds all items.
- Manual trigger available when switching embedding models: `force_reembed = true`.

---

## 6. Data Model

### Core Tables

```
ministers
├── id (uuid, PK)
├── name_en, name_np
├── photo_url
├── portfolio_en, portfolio_np
├── party
├── appointed_date
├── previous_roles[] (jsonb)
├── bio_summary_en, bio_summary_np
├── overall_score (0–100)
├── status (active | resigned | reshuffled | dismissed)
└── metadata (jsonb)

manifesto_items
├── id (uuid, PK)
├── source_id (unique: bp-001→bp-100, pp-001→pp-005)
├── document_type (bachha_patra | karar_patra)
├── category
├── title_en, title_np
├── item_text_en, item_text_np
├── key_commitments[] (jsonb)
├── measurable (boolean)
├── target_metrics (jsonb)
├── priority (critical | high | medium | low)
├── status (not_started | in_progress | partially_fulfilled | fulfilled | broken | irrelevant)
├── embedding (vector — dimension-agnostic)
└── metadata (jsonb)

governance_agendas
├── id (uuid, PK)
├── source_id (unique: ga-001→ga-100)
├── number, section, category
├── title_en, summary_en
├── deadline, deadline_date
├── significance, status
├── manifesto_links[] (jsonb — bp-XXX IDs)
└── evidence[] (jsonb)

actions
├── id (uuid, PK)
├── minister_id (FK → ministers)
├── action_date
├── title_en, title_np, description_en, description_np
├── category (decision | statement | policy | legislation | scandal | achievement | ...)
├── sentiment (positive | negative | neutral | mixed)
├── sources[] (jsonb), evidence_files[]
├── ai_confidence_score (0–1)
├── human_verified, published (boolean)
├── embedding (vector — dimension-agnostic)
└── metadata (jsonb)
```

### Scoring Tables (New — Tiered Model)

```
outcome_indicators
├── id (uuid, PK)
├── indicator_name (e.g. "gdp_per_capita", "poverty_headcount") — UNIQUE
├── category (economy | health | education | infrastructure | governance)
├── manifesto_item_id (FK → manifesto_items, nullable)
├── baseline_value (numeric — value at government formation, March 27 2026)
├── baseline_date (date)
├── target_value (numeric — manifesto target)
├── target_date (date)
├── current_value (numeric)
├── current_date (date)
├── direction ("higher_is_better" | "lower_is_better")
├── weight (numeric 1–100 — reflects centrality in manifesto)
├── ministry (text — primary responsible ministry for attribution)
├── source (text — "World Bank", "NRB", "CBS", etc.)
├── source_url (text)
├── unit (text — "USD", "%", "km", etc.)
└── updated_at (timestamptz)

initiative_evidence
├── id (uuid, PK)
├── manifesto_item_id (FK → manifesto_items)
├── agenda_id (FK → governance_agendas, nullable)
├── probability (numeric 0.0–1.0)
├── assessment_en (text — AI-drafted, editor-approved)
├── citations[] (jsonb — [{title, url, source, year}])
├── status (draft | under_review | approved | needs_reassessment)
├── assessed_at (timestamptz)
├── reassessed_at (timestamptz, nullable)
├── reassessment_reason (text, nullable)
├── reviewed_by (text — editor/community member)
└── metadata (jsonb)

scores
├── id (uuid, PK)
├── minister_id (FK → ministers)
├── period_start, period_end
├── outcome_score (numeric — the score; 100% outcome-based)
├── initiative_score (numeric — reserved, NULL in v1)
├── evidence_score (numeric — reserved, NULL in v1)
├── overall (numeric — equals outcome_score in v1)
├── breakdown (jsonb — detailed per-indicator scores)
├── methodology_version (text)
└── scored_at (timestamptz)
```

### Supporting Tables

```
cabinet_decisions              — Tracked government decisions
raw_news                       — Scraped RSS items with AI processing results
posts                          — Published content (bilingual, AI-labeled)
post_ministers                  — Junction: posts → ministers
action_manifesto_links         — Junction: actions → manifesto (with link_type, confidence)
minister_manifesto_assignments — Junction: ministers → manifesto items
public_submissions             — Citizen evidence submissions
manifesto_edits                — Community PR-style corrections to manifesto text
agent_logs                     — Per-run logging for all agents
```

---

## 7. Web Portal

### Pages

| Route               | Purpose                                                                       | Data Source               |
| ------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| `/`                 | Home — minister grid, recent posts, key stats                                 | DB (ISR 300s)             |
| `/ministers`        | All ministers with filter pills (All / Top / Needs Improvement / By Ministry) | DB (ISR 300s)             |
| `/ministers/[id]`   | Minister detail — score breakdown, timeline, manifesto links                  | DB (ISR 300s)             |
| `/manifesto`        | Manifesto tracker — grouped by category, progress bars                        | DB (ISR 300s)             |
| `/manifesto/[slug]` | Item detail — related actions, cabinet decisions, propose edit                | DB (ISR 300s)             |
| `/scores`           | Ranking table with all three score tiers                                      | DB (ISR 300s)             |
| `/decisions`        | Cabinet decisions list                                                        | DB (ISR 300s)             |
| `/articles`         | Merged AI + human-written articles                                            | DB + filesystem (ISR 60s) |
| `/articles/[slug]`  | Article detail                                                                | DB or filesystem          |
| `/submit`           | Public evidence submission form                                               | Writes to DB              |
| `/methodology`      | Scoring methodology explained                                                 | Static                    |
| `/about`            | About the project, ethics, funding                                            | Static                    |

### Technology

- **Framework:** Next.js (App Router, SSG + ISR)
- **Hosting:** Vercel (free → Pro when needed)
- **UI:** Tailwind CSS
- **Database:** Supabase (Postgres + pgvector + Storage)
- **i18n:** Cookie-based locale toggle (English primary; Nepali later)

---

## 8. Community & Open Source Governance

**Drishti Nepal is a public-interest open-source project.** The code, data, scoring methodology and editorial decisions are all public. Anyone can read them, challenge them, and improve them. There is no single gatekeeper — the community is the editor.

The GitHub repository is the source of record for everything: manifesto data, methodology, agent code, and editorial guidelines. If something is wrong, the fix is a pull request.

### Roles

| Role            | How to get it                           | What you can do                                                                          |
| --------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Public**      | Anyone — no account needed on portal    | Read everything, submit evidence, flag content, propose manifesto edits via the web form |
| **Contributor** | Open a GitHub account and submit a PR   | Fix data, add sources, write content, propose new data sources, open issues for anything |
| **Moderator**   | Trusted contributor, invited by editors | Approve manifesto text edits, review editorial articles, merge contributor PRs           |
| **Editor**      | Core team member                        | Final publish/reject on all content, manage review queue, approve methodology changes    |

### How to Contribute — GitHub Workflows

Everything flows through GitHub. The repo is public and all contributions go through PRs.

#### Fix or improve manifesto data

The manifesto JSON files (`bachha_patra.json`, `karar_patra.json`) are the source of truth. If a translation is wrong, a target is missing, or a category is incorrectly assigned:

1. Fork the repo → edit the JSON file directly
2. Open a PR with a clear title: `fix(manifesto): correct translation for bp-023`
3. Cite the original Nepali source in the PR description
4. A moderator reviews and merges → GitHub Action auto-reseeds the DB and re-embeds

#### Propose a new data source

If you know of a better or additional source for any indicator (NRB datasets, World Bank API, CBS reports, NGO studies):

1. Open a GitHub Issue with the label `data-source`
2. Include: what the source covers, URL, update frequency, data format, and which manifesto item(s) it's relevant to
3. A moderator triages and tags it for the relevant agent sprint

#### Flag incorrect or misleading content

Any published post, score, or assessment can be flagged:

- **Via the portal:** Every article and score page has a "Flag this content" link (to be built) → writes to `public_submissions` table with type `flag`
- **Via GitHub:** Open an Issue with label `content-flag` and the URL of the item
- Flagged content is reviewed within 48 hours. If valid, it's corrected with a visible edit notice.

#### Report a coverage gap

If a government action, gazette decision, or minister announcement was missed:

1. Open a GitHub Issue with label `coverage-gap`
2. Include: date, source URL, which manifesto item it's relevant to
3. The team manually adds it or adjusts the scraper/extractor config

#### Fix or improve agent code

Standard open-source workflow:

1. Fork → branch off `main` with a descriptive name (`feat/gazette-monitor`, `fix/scraper-dedup`)
2. All agents have tests in `agents/tests/`. New features need a test.
3. Open a PR — CI runs tests automatically via GitHub Actions
4. One editor approval required to merge

#### Propose a methodology change

Scoring methodology changes are the most consequential and require the most scrutiny:

1. Open a GitHub Issue with label `methodology` and describe the change and rationale
2. A public discussion period of at least 7 days
3. Editor consensus required — no unilateral changes
4. If merged, the methodology version in `scores` table is bumped. Historical scores are preserved.

### Public Flagging — What Can Be Flagged

| Flag Type             | How                           | Response                                           |
| --------------------- | ----------------------------- | -------------------------------------------------- |
| Factual error         | Portal flag or GitHub issue   | Editor reviews within 48 hrs; corrects with notice |
| Missing evidence      | Portal submit or GitHub issue | Added to review queue for next agent run           |
| Translation error     | PR against manifesto JSON     | Moderator review; auto-reseeds on merge            |
| Bias / unfair framing | GitHub issue `content-flag`   | Editor review; public thread if disputed           |
| Missing coverage      | GitHub issue `coverage-gap`   | Triage within 7 days                               |
| New data source       | GitHub issue `data-source`    | Triage within 7 days                               |
| Methodology concern   | GitHub issue `methodology`    | Public discussion; editor consensus required       |
| Broken feature / bug  | GitHub issue `bug`            | Standard open-source bug triage                    |

### Suggesting New Data Sources

We currently track outcomes from NRB, CBS, World Bank, IMF, and news RSS feeds. If you know of sources that are not yet integrated, open a `data-source` issue. High-priority gaps:

| Gap                               | Why it matters                                                            | Potential sources                                          |
| --------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Nepal Gazette (Rajpatra)          | Official govt decisions — primary source for initiative tracking          | rajpatra.dop.gov.np (PDF scraping needed)                  |
| Parliament records                | Bills, votes, committee reports                                           | hr.parliament.gov.np, na.parliament.gov.np                 |
| DoFE (Dept of Foreign Employment) | Migration data — covers 500k jobs promise + diaspora                      | dfe.gov.np reports (semi-annual)                           |
| NEA reports                       | Energy production — covers 15,000 MW target                               | nea.org.np annual reports                                  |
| NTA (National Telecom Authority)  | Internet coverage data — covers connectivity target                       | nta.gov.np                                                 |
| CBS household surveys             | Poverty, employment, income data                                          | cbs.gov.np                                                 |
| Transparency International CPI    | Corruption perception — covers governance targets                         | transparency.org (annual)                                  |
| OAG (Auditor General) reports     | Budget execution, financial compliance                                    | oagnepal.gov.np (annual)                                   |
| CIAA (anti-corruption body)       | Corruption cases — covers accountability promises                         | ciaa.gov.np                                                |
| Academic / NGO studies on Nepal   | Evidence articles for editorial context on manifesto items                | Tribhuvan University, Martin Chautari, IDS Nepal           |
| Open Data Nepal Portal            | Aggregated govt datasets (economy, health, education, infrastructure)     | opennepal.net (varies by dataset)                          |
| National Data Exchange Platform   | Real-time official data (when launched under RSP digital governance push) | TBD — monitor for launch within 100 days of govt formation |
| CBS Statistical Pocket Book       | Comprehensive national statistics for outcome indicator baselines         | cbs.gov.np (annual)                                        |

### Transparency Guarantees

- **All scoring methodology** is versioned and publicly documented in `/docs/methodology.md`
- **Every AI-generated post** is labeled as AI-generated on the portal
- **Edit history** on manifesto items and evidence assessments is public (stored in `manifesto_edits` table)
- **Agent logs** are stored publicly — you can see what each agent ran, when, and what it produced
- **Funding sources** are publicly disclosed on the `/about` page
- **No content is ever silently deleted** — corrections are made with visible edit notices

---

## 9. Implementation Phases

### Phase 0 — Launch (This Week) ← CURRENT

- [x] Database schema applied (17 tables)
- [x] Ministers, manifesto, agendas seeded (15 ministers, 105 manifesto items, 100 agendas)
- [x] All 7 agents built and running locally
- [x] GitHub Actions for agent cron + CI
- [x] Manifesto sync workflow (auto re-seed + re-embed on data change)
- [ ] Apply migration 006 (pgvector + embeddings + RPC)
- [ ] Deploy frontend to Vercel
- [ ] Verify agents run successfully via GitHub Actions

### Phase 1 — Outcome Scoring Foundation (Weeks 1–2)

- [x] Create `outcome_indicators` table (migration 001 + 009 for weight/ministry columns)
- [x] Create `initiative_evidence` table
- [x] Seed 29 baseline indicators from NRB/CBS/World Bank (March 27 2026 baseline; April 2 2026 first measurement)
- [ ] Build `outcome_tracker` agent (pull latest indicators from NRB/CBS/World Bank APIs)
- [x] Rewrite `scoring_agent` for outcome-only v1 model
- [ ] Redesign `/scores` page to show outcome score + activity count (add Recharts for score history)
- [x] Update `/methodology` page to explain v1 outcome-only scoring

### Phase 2 — Coverage Completeness (Weeks 3–5)

- [ ] Build `gazette_monitor` agent (scraper + manual entry fallback)
- [ ] Build `parliament_tracker` agent
- [ ] Build `open_data_monitor` agent (opennepal.net + National Data Exchange when live)
- [ ] Build moderator dashboard for content review queue
- [ ] Build `evidence_assessor` agent (drafts editorial context articles per initiative)
- [ ] Community review workflow (AI flags → editor approves)
- [ ] Score history charts on minister profiles

### Phase 3 — Distribution & Credibility (Weeks 5–8)

- [ ] Social publisher running autonomously via cron
- [ ] Card image generator (minister photo + headline + score)
- [ ] Full-text search (pg_trgm already enabled)
- [ ] Nepali language content pipeline
- [ ] Default to Nepali locale via browser language detection (fall back to English)
- [ ] Umami analytics integration
- [ ] SEO optimization (including Nepali meta tags + schema markup for scores)

### Phase 4 — Sustainability (Months 2–3)

- [ ] FB Page + X account monetization applications
- [ ] Donation page (eSewa/Khalti for Nepal, Stripe for diaspora) with transparent "Sponsor Transparency" page showing all funding sources
- [ ] Apply for civic tech grants: Accountability Lab Nepal Incubator, EU CSO projects, Internews/EJN seed grants, UNDP Civic Tech Innovation Challenge
- [ ] Scholarly content program
- [ ] Expand tracking to other parties (when coalition/opposition data is relevant)
- [ ] Funding target: 40% grants, 40% donations, 20% community/services by Year 2

---

## 10. Editorial & Legal

### Principles

1. **Results over activity** — A completed initiative with no measurable outcome is not an achievement
2. **Factual accuracy above speed** — Never publish unverified claims
3. **Source everything** — Every number links to NRB/CBS/World Bank/IMF or a named news source
4. **No absolute verdicts** — Present probabilities and evidence, not opinions
5. **Political neutrality** — Track ALL parties equally
6. **Right of reply** — Ministers/offices can submit corrections via the portal
7. **AI transparency** — All AI-generated content clearly labeled
8. **Open methodology** — Scoring formula publicly documented and debatable

### Legal Compliance (Nepal)

- Comply with Electronic Transactions Act, 2063
- Comply with Press and Publication Act
- No defamation — verifiable facts only
- Register as online media with Press Council Nepal if required
- Minimal personal data collection from users

---

## 11. Risk Mitigation

| Risk                                  | Mitigation                                                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outcome data unavailable or delayed   | CBS/NRB publish quarterly; World Bank annually. Use most recent available + clearly show data date. Show indicator count and last-updated date alongside score. |
| AI generates inaccurate content       | Tiered review: auto-publish only facts; analysis requires human approval. AI confidence thresholds.                                                             |
| Scoring methodology contested         | Fully public methodology. Open GitHub issues for methodology debates. Version the methodology.                                                                  |
| Legal threats from politicians        | Stick to verifiable facts from named sources. Legal counsel on retainer.                                                                                        |
| Scraper blocked by news sites         | RSS first. Multiple source redundancy. Rotate user agents.                                                                                                      |
| Embedding model changes               | Dimension-agnostic vector columns. One-click re-embed via GitHub Action.                                                                                        |
| Community capture / bad-faith editors | Tiered permissions. Editors have final say. Public audit trail on all changes.                                                                                  |
| Agent downtime                        | GitHub Actions cron with retry. Agent logs table for monitoring. Manual trigger fallback.                                                                       |

---

## 12. Key Metrics

### Impact Metrics (What Actually Matters)

- Government responses to our coverage
- Manifesto item status changes correlated with our reporting
- Public submissions per month
- Citation by journalists and researchers
- Accuracy rate of editorial predictions vs. actual outcomes

### Operational Metrics

- Agent uptime % and success rate
- Posts per week (AI vs. human authored)
- Time from event to published post
- Indicator freshness (days since last outcome data update)
- Community: active contributors, pending reviews, edit proposals

---

## 13. Cost Structure

### Principle: "Pay for intelligence, not infrastructure"

| Component          | Technology                             | Monthly Cost   |
| ------------------ | -------------------------------------- | -------------- |
| Frontend hosting   | Vercel (free tier)                     | $0             |
| Database           | Supabase (free → $25 Pro)              | $0–25          |
| Agent compute      | GitHub Actions (free for public repos) | $0             |
| AI — routine tasks | NVIDIA NIM free tier (Qwen/DeepSeek)   | $0             |
| AI — deep analysis | Anthropic Claude Sonnet                | ~$20–30        |
| AI — embeddings    | NVIDIA NIM free tier                   | $0             |
| Domain             | drishtinepal.com                       | $12/year       |
| CDN                | Cloudflare (free)                      | $0             |
| X API              | Free tier (basic post + read)          | $0             |
| Facebook API       | Graph API (free)                       | $0             |
| **Total**          |                                        | **~$25–60/mo** |

Cost stays minimal because: static-first architecture (Vercel ISR), free AI tier for 95% of calls, GitHub Actions instead of a VPS, and open-source community labor.

---

_This is a living document. The scoring methodology will evolve as we learn what's measurable and what isn't. Every change will be versioned, publicly discussed, and applied transparently._
