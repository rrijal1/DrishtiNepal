import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("renders hero section with title and CTAs", async ({ page }) => {
    await page.goto("/");
    // Hero title should be visible
    await expect(page.locator("h1")).toBeVisible();
    // CTA buttons (may be stacked on mobile but still present in DOM)
    await expect(page.locator('a[href="/manifesto"]').first()).toBeAttached();
    await expect(page.locator('a[href="/ministers"]').first()).toBeAttached();
  });

  test("displays stat pills", async ({ page }) => {
    await page.goto("/");
    // Stat pills section — at least one stat visible
    const stats = page
      .locator("text=Ministers Tracked")
      .or(page.locator("text=मन्त्री ट्र्याक गरिएको"));
    await expect(stats.first()).toBeVisible();
  });

  test("renders manifesto progress section", async ({ page }) => {
    await page.goto("/");
    const heading = page
      .getByText("Manifesto Progress")
      .or(page.getByText("वाचा पत्र प्रगति"));
    await expect(heading.first()).toBeVisible();
    // Ring chart SVG should be present
    await expect(page.locator("svg circle").first()).toBeVisible();
  });

  test("renders minister grid section", async ({ page }) => {
    await page.goto("/");
    // Section heading for ministers
    const heading = page
      .getByText("Cabinet Ministers")
      .or(page.getByText("मन्त्रिपरिषद्का सदस्यहरू"));
    await expect(heading.first()).toBeVisible();
  });

  test("renders recent decisions section", async ({ page }) => {
    await page.goto("/");
    const heading = page
      .getByText("Latest Cabinet Decisions")
      .or(page.getByText("पछिल्ला क्याबिनेट निर्णयहरू"));
    await expect(heading.first()).toBeVisible();
  });

  test("renders recent analysis section", async ({ page }) => {
    await page.goto("/");
    const heading = page
      .getByText("Recent Analysis")
      .or(page.getByText("हालैका विश्लेषणहरू"));
    await expect(heading.first()).toBeVisible();
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Drishti Nepal/);
  });

  test("has proper meta description", async ({ page }) => {
    await page.goto("/");
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute(
      "content",
      /Nepal|cabinet|accountability/i,
    );
  });
});
