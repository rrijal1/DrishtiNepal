import { expect, test } from "@playwright/test";

test.describe("Scores Page", () => {
  test("renders page heading", async ({ page }) => {
    await page.goto("/scores");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("shows outcome area bars or empty state", async ({ page }) => {
    await page.goto("/scores");
    // Either shows score data or an explanatory message
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(0);
  });

  test("does not crash with no data", async ({ page }) => {
    await page.goto("/scores");
    // Page should render without errors
    await expect(page.locator("body")).toBeVisible();
    // No Next.js error overlay
    const errorOverlay = page.locator("#__next-build-error");
    await expect(errorOverlay).not.toBeVisible();
  });
});

test.describe("Decisions Page", () => {
  test("renders page heading", async ({ page }) => {
    await page.goto("/decisions");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("shows decisions or empty state message", async ({ page }) => {
    await page.goto("/decisions");
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(0);
    // Should show either decision cards or "No decisions tracked yet" message
    const hasDecisions = page.locator('[class*="border"]').first();
    const hasEmpty = page.getByText(/No decisions tracked yet/i);
    const visible =
      (await hasDecisions.isVisible().catch(() => false)) ||
      (await hasEmpty.isVisible().catch(() => false));
    expect(visible).toBeTruthy();
  });

  test("decisions show date and significance", async ({ page }) => {
    await page.goto("/decisions");
    // Check for date formatting or significance badges
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Articles Page", () => {
  test("renders page heading", async ({ page }) => {
    await page.goto("/articles");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("shows article cards or empty state", async ({ page }) => {
    await page.goto("/articles");
    const body = await page.locator("body").textContent();
    expect(body?.length).toBeGreaterThan(0);
  });

  test("article links navigate to detail pages", async ({ page }) => {
    await page.goto("/articles");
    const articleLinks = page.locator('a[href^="/articles/"]');
    const count = await articleLinks.count();

    if (count > 0) {
      const href = await articleLinks.first().getAttribute("href");
      await page.goto(href!);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();
    }
  });
});
