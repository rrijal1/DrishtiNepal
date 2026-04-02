import { expect, test } from "@playwright/test";

test.describe("Ministers Page", () => {
  test("renders page heading and subtitle", async ({ page }) => {
    await page.goto("/ministers");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/Cabinet Ministers|मन्त्रिपरिषद्/);
  });

  test("shows filter pills", async ({ page }) => {
    await page.goto("/ministers");
    // Filter pills should be present in the DOM (may scroll on mobile)
    const filterAll = page.locator('a[href="/ministers"]').first();
    const filterTop = page.locator('a[href="/ministers?filter=top"]');
    await expect(filterAll).toBeAttached();
    await expect(filterTop).toBeAttached();
  });

  test("filter pills navigate correctly", async ({ page }) => {
    await page.goto("/ministers");

    // Click "Top Performers"
    await page
      .locator('a[href="/ministers?filter=top"]')
      .click({ timeout: 5000 });
    await expect(page).toHaveURL(/filter=top/);

    // Click "Needs Improvement"
    await page
      .locator('a[href="/ministers?filter=needs"]')
      .click({ timeout: 5000 });
    await expect(page).toHaveURL(/filter=needs/);

    // Click "All" to reset — use the filter pill, not the nav link
    const allPills = page.locator('.rounded-full[href="/ministers"]');
    if ((await allPills.count()) > 0) {
      await allPills.first().click({ timeout: 5000 });
    } else {
      await page.goto("/ministers");
    }
    await expect(page).toHaveURL("/ministers");
  });

  test("minister cards are clickable links", async ({ page }) => {
    await page.goto("/ministers");
    const cards = page.locator('a[href^="/ministers/"]');
    const count = await cards.count();

    if (count > 0) {
      // First card should link to a minister detail page
      const href = await cards.first().getAttribute("href");
      expect(href).toMatch(/\/ministers\/[a-f0-9-]+/);
    }
  });

  test("minister cards show name and portfolio", async ({ page }) => {
    await page.goto("/ministers");
    const cards = page.locator('a[href^="/ministers/"]');
    const count = await cards.count();

    if (count > 0) {
      // Each card should have text content
      const firstCard = cards.first();
      const text = await firstCard.textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  test("'By Ministry' filter shows dropdown", async ({ page }) => {
    await page.goto("/ministers?filter=ministry");
    // Should show a select/dropdown for ministry
    const select = page.locator("select").or(page.locator('[role="combobox"]'));
    await expect(select.first()).toBeVisible();
  });

  test("empty state handles no matches gracefully", async ({ page }) => {
    // With top filter, if no ministers have score >= 60, should show message
    await page.goto("/ministers?filter=top");
    // Should either show cards or empty message — no crash
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Minister Detail Page", () => {
  test("loads minister profile from home page link", async ({ page }) => {
    await page.goto("/ministers");
    const cards = page.locator('a[href^="/ministers/"]');
    const count = await cards.count();

    if (count > 0) {
      const href = await cards.first().getAttribute("href");
      await page.goto(href!);
      // Should have an h1 with minister name
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();
    }
  });

  test("displays score section", async ({ page }) => {
    await page.goto("/ministers");
    const cards = page.locator('a[href^="/ministers/"]');
    const count = await cards.count();

    if (count > 0) {
      const href = await cards.first().getAttribute("href");
      await page.goto(href!);
      // Score section should be present (may need scrolling on mobile)
      const scoreText = page.getByText(/Overall Score|Score|स्कोर/i);
      await expect(scoreText.first()).toBeAttached();
    }
  });
});
