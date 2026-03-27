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

## Architecture

```
Nepali News Sources → AI Scraper Agents → Content Pipeline → Web Portal → Social Media
                                                  ↕
                              Public Submissions ← Review Queue → Published
```

**Tech stack:** Next.js (portal) · Supabase (DB) · Python (agents) · Claude AI (analysis) · Vercel (hosting)

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
source venv/bin/activate
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
├── docs/              # Methodology, guidelines
└── .github/           # CI/CD workflows
```

## Contributing

We welcome contributions! See [docs/contributing.md](docs/contributing.md) for:

- How to submit evidence as a citizen
- How to contribute code as a developer
- Editorial guidelines and review process

## License

MIT License — see [LICENSE](LICENSE) for details.

## Disclaimer

Drishti Nepal is a non-partisan civic technology project. We track government performance based on publicly available information sourced from whitelisted Nepali news outlets and official government websites. We are not affiliated with any political party. All scoring methodologies are [publicly documented](docs/scoring_methodology.md).

### Social Media

- **Facebook**: [facebook.com/DrishtiNepalHQ](https://facebook.com/DrishtiNepalHQ)
- **X (Twitter)**: [@DrishtiNepalHQ](https://x.com/DrishtiNepalHQ)

---

Built with ❤️ for Nepal's democracy.
