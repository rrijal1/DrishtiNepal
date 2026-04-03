# 🇳🇵 Drishti Nepal — दृष्टि नेपाल

**Nepal's open accountability platform. Every cabinet minister. Every manifesto promise. Tracked publicly, scored transparently, powered by citizens and AI.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 👇 How to Contribute (No Coding Required)

### 1 — Submit a news article we missed

Found an article about a minister's action, a corruption arrest, a broken promise — something our search didn't pick up? Add it in one line:

**Edit [`data/manual_links.md`](data/manual_links.md)** — add your URL under `## Links`:

```
https://ekantipur.com/news/your-article.html | brief hint about what it covers
```

Open a pull request. An editor reviews and merges it.

> **No GitHub account?** Submit directly at [drishtinepal.com/submit](https://drishtinepal.com/submit).

---

### 2 — Submit evidence for a specific commitment

Is a government action progressing (or violating) a specific bachha patra promise? Go to the commitment's page on the site:

```
drishtinepal.com/manifesto/bp-001   ← Integrity & Governance
drishtinepal.com/manifesto/bp-023   ← Education reform
drishtinepal.com/manifesto/bp-061   ← Jobs & employment
... (bp-001 to bp-100)
```

Click **"+ Propose an indicator"** or **"Report a government action"**, or [submit here](https://drishtinepal.com/submit).

---

### 3 — Correct our data

Found a scoring error, a wrong date, a missing minister link? Click **"+ Propose a correction"** on any manifesto item page, or open a [GitHub issue](https://github.com/rrijal1/DrishtiNepal/issues) with:

- The exact URL on the site
- What's wrong
- A source link to what it should be

---

### 4 — Contribute code or data

See [`docs/contributing.md`](docs/contributing.md) for technical contribution guidelines. The codebase is fully open — web portal (Next.js), AI agents (Python), database schema (Supabase/Postgres).

---

## What is Drishti Nepal?

Drishti Nepal (दृष्टि नेपाल — "Nepal's Vision") is a non-partisan civic tech platform that holds the RSP-led cabinet accountable to their own published promises.

**What we track:**

- Every minister from Day 1 of their appointment
- 100 Bachha Patra foundations (bp-001 to bp-100) — RSP's policy commitments
- 5 Karar Patra priority areas — GDP growth, governance, jobs, infrastructure, diaspora
- Cabinet decisions, gazette entries, parliamentary records

**How scoring works:**

| Component        | Weight | Measures                                                    |
| ---------------- | ------ | ----------------------------------------------------------- |
| Outcome Score    | 50%    | Real-world indicators — GDP, jobs created, laws passed      |
| Initiative Score | 30%    | Status of each commitment: fulfilled / in progress / broken |
| Evidence Score   | 20%    | Community and AI-verified evidence quality                  |

No credit for speeches. No credit for promises. Only verified delivery counts.

Full methodology: [drishtinepal.com/methodology](https://drishtinepal.com/methodology)

---

## What We Will Never Do

- Accept money from any political party or politician
- Run paid political ads or sponsored political content
- Alter or suppress content based on financial pressure
- Hide our funding sources

AI-generated content is always labeled. Human editors review sensitive material before publication.

---

## Project Structure (for developers)

```
NW/
├── apps/web/          # Next.js portal (TypeScript)
├── agents/            # Python AI agents (scraper, generator, matcher, scorer…)
├── data/
│   ├── manual_links.md        ← Submit missed articles here
│   ├── manifesto/             # Bachha patra + karar patra JSON
│   └── ministers/             # Cabinet member profiles
├── supabase/migrations/       # Database schema
└── .github/workflows/         # Automated pipelines
```

---

## Disclaimer

Drishti Nepal is a non-partisan civic project, not affiliated with any political party or government body. We track all parties equally against their own stated commitments, using publicly available information. Methodology is fully public and open to peer review.

---

Built with ❤️ for Nepal's democracy. &nbsp; 📘 [Facebook](https://facebook.com/DrishtiNepalHQ) &nbsp;·&nbsp; 🐦 [@DrishtiNepalHQ](https://x.com/DrishtiNepalHQ) &nbsp;·&nbsp; 📷 [@drishtinepal_hq](https://www.instagram.com/drishtinepal_hq/)
