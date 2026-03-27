# Drishti Nepal (दृष्टि नेपाल) — Cabinet Accountability Portal

## Implementation Plan

**Mission:** Hold Nepal's government accountable by tracking every cabinet minister's performance against Ra Swa Pa's _Bachha Patra_ (election manifesto) and _Pratigya Patra_ (commitment letter), delivering unbiased information to the public 24/7 through autonomous agents.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  DRISHTI NEPAL ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │  DATA AGENTS  │──▶│   CONTENT    │──▶│   WEB PORTAL     │   │
│  │  (Scrapers +  │   │   PIPELINE   │   │   (Next.js SSG)  │   │
│  │   AI Agents)  │   │  (AI Review) │   │                  │   │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘   │
│         │                  │                     │              │
│         ▼                  ▼                     ▼              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │  SOURCE DBs   │   │  SUPABASE    │   │  SOCIAL MEDIA    │   │
│  │  (News, Govt  │   │  (Postgres + │   │  PUBLISHER       │   │
│  │   Gazette)    │   │   Storage)   │   │  (FB + X Bot)    │   │
│  └──────────────┘   └──────────────┘   └──────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PUBLIC CONTRIBUTION SYSTEM (GitHub PRs + Review Queue)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SCORING ENGINE (Automated + Human Review Hybrid)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules

### Module 1: Minister Profile System

- **Profile Page** per minister: photo, portfolio, date of appointment, political background
- **Timeline View**: chronological feed of every action, decision, statement
- **Score Dashboard**: real-time score against manifesto commitments
- **Comparison View**: promised vs. delivered

### Module 2: Autonomous Data Agents (24/7)

Lightweight Python agents running on scheduled cron jobs (NOT always-on servers):

| Agent                | Frequency      | Source                                                                         | Purpose                                     |
| -------------------- | -------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| `news_scraper`       | Every 30 min   | Nepali news sites (ekantipur, onlinekhabar, ratopati, setopati, himalayatimes) | Collect minister-related news               |
| `gazette_monitor`    | Every 6 hrs    | Nepal Gazette (rajpatra)                                                       | Track official government decisions         |
| `parliament_tracker` | Every 2 hrs    | Parliament website                                                             | Track legislative activities                |
| `social_listener`    | Every 1 hr     | X/Twitter, FB                                                                  | Track minister statements                   |
| `manifesto_matcher`  | Every 12 hrs   | Internal DB                                                                    | Match actions against bachha/pratigya patra |
| `scoring_agent`      | Every 24 hrs   | Internal DB                                                                    | Recalculate minister scores                 |
| `content_generator`  | On new data    | AI Pipeline                                                                    | Generate analysis posts                     |
| `social_publisher`   | On new content | Portal DB                                                                      | Publish to FB and X                         |
| `scholarly_curator`  | Weekly         | Academic sources + AI                                                          | Generate political analysis                 |

### Module 3: Content Pipeline

```
Raw Data → AI Extraction → Fact Verification → Content Generation → Editorial Review → Publish
```

1. **Extraction**: AI agent extracts relevant facts from scraped news
2. **Deduplication**: NLP-based duplicate detection across sources
3. **Classification**: Auto-tag as achievement / failure / neutral / decision
4. **Manifesto Mapping**: Link to specific bachha patra / pratigya patra commitments
5. **Content Generation**: AI drafts analysis post (Nepali + English)
6. **Human Review Queue**: Flag high-impact posts for human editor review
7. **Auto-publish**: Low-risk factual updates publish automatically
8. **Social Distribution**: Auto-post to FB page and X account

### Module 4: Scoring Engine

Each minister scored on 0–100 scale across dimensions:

| Dimension              | Weight | Measurement                               |
| ---------------------- | ------ | ----------------------------------------- |
| Manifesto Compliance   | 30%    | Actions matching bachha patra commitments |
| Policy Effectiveness   | 20%    | Measurable outcomes of decisions          |
| Transparency           | 15%    | Public communication, RTI responses       |
| Financial Prudence     | 15%    | Budget utilization, corruption indicators |
| Public Sentiment       | 10%    | Aggregated from news and social media     |
| Parliamentary Activity | 10%    | Attendance, questions, bills              |

**Scoring methodology:**

- Each commitment from bachha/pratigya patra digitized as a checklist item
- AI agent matches government actions to checklist items
- Human reviewers validate AI-matched scores weekly
- Public can challenge scores via evidence-backed PRs

### Module 5: Public Contribution (PR System)

- **Web form** for evidence submission (not GitHub-native — too technical for public)
- Backend creates structured entries in review queue
- Required: source link, evidence screenshot, minister name, claim being challenged
- **Review workflow**: Auto-check → Community vote → Editor approval → Published
- Contributors earn reputation scores; top contributors featured

### Module 6: Scholarly Reflections

- Weekly AI-assisted deep analysis on policy trends
- Guest scholar submission portal
- Peer review by editorial board
- Long-form articles with citations

---

## 3. Technology Stack (Cost-Optimized)

### Frontend

| Component     | Technology                                 | Monthly Cost                                 |
| ------------- | ------------------------------------------ | -------------------------------------------- |
| Web Framework | **Next.js 14** (App Router, SSG + ISR)     | $0 (Vercel free tier covers ~100K pageviews) |
| Hosting       | **Vercel** (free → $20/mo Pro when needed) | $0–20                                        |
| UI Framework  | **Tailwind CSS** + **shadcn/ui**           | $0                                           |
| i18n          | **next-intl** (Nepali + English)           | $0                                           |
| Analytics     | **Umami** (self-hosted on same VPS)        | $0                                           |

### Backend & Database

| Component        | Technology                                            | Monthly Cost |
| ---------------- | ----------------------------------------------------- | ------------ |
| Database         | **Supabase** (Free tier: 500MB, 2 projects)           | $0–25        |
| Auth             | **Supabase Auth**                                     | $0           |
| Storage          | **Supabase Storage** (1GB free)                       | $0           |
| API Layer        | **Next.js API Routes** + **Supabase Edge Functions**  | $0           |
| Full-text Search | **Supabase pg_trgm** or **Meilisearch** (self-hosted) | $0           |

### AI & Agents

| Component                 | Technology                                          | Monthly Cost    |
| ------------------------- | --------------------------------------------------- | --------------- |
| Agent Runtime             | **Python** scripts on **cron** (VPS)                | Included in VPS |
| Cheap LLM (routine tasks) | **Claude 3.5 Haiku** / **GPT-4o-mini**              | ~$30–50         |
| Quality LLM (analysis)    | **Claude Sonnet** (weekly scholarly posts)          | ~$20–30         |
| Embeddings                | **Voyage AI** or **OpenAI text-embedding-3-small**  | ~$5             |
| Scraping                  | **Playwright** + **BeautifulSoup4**                 | $0              |
| NLP (Nepali)              | Custom fine-tuned models / **Google Translate API** | ~$10            |
| Agent Orchestration       | **LangGraph** or custom Python DAGs                 | $0              |

### Infrastructure

| Component           | Technology                                             | Monthly Cost |
| ------------------- | ------------------------------------------------------ | ------------ |
| VPS (agents + jobs) | **Hetzner CX22** (2 vCPU, 4GB RAM) or **DigitalOcean** | $5–10        |
| Domain              | drishtinepal.com / drishtinepal.com.np                 | $12/year     |
| SSL                 | **Let's Encrypt** (auto)                               | $0           |
| CDN                 | **Cloudflare** (free tier)                             | $0           |
| Email               | **Resend** (free tier: 3K emails/mo)                   | $0           |
| CI/CD               | **GitHub Actions** (free for public repos)             | $0           |
| Monitoring          | **Uptime Kuma** (self-hosted) + **Sentry** (free tier) | $0           |

### Social Media

| Component       | Technology                                                | Monthly Cost |
| --------------- | --------------------------------------------------------- | ------------ |
| X (Twitter) API | **Basic** tier ($100/mo) or **Free** (read + post limits) | $0–100       |
| Facebook API    | **Graph API** (free for page management)                  | $0           |
| Scheduling      | Custom Python bot on VPS cron                             | $0           |

### **Estimated Monthly Infra Cost: $70–250/mo**

---

## 4. Cost Optimization Strategies

### Principle: "Pay for intelligence, not infrastructure"

1. **Static-first architecture**: SSG pages rebuild on content change, not per-request. Cuts server costs to near-zero.

2. **Tiered AI usage**:
   - **Haiku/4o-mini** ($0.25/1M input tokens): News extraction, classification, deduplication, tagging — 95% of AI calls
   - **Sonnet** ($3/1M input tokens): Weekly scholarly analysis, complex manifesto matching — 5% of AI calls
   - **Never use Opus/GPT-4 for routine tasks**

3. **Smart scraping**:
   - RSS feeds first (free, structured)
   - Scrape only when RSS unavailable
   - Cache aggressively, deduplicate before AI processing
   - Respect rate limits to avoid IP blocks

4. **Edge caching**: Cloudflare CDN caches static content globally for free

5. **Batch processing**: Accumulate data, process in batches every 30 min instead of real-time (saves API calls)

6. **Open-source everything**: Public GitHub repo = free CI/CD, free community contributions

7. **Progressive scaling**: Start with free tiers, upgrade only when traffic demands

---

## 5. Revenue & Sustainability

Revenue and staffing details are maintained privately. The project targets self-sustainability through social media monetization, ad revenue, sponsored scholarly content, and community donations.

---

## 6. Data Model (Core Entities)

```
ministers
├── id (uuid)
├── name_en, name_np
├── photo_url
├── portfolio (ministry name)
├── party
├── appointed_date
├── previous_roles[]
├── bio_summary
├── overall_score (0–100)
└── status (active/resigned/reshuffled)

manifesto_items
├── id (uuid)
├── document_type (bachha_patra | pratigya_patra)
├── category (economy | health | education | infrastructure | governance | ...)
├── item_text_en, item_text_np
├── priority (high | medium | low)
├── status (not_started | in_progress | partially_fulfilled | fulfilled | broken)
└── assigned_ministers[] (fk → ministers)

actions
├── id (uuid)
├── minister_id (fk → ministers)
├── action_date
├── title_en, title_np
├── description_en, description_np
├── category (decision | statement | policy | legislation | scandal | achievement)
├── sentiment (positive | negative | neutral)
├── linked_manifesto_items[] (fk → manifesto_items)
├── sources[] (urls)
├── evidence_files[] (storage paths)
├── ai_confidence_score (0–1)
├── human_verified (boolean)
└── published (boolean)

cabinet_decisions
├── id (uuid)
├── decision_date
├── title_en, title_np
├── summary_en, summary_np
├── full_text_url
├── category
├── impact_assessment
├── linked_manifesto_items[]
├── responsible_ministers[]
└── gazette_reference

scores
├── id (uuid)
├── minister_id (fk → ministers)
├── period (date range)
├── manifesto_compliance (0–100)
├── policy_effectiveness (0–100)
├── transparency (0–100)
├── financial_prudence (0–100)
├── public_sentiment (0–100)
├── parliamentary_activity (0–100)
├── overall (weighted 0–100)
├── calculated_at
└── methodology_version

posts (published content)
├── id (uuid)
├── type (news_update | analysis | scholarly | cabinet_decision | score_update)
├── title_en, title_np
├── body_en, body_np (markdown)
├── minister_ids[]
├── tags[]
├── author (agent | human | scholar_name)
├── status (draft | review | published | archived)
├── published_at
├── fb_post_id
├── x_post_id
├── fb_published (boolean)
└── x_published (boolean)

public_submissions
├── id (uuid)
├── submitter_name (optional)
├── submitter_email
├── target_post_id (fk → posts, optional)
├── target_minister_id (fk → ministers)
├── claim_text
├── evidence_urls[]
├── evidence_files[]
├── submission_type (support | challenge | new_info)
├── status (pending | under_review | accepted | rejected)
├── reviewer_notes
└── submitted_at

scholarly_articles
├── id (uuid)
├── title_en, title_np
├── author_name, author_bio
├── body_en, body_np (markdown)
├── category (policy_analysis | political_economy | governance | opinion)
├── peer_reviewed (boolean)
├── published_at
└── post_id (fk → posts)
```

---

## 7. Agent Pipeline Detail

### Agent 1: News Scraper (`agents/news_scraper.py`)

```
Schedule: Every 30 minutes

Whitelisted Sources — Nepali:
  - ekantipur.com (RSS + scrape)
  - onlinekhabar.com (RSS)
  - ratopati.com (RSS)
  - setopati.net (RSS)
  - nagariknews.nagariknetwork.com (RSS)
  - himalayakhabar.com (scrape)

Whitelisted Sources — English:
  - kathmandupost.com (RSS)
  - nepalitimes.com (RSS)
  - recordnepal.com (scrape)
  - theannapurnaexpress.com (RSS)
  - myrepublica.nagariknetwork.com (RSS)

Whitelisted Sources — Government / Official:
  - rajpatra.dop.gov.np (Nepal Gazette)
  - opmcm.gov.np (PM & Cabinet Office)
  - hr.parliament.gov.np (House of Representatives)
  - na.parliament.gov.np (National Assembly)
  - mof.gov.np (Ministry of Finance)
  - npc.gov.np (National Planning Commission)
  - oag.gov.np (Auditor General)
  - election.gov.np (Election Commission)
  - ciaa.gov.np (CIAA - Anti-Corruption)

Pipeline:
1. Fetch RSS feeds / scrape headlines
2. Filter: keyword match against minister names, party names, ministry names
3. Deduplicate against existing entries (title similarity > 0.85)
4. For new articles: fetch full text
5. AI Extract (Haiku): {minister, action, date, category, sentiment, summary}
6. Store in `raw_news` table with source attribution
7. Flag for content pipeline
```

### Agent 2: Content Generator (`agents/content_generator.py`)

```
Trigger: New raw_news entries flagged
Pipeline:
1. Batch unprocessed news items (max 20 per run)
2. Group by minister
3. AI Generate (Haiku):
   - Bilingual summary (EN/NP)
   - Classification (achievement/failure/neutral/decision)
   - Link to manifesto items (similarity search against embeddings)
4. Auto-publish if: factual news update + AI confidence > 0.9
5. Queue for human review if: opinion/analysis + confidence < 0.9
6. Create `posts` entry
```

### Agent 3: Social Publisher (`agents/social_publisher.py`)

```
Trigger: New published post
Pipeline:
1. Generate social-optimized text (280 chars for X, longer for FB)
2. Generate card image (minister photo + headline + score) using Pillow/Canvas
3. Post to X via API
4. Post to FB Page via Graph API
5. Store post IDs for engagement tracking
6. Respect rate limits and optimal posting times (Nepal timezone)
```

### Agent 4: Scoring Agent (`agents/scoring_agent.py`)

```
Schedule: Daily at midnight NPT
Pipeline:
1. For each active minister:
   a. Count actions by category in scoring period
   b. Calculate manifesto compliance: fulfilled_items / total_assigned_items
   c. Aggregate sentiment from news coverage
   d. Check parliamentary records
   e. AI Analysis (Sonnet, weekly): qualitative assessment
2. Apply weighted formula
3. Store new score snapshot
4. If score changed significantly (>5 pts): generate score update post
5. Update minister profile overall_score
```

### Agent 5: Manifesto Matcher (`agents/manifesto_matcher.py`)

```
Schedule: Every 12 hours
Pipeline:
1. Load all manifesto items with embeddings
2. Load recent unmatched actions
3. For each action:
   a. Compute embedding similarity against manifesto items
   b. If similarity > threshold: create candidate link
   c. AI Verify (Haiku): "Does this action fulfill/violate this manifesto item?"
4. Update manifesto item status
5. Flag significant matches for human review
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1–2)

- [ ] Set up GitHub repository (public)
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Supabase project (DB + Auth + Storage)
- [ ] Design and create database schema
- [ ] Digitize Ra Swa Pa bachha patra + pratigya patra into structured data
- [ ] Create minister profiles (current cabinet)
- [ ] Build basic portal: home, minister list, minister profile pages
- [ ] Deploy to Vercel

### Phase 2: Agent Infrastructure (Week 3–4)

- [ ] Set up VPS (Hetzner/DigitalOcean)
- [ ] Build news scraper agent (start with 3 sources)
- [ ] Build content generator agent
- [ ] Build manifesto matcher agent
- [ ] Set up cron scheduling
- [ ] Build admin dashboard for monitoring agents

### Phase 3: Content & Scoring (Week 5–6)

- [ ] Build scoring engine
- [ ] Build cabinet decision tracker
- [ ] Create minister timeline view
- [ ] Create manifesto tracker dashboard
- [ ] Build editorial review queue (admin panel)
- [ ] First round of content generation + human review

### Phase 4: Social & Distribution (Week 7–8)

- [ ] Set up FB Page (Drishti Nepal / दृष्टि नेपाल) — @DrishtiNepalHQ
- [ ] Set up X account (@DrishtiNepalHQ)
- [ ] Build social publisher agent
- [ ] Build card image generator
- [ ] Optimize posting schedule for Nepal audience
- [ ] Start daily publishing

### Phase 5: Public Participation (Week 9–10)

- [ ] Build public submission form
- [ ] Build review queue for submissions
- [ ] Build contributor reputation system
- [ ] Add comment system (Supabase-based)
- [ ] Community guidelines and moderation rules

### Phase 6: Monetization & Scale (Week 11–12)

- [ ] Apply for FB Page monetization
- [ ] Apply for X creator monetization
- [ ] Add Google AdSense to portal
- [ ] Add donation page (eSewa/Khalti integration for Nepal)
- [ ] Hire team members
- [ ] Launch PR campaign

---

## 9. Nepali Language Strategy

- All content bilingual: Nepali (primary) + English
- AI generates in English first, then translates to Nepali via:
  - Google Translate API for first pass
  - Human editor polishes Nepali text
- UI in both languages with toggle
- Social posts: Nepali for FB (larger Nepali audience), English for X (diaspora + international)
- Nepali Unicode font support (Preeti/Kantipur fonts NOT used — standard Unicode devanagari)

---

## 10. Editorial & Ethics Guidelines

### Principles

1. **Factual accuracy above speed** — Never publish unverified claims
2. **Source attribution** — Every claim linked to verifiable source
3. **Political neutrality** — Track ALL parties equally (start with Ra Swa Pa as they're in power; expand)
4. **Right of reply** — Ministers/offices can submit corrections
5. **Transparent methodology** — Scoring formula publicly documented
6. **AI transparency** — Label AI-generated content clearly

### Content Review Tiers

- **Tier 1 (Auto-publish)**: Factual news summaries, score updates, gazette references
- **Tier 2 (Quick review)**: Action classifications, manifesto linkages
- **Tier 3 (Full review)**: Scholarly articles, opinion pieces, controversy-related posts
- **Tier 4 (Editor-in-Chief)**: Anything potentially defamatory or legally sensitive

### Legal Considerations (Nepal)

- Comply with Nepal's Electronic Transactions Act, 2063
- Comply with Press and Publication Act
- No defamation — stick to verifiable facts
- Register as online media with Press Council Nepal (if required)
- Data privacy: don't collect unnecessary personal data from users

---

## 11. Risk Mitigation

| Risk                            | Mitigation                                                                 |
| ------------------------------- | -------------------------------------------------------------------------- |
| AI generates inaccurate content | Multi-tier review system; AI confidence thresholds; human oversight        |
| Legal threats from politicians  | Stick to facts, source everything, legal counsel on retainer               |
| Scraper blocked by news sites   | Rotate user agents, use RSS first, multiple source redundancy              |
| Social media account suspended  | Follow platform TOS strictly, avoid spam patterns, appeal process ready    |
| Funding gap before monetization | Minimal burn rate ($500/mo), crowdfunding, NGO grants                      |
| Agent downtime                  | Monitoring + alerts (Uptime Kuma), auto-restart (systemd), manual fallback |
| Bias accusations                | Transparent methodology, public scoring formula, accept corrections        |
| Data loss                       | Daily automated backups to Cloudflare R2 (free tier)                       |

---

## 12. Key Metrics to Track

- **Portal**: Daily active users, page views, time on site, bounce rate
- **Social**: Follower growth, engagement rate, reach, shares
- **Content**: Posts/week, AI vs human authored ratio, accuracy rate
- **Revenue**: Monthly revenue by channel, cost per post, revenue per follower
- **Impact**: Government responses to coverage, manifesto items status changes, public submissions/month
- **Technical**: Agent uptime %, scraper success rate, AI cost per article

---

_This plan is designed to be lean, automated, transparent, and sustainable. The key insight is that autonomous AI agents handle the high-volume repetitive work (scraping, classification, scoring), while humans focus on quality control, editorial judgment, and community building._
