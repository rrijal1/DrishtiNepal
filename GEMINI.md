# Drishti Nepal - Project Context

## Tech Stack & Environment

- Language: Python 3.13 (Latest)
- Database: Supabase (PostgreSQL + pgvector)
- Frontend: Next.js 14 (App Router)
- Primary AI Task: Web scraping (Playwright/BS4) and NLP classification.

## Coding Standards

- Use Type Hints for all Python functions.
- Async-first: Use `asyncio` and `httpx` for scrapers to maximize performance.
- Error Handling: Always wrap scraper logic in try-except blocks with logging.
- Data Privacy: Never hardcode API keys; use `.env` files.

## Project Specifics

- Bilingual Support: Ensure all data models support `name_en` and `name_np`.
- Scoring Logic: Reference the 70/30 weightage defined in the Implementation Plan.
- Source Attribution: Every "Action" object must have a `source_url`.
- Every Action must have a start time and a end time.

## AI Behavior

- When writing scrapers, prioritize RSS feeds before full-page HTML scraping.
- If a task involves Nepali text, suggest Unicode-compatible solutions.
