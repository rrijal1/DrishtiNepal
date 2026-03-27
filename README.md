# Drishti Nepal (दृष्टि नेपाल)

**Holding Nepal's government accountable through transparent, AI-powered tracking of every cabinet decision and manifesto commitment.**

[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://drishtinepal.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What is Drishti Nepal?

Drishti Nepal (दृष्टि नेपाल — "Nepal's Vision") is a public accountability portal that:

- 📊 **Tracks every cabinet minister** from the day they're appointed
- ✅ **Scores performance** against Ra Swa Pa's bachha patra (election manifesto) and pratigya patra (commitment letter)
- 🤖 **Autonomous AI agents** monitor news 24/7, classify actions, and generate reports
- 📰 **Scholarly analysis** of political decisions and their impact
- 🗳️ **Public contributions** — citizens can submit evidence to support or challenge claims
- 📱 **Social distribution** — all content auto-published to Facebook and X

### Language

Content is published in **natural mixed Nepali-English** — the way educated Nepalis actually discuss politics. Core political terms stay in Nepali (मन्त्री, सरकार, बजेट, जवाफदेहिता), while technical/English-origin words (infrastructure, GDP, policy) stay in English. The portal, social posts, and articles all follow this natural code-switching style, plus fully separate English and Nepali versions where needed.

## Architecture

```
Nepali News Sources → AI Scraper Agents → Content Pipeline → Web Portal → Social Media
                                                  ↕
                              Public Submissions ← Review Queue → Published
```

**Tech stack:** Next.js (portal) · Supabase (DB) · Python (agents) · Claude AI (analysis) · Vercel (hosting)

---

## Transparency & Monetization

**We believe in being completely honest about how this project works and sustains itself.**

### How We Make Money

Drishti Nepal is an open-source civic tech project. To sustain operations and pay our team, we monetize through:

| Channel | How | Status |
|---------|-----|--------|
| **Facebook Page** | Meta in-stream ads and branded content on @DrishtiNepalHQ | Planned — requires 10K followers + eligibility |
| **X (Twitter)** | Creator ad revenue sharing on @DrishtiNepalHQ | Planned — requires 500 followers + 5M impressions/3 months |
| **Google AdSense** | Display ads on the web portal (drishtinepal.com) | Planned — applied once traffic qualifies |
| **Donations** | Voluntary contributions from the public | Planned |

**When you see a Drishti Nepal post on Facebook or X, it may contain ads placed by the platform. We earn a share of that ad revenue.** This is how we fund the project. We will never accept money from any political party, government entity, or politically-affiliated organization.

### What We Spend Money On

| Expense | Monthly Cost | Notes |
|---------|-------------|-------|
| VPS (agent hosting) | $5–10 | Hetzner CX22 |
| AI API calls (Claude) | $50–100 | 95% cheap model, 5% quality model |
| Domain + CDN | ~$1 | Cloudflare free tier + domain renewal |
| Web hosting | $0 | Vercel free tier |
| Database | $0–25 | Supabase free tier initially |
| X API access | $0–100 | Free tier has limits; may upgrade |
| **Total infrastructure** | **~$60–240/mo** | |
| **Team (5 people in Nepal)** | **~$1,400–2,000/mo** | Editor, moderator, social manager, tech lead, community manager |
| **Total monthly burn** | **~$1,500–2,200/mo** | |

### Will This Be Self-Sustaining?

**Honest answer: we don't know yet.** Here's our realistic assessment:

- **Months 1–3**: We operate at a loss. Revenue is $0. We bootstrap with personal funds (~$500/mo minimum to cover infra + minimal team).
- **Months 3–6**: If we hit social media monetization thresholds (10K FB followers, 500 X followers), ad revenue starts trickling in. Optimistically $200–600/mo.
- **Months 6–12**: If content quality is high and audience grows, revenue could reach $1,000–2,500/mo through ads + donations.
- **Break-even target**: ~$1,500/mo. This requires significant audience growth and consistent content quality.

**Risk of running out of money**: If we can't reach monetization thresholds within 6 months, the project will need either external funding (grants, NGO partnerships) or will need to scale down to a volunteer-only operation. We are designing the system to run with minimal human intervention specifically to survive lean periods.

### What We Will Never Do

- Accept money from political parties or politicians
- Run paid political ads or sponsored political content
- Sell user data
- Suppress or alter content based on financial pressure
- Hide our funding sources

---

## Scoring Methodology

Each minister receives a transparent 0–100 score across six weighted dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Manifesto Compliance | 30% | Actions matching bachha/pratigya patra commitments |
| Policy Effectiveness | 20% | Measurable outcomes of decisions |
| Transparency | 15% | Public communication, RTI responses |
| Financial Prudence | 15% | Budget use, audit findings |
| Public Sentiment | 10% | Aggregated from news coverage |
| Parliamentary Activity | 10% | Attendance, questions, bills |

Full methodology: [/methodology](https://drishtinepal.com/methodology) on the portal.

### AI Transparency

- All AI-generated content is **clearly labeled** as such
- AI handles: news extraction, classification, scoring, draft generation
- Humans handle: editorial review, fact-checking, sensitivity decisions
- We use Claude (Anthropic) — Haiku for routine tasks, Sonnet for deep analysis
- AI confidence scores determine whether content auto-publishes or goes to human review

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- Supabase account (free tier)
- Anthropic API key

### Setup

```bash
# Clone
git clone git@github.com:rrijal1/DrishtiNepal.git
cd DrishtiNepal

# Environment
cp .env.example .env
# Fill in API keys

# Web portal
cd apps/web
npm install
npm run dev

# Agents (separate terminal)
cd agents
python -m venv venv
source venv/activate
pip install -r requirements.txt

# Run a single agent
python -m agents.news_scraper.scraper

# Run all agents on schedule
python -m agents.scheduler
```

### Database Setup

```bash
# Using Supabase CLI
npx supabase init
npx supabase db push
```

Or manually run `supabase/migrations/001_initial_schema.sql` against your Supabase database.

## Project Structure

```
NW/
├── apps/web/          # Next.js portal (TypeScript)
├── agents/            # Python autonomous agents
├── data/              # Manifesto data, minister profiles
├── supabase/          # Database migrations
├── infra/             # Docker, systemd, cron configs
├── docs/              # Editorial guidelines, contributing guide
└── .github/           # CI/CD workflows
```

## Contributing

We welcome contributions! See [docs/contributing.md](docs/contributing.md) for:

- How to submit evidence as a citizen
- How to contribute code as a developer
- Editorial guidelines and review process

## Social Media

- **Facebook**: [facebook.com/DrishtiNepalHQ](https://facebook.com/DrishtiNepalHQ)
- **X (Twitter)**: [@DrishtiNepalHQ](https://x.com/DrishtiNepalHQ)

Both accounts are monetized (or will be once eligibility is met). See [Transparency & Monetization](#transparency--monetization) above.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Disclaimer

Drishti Nepal is a **non-partisan** civic technology project. We are not affiliated with any political party, government office, or political organization. We track government performance based on publicly available information from whitelisted Nepali news outlets and official government websites. Our scoring methodology is fully public and open to peer review.

AI-generated content is always labeled. Human editors review sensitive content. We operate transparently and publish our costs, revenue, and methodology openly.

If you find errors in our data or analysis, please [submit a correction](https://drishtinepal.com/submit) or open a [GitHub issue](https://github.com/rrijal1/DrishtiNepal/issues).

---

Built with ❤️ for Nepal's democracy.
