# Manual Link Submissions — Drishti Nepal

Add article URLs here that the AI scraper missed. On every push to this file
(or on the next manual trigger), the `manual_links` agent will:

1. Fetch and read the full article at each URL
2. Run AI analysis (summary, category, ministers mentioned)
3. Match it to relevant bachha patra manifesto items (bp-001…bp-100)
4. Create a published post on the site
5. File the post under matching manifesto item pages

---

## Format

One URL per line, under the `## Links` section.

- Blank lines and lines starting with `#` are ignored.
- Duplicate URLs (already processed) are silently skipped.
- You can optionally add a `| hint` after the URL to help the AI with context.

**Example:**

```
https://ekantipur.com/news/2026/04/03/example-story.html
https://myrepublica.nagariknetwork.com/news/12345/ | anti-corruption arrest, bp-001
```

---

## Links

https://ekantipur.com/news/2026/04/03/shankar-group-owner-shankar-agarwal-arrested-01-00.html | anti-corruption arrest, integrity & governance, bp-001
