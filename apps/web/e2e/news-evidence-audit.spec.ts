/**
 * Playwright audit: verify News & Evidence data on manifesto detail pages.
 * Runs against the live Vercel site for a representative sample of pages.
 *
 * Usage:
 *   npx playwright test e2e/news-evidence-audit.spec.ts --config=playwright.prod.config.ts
 *
 * Each test checks one manifesto page and annotates with counts.
 * Use --grep to target a specific slug, e.g. --grep bp-021
 */
import { expect, test } from "@playwright/test";

const PROD_BASE = "https://drishti-nepal.vercel.app";

// Sample across all five Karar Patra policy areas
const SAMPLE_SLUGS = [
  "bp-001",
  "bp-005",
  "bp-010",
  "bp-015",
  "bp-018", // pp-001 Governance
  "bp-021",
  "bp-030",
  "bp-040",
  "bp-050",
  "bp-060", // pp-002 Economy
  "bp-065",
  "bp-070",
  "bp-075",
  "bp-080", // pp-003 Jobs
  "bp-082",
  "bp-088",
  "bp-092",
  "bp-095", // pp-004 Connected
  "bp-097",
  "bp-100", // pp-005 Diaspora
];

const EMPTY_STATE = "No news articles or evidence assessments linked yet.";

test.describe.configure({ mode: "parallel" });

test.describe("News & Evidence — live site audit", () => {
  for (const slug of SAMPLE_SLUGS) {
    test(`${slug} — News & Evidence section`, async ({ page }, testInfo) => {
      const url = `${PROD_BASE}/manifesto/${slug}`;

      const response = await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 20_000,
      });
      expect(response?.status(), `${slug} returned 404`).not.toBe(404);

      // Wait for the News & Evidence heading
      await expect(
        page.locator("text=News & Evidence"),
        `${slug}: News & Evidence heading missing`,
      ).toBeVisible({ timeout: 10_000 });

      const isEmpty = await page.locator(`text=${EMPTY_STATE}`).isVisible();

      if (isEmpty) {
        // Annotate the test with the empty state — doesn't fail, just records
        testInfo.annotations.push({
          type: "data-state",
          description: "EMPTY — no news/evidence linked",
        });
        console.log(`❌ ${slug}: EMPTY — no news/evidence linked`);
      } else {
        const evidenceCount = await page
          .locator("text=Evidence Assessment")
          .count();
        const newsCount = await page.locator('a[href^="/articles/"]').count();

        testInfo.annotations.push({
          type: "data-state",
          description: `HAS DATA — ${evidenceCount} evidence, ${newsCount} news`,
        });
        console.log(
          `✅ ${slug}: ${evidenceCount} evidence, ${newsCount} news articles`,
        );

        // Assert that at least one piece of data is actually visible
        expect(
          evidenceCount + newsCount,
          `${slug}: section is non-empty but counts are zero`,
        ).toBeGreaterThan(0);
      }
    });
  }
});
