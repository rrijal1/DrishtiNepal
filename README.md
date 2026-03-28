# Drishti Nepal (दृष्टि नेपाल)

**Holding Nepal's government accountable through transparent, AI-powered tracking of every cabinet decision and manifesto commitment.**

[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://drishtinepal.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What is Drishti Nepal?

Drishti Nepal (दृष्टि नेपाल — "Nepal's Vision") is a public accountability portal that:

- 📊 **Tracks every cabinet minister** from the day they're appointed
- ✅ **Scores performance** against Ra Swa Pa's bachha patra (100 policy foundations) and karar patra (citizen's agreement)
- 🤖 **Autonomous AI agents** monitor news 24/7, classify actions, and generate reports
- 📰 **Scholarly analysis** of political decisions and their impact
- 🗳️ **Public contributions** — citizens can submit evidence to support or challenge claims
- 📱 **Social distribution** — all content auto-published to Facebook and X

### Language

Content is published in **natural mixed Nepali-English** — the way educated Nepalis actually discuss politics. Core political terms stay in Nepali (मन्त्री, सरकार, बजेट, जवाफदेहिता), while technical/English-origin words (infrastructure, GDP, policy) stay in English. The portal, social posts, and articles all follow this natural code-switching style, plus fully separate English and Nepali versions where needed.

### What We Will Never Do

- Accept money from political parties or politicians
- Run paid political ads or sponsored political content
- Sell user data
- Suppress or alter content based on financial pressure
- Hide our funding sources

---

## Scoring Methodology

Each minister receives a transparent 0–100 score across two dimensions:

| Dimension             | Weight | What It Measures                                                                                                                                          |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manifesto Compliance  | 70%    | Actions matching bachha patra & karar patra commitments (GDP targets, remittance, industry, education, infrastructure, and every other stated commitment) |
| Public Accountability | 30%    | What the manifesto can't capture: media sentiment, ministerial transparency (press conferences, RTI responses), and parliamentary engagement              |

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
- **Instagram**: [@drishtinepal_hq](https://www.instagram.com/drishtinepal_hq/)

All accounts are monetized (or will be once eligibility is met). See [Transparency & Monetization](#transparency--monetization) above.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Disclaimer

Drishti Nepal is a **non-partisan** civic technology project. We are not affiliated with any political party, government office, or political organization. We track government performance based on publicly available information from whitelisted Nepali news outlets and official government websites. Our scoring methodology is fully public and open to peer review.

AI-generated content is always labeled. Human editors review sensitive content. We operate transparently and publish our costs, revenue, and methodology openly.

If you find errors in our data or analysis, please [submit a correction](https://drishtinepal.com/submit) or open a [GitHub issue](https://github.com/rrijal1/DrishtiNepal/issues).

---

Built with ❤️ for Nepal's democracy.
