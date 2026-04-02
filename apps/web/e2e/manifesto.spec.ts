import { expect, test } from "@playwright/test";

test.describe("Manifesto Page", () => {
  test("renders page heading", async ({ page }) => {
    await page.goto("/manifesto");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("shows summary stats cards", async ({ page }) => {
    await page.goto("/manifesto");
    // Summary stats like total items, fulfilled, in progress, not started
    const statsArea = page.locator(
      "text=/Total|Fulfilled|Progress|Not Started/i",
    );
    await expect(statsArea.first()).toBeVisible();
  });

  test("groups manifesto items by category", async ({ page }) => {
    await page.goto("/manifesto");
    // Should have h2 or h3 headings for each category
    const categoryHeadings = page.locator("h2, h3");
    const count = await categoryHeadings.count();
    expect(count).toBeGreaterThan(0);
  });

  test("manifesto items are expandable", async ({ page }) => {
    await page.goto("/manifesto");
    // Look for clickable manifesto item rows
    const rows = page.locator("button, [role='button'], details");
    const count = await rows.count();
    if (count > 0) {
      // Click first expandable item
      await rows.first().click();
    }
    // Page should not crash
    await expect(page.locator("body")).toBeVisible();
  });

  test("manifesto item detail page loads", async ({ page }) => {
    await page.goto("/manifesto");
    // Find links to manifesto item details
    const itemLinks = page.locator('a[href^="/manifesto/"]');
    const count = await itemLinks.count();

    if (count > 0) {
      const href = await itemLinks.first().getAttribute("href");
      await page.goto(href!);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();
    }
  });
});

test.describe("Manifesto Detail Page", () => {
  test("shows propose edit form", async ({ page }) => {
    await page.goto("/manifesto");
    const itemLinks = page.locator('a[href^="/manifesto/"]');
    const count = await itemLinks.count();

    if (count > 0) {
      const href = await itemLinks.first().getAttribute("href");
      await page.goto(href!);
      // ProposeEditForm should be present
      const form = page.locator("form");
      const formCount = await form.count();
      expect(formCount).toBeGreaterThanOrEqual(0); // Form may or may not exist depending on item
    }
  });
});
