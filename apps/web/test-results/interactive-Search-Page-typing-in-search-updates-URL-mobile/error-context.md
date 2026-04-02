# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: interactive.spec.ts >> Search Page >> typing in search updates URL
- Location: e2e/interactive.spec.ts:18:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /q=test/
Received string:  "http://localhost:3001/search"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    13 × unexpected value "http://localhost:3001/search"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "द Drishti Nepal दृष्टि नेपाल" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e5]: द
        - generic [ref=e6]:
          - generic [ref=e7]: Drishti Nepal
          - generic [ref=e8]: दृष्टि नेपाल
      - generic [ref=e9]:
        - link "Search" [ref=e10] [cursor=pointer]:
          - /url: /search
          - img [ref=e11]
        - group "Language selector" [ref=e14]:
          - button "EN" [pressed] [ref=e15]
          - button "नेपाली" [ref=e16] [cursor=pointer]
        - button "Open menu" [ref=e17]:
          - img [ref=e18]
  - main [ref=e20]:
    - generic [ref=e21]:
      - heading "Search" [level=1] [ref=e22]
      - generic [ref=e23]:
        - img [ref=e24]
        - searchbox "Search ministers, manifesto commitments, articles…" [active] [ref=e27]: test query
      - generic [ref=e29]:
        - img [ref=e30]
        - paragraph [ref=e33]: Search across ministers, manifesto commitments, and articles.
  - contentinfo [ref=e34]:
    - generic [ref=e35]:
      - generic [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]:
            - generic [ref=e39]: द
            - generic [ref=e40]:
              - paragraph [ref=e41]: Drishti Nepal
              - paragraph [ref=e42]: दृष्टि नेपाल
          - paragraph [ref=e43]: Holding Nepal's government accountable through transparent, AI-powered tracking.
        - generic [ref=e44]:
          - heading "Portal" [level=4] [ref=e45]
          - list [ref=e46]:
            - listitem [ref=e47]:
              - link "Ministers" [ref=e48] [cursor=pointer]:
                - /url: /ministers
            - listitem [ref=e49]:
              - link "Cabinet Decisions" [ref=e50] [cursor=pointer]:
                - /url: /decisions
            - listitem [ref=e51]:
              - link "Manifesto Tracker" [ref=e52] [cursor=pointer]:
                - /url: /manifesto
            - listitem [ref=e53]:
              - link "Score Dashboard" [ref=e54] [cursor=pointer]:
                - /url: /scores
        - generic [ref=e55]:
          - heading "Participate" [level=4] [ref=e56]
          - list [ref=e57]:
            - listitem [ref=e58]:
              - link "Submit Evidence" [ref=e59] [cursor=pointer]:
                - /url: /submit
            - listitem [ref=e60]:
              - link "Read Analysis" [ref=e61] [cursor=pointer]:
                - /url: /articles
            - listitem [ref=e62]:
              - link "GitHub" [ref=e63] [cursor=pointer]:
                - /url: https://github.com/rrijal1/DrishtiNepal
            - listitem [ref=e64]:
              - link "About Us" [ref=e65] [cursor=pointer]:
                - /url: /about
        - generic [ref=e66]:
          - heading "Follow Us" [level=4] [ref=e67]
          - list [ref=e68]:
            - listitem [ref=e69]:
              - link "Facebook" [ref=e70] [cursor=pointer]:
                - /url: https://facebook.com/DrishtiNepalHQ
            - listitem [ref=e71]:
              - link "X (Twitter)" [ref=e72] [cursor=pointer]:
                - /url: https://x.com/DrishtiNepalHQ
            - listitem [ref=e73]:
              - link "Instagram" [ref=e74] [cursor=pointer]:
                - /url: https://www.instagram.com/drishtinepal_hq/
          - generic [ref=e75]:
            - heading "Methodology" [level=4] [ref=e76]
            - paragraph [ref=e77]:
              - text: All scoring is
              - link "publicly documented" [ref=e78] [cursor=pointer]:
                - /url: /methodology
              - text: . AI-generated content is clearly labeled.
      - paragraph [ref=e80]: © 2026 Drishti Nepal. Open source under MIT License. Non-partisan civic technology.
  - button "Open Next.js Dev Tools" [ref=e86] [cursor=pointer]:
    - img [ref=e87]
  - alert [ref=e90]
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | 
  3   | test.describe("Search Page", () => {
  4   |   test("renders search input", async ({ page }) => {
  5   |     await page.goto("/search");
  6   |     const input = page.locator('input[type="text"], input[type="search"]');
  7   |     await expect(input.first()).toBeVisible();
  8   |   });
  9   | 
  10  |   test("search with query shows results or empty state", async ({ page }) => {
  11  |     await page.goto("/search?q=minister");
  12  |     // Wait for search to complete
  13  |     await page.waitForTimeout(1000);
  14  |     const body = await page.locator("body").textContent();
  15  |     expect(body?.length).toBeGreaterThan(0);
  16  |   });
  17  | 
  18  |   test("typing in search updates URL", async ({ page }) => {
  19  |     await page.goto("/search");
  20  |     const input = page
  21  |       .locator('input[type="text"], input[type="search"]')
  22  |       .first();
  23  |     await input.fill("test query");
  24  |     // Wait for debounce
  25  |     await page.waitForTimeout(500);
> 26  |     await expect(page).toHaveURL(/q=test/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  27  |   });
  28  | 
  29  |   test("short query does not trigger search", async ({ page }) => {
  30  |     await page.goto("/search");
  31  |     const input = page
  32  |       .locator('input[type="text"], input[type="search"]')
  33  |       .first();
  34  |     await input.fill("a");
  35  |     await page.waitForTimeout(500);
  36  |     // Should not show results section for single char
  37  |     const body = page.locator("body");
  38  |     await expect(body).toBeVisible();
  39  |   });
  40  | });
  41  | 
  42  | test.describe("Submit Page", () => {
  43  |   test("renders form with all required fields", async ({ page }) => {
  44  |     await page.goto("/submit");
  45  |     const heading = page.getByRole("heading", { level: 1 });
  46  |     await expect(heading).toBeVisible();
  47  |     await expect(heading).toHaveText(/Submit Evidence/i);
  48  | 
  49  |     // Check form fields exist
  50  |     const form = page.locator("form");
  51  |     await expect(form).toBeVisible();
  52  | 
  53  |     // Select dropdown for type
  54  |     const typeSelect = page.locator("select").first();
  55  |     await expect(typeSelect).toBeVisible();
  56  | 
  57  |     // Text inputs
  58  |     const inputs = page.locator("input, textarea");
  59  |     const count = await inputs.count();
  60  |     expect(count).toBeGreaterThanOrEqual(3);
  61  |   });
  62  | 
  63  |   test("form validation prevents empty submission", async ({ page }) => {
  64  |     await page.goto("/submit");
  65  |     // Try to submit empty form
  66  |     const submitBtn = page.locator('button[type="submit"]');
  67  |     if (await submitBtn.isVisible()) {
  68  |       await submitBtn.click();
  69  |       // Form should use HTML5 validation or stay on page
  70  |       await expect(page).toHaveURL(/\/submit/);
  71  |     }
  72  |   });
  73  | 
  74  |   test("form shows success after valid submission", async ({ page }) => {
  75  |     await page.goto("/submit");
  76  |     const form = page.locator("form");
  77  |     if (await form.isVisible()) {
  78  |       // Fill out form
  79  |       await page.locator("select").first().selectOption("evidence");
  80  |       const inputs = page.locator("input");
  81  |       const textareas = page.locator("textarea");
  82  | 
  83  |       // Fill text fields that are visible
  84  |       for (let i = 0; i < (await inputs.count()); i++) {
  85  |         const input = inputs.nth(i);
  86  |         const type = await input.getAttribute("type");
  87  |         if (type === "email") {
  88  |           await input.fill("test@example.com");
  89  |         } else if (type === "url") {
  90  |           await input.fill("https://example.com");
  91  |         } else if (await input.isVisible()) {
  92  |           await input.fill("Test submission from Playwright");
  93  |         }
  94  |       }
  95  | 
  96  |       for (let i = 0; i < (await textareas.count()); i++) {
  97  |         await textareas
  98  |           .nth(i)
  99  |           .fill("Detailed description for testing purposes.");
  100 |       }
  101 |     }
  102 |     // Don't actually submit — just verify form is fillable
  103 |     await expect(page.locator("body")).toBeVisible();
  104 |   });
  105 | });
  106 | 
```