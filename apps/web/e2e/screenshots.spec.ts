import { expect, test } from "@playwright/test";

/**
 * Full-page screenshots for every route and key UI component.
 * These serve as a visual audit of the site's rendered state.
 */

const PAGES = [
  { name: "home", path: "/" },
  { name: "manifesto", path: "/manifesto" },
  { name: "ministers", path: "/ministers" },
  { name: "articles", path: "/articles" },
  { name: "scores", path: "/scores" },
  { name: "decisions", path: "/decisions" },
  { name: "submit", path: "/submit" },
  { name: "search", path: "/search" },
  { name: "about", path: "/about" },
  { name: "methodology", path: "/methodology" },
];

test.describe("Full-page screenshots", () => {
  for (const { name, path } of PAGES) {
    test(`${name} page renders without errors`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.status()).toBeLessThan(500);
      // No Next.js error overlay
      await expect(page.locator("#__next-build-error")).not.toBeVisible();
      await expect(page.locator("body")).toBeVisible();
      await page.screenshot({
        path: `test-results/screenshots/${name}.png`,
        fullPage: true,
      });
    });
  }
});

test.describe("Component screenshots", () => {
  test("header and nav on desktop", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1280) < 768, "Desktop-only");
    await page.goto("/", { waitUntil: "networkidle" });
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await header.screenshot({
      path: "test-results/screenshots/header-desktop.png",
    });
  });

  test("mobile menu open", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1280) >= 768, "Mobile-only");
    await page.goto("/", { waitUntil: "networkidle" });
    const menuBtn = page.locator('header button[aria-label="Open menu"]');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(300);
      await page.locator("header").screenshot({
        path: "test-results/screenshots/header-mobile-open.png",
      });
    }
  });

  test("hero section", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();
    await hero.screenshot({
      path: "test-results/screenshots/hero.png",
    });
  });

  test("manifesto progress ring", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const progressSection = page.getByText("Manifesto Progress").locator("..");
    if (await progressSection.isVisible()) {
      await progressSection.screenshot({
        path: "test-results/screenshots/manifesto-progress-ring.png",
      });
    }
  });

  test("manifesto area cards", async ({ page }) => {
    await page.goto("/manifesto", { waitUntil: "networkidle" });
    await page.screenshot({
      path: "test-results/screenshots/manifesto-full.png",
      fullPage: true,
    });
  });

  test("manifesto accordion expand", async ({ page }) => {
    await page.goto("/manifesto", { waitUntil: "networkidle" });
    // Click the first expandable item
    const expandableBtn = page.locator("button, [role='button']").first();
    if (await expandableBtn.isVisible()) {
      await expandableBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: "test-results/screenshots/manifesto-accordion-expanded.png",
        fullPage: true,
      });
    }
  });

  test("manifesto detail page", async ({ page }) => {
    await page.goto("/manifesto", { waitUntil: "networkidle" });
    const detailLink = page.locator('a[href^="/manifesto/"]').first();
    if (await detailLink.isVisible()) {
      const href = await detailLink.getAttribute("href");
      await page.goto(href!, { waitUntil: "networkidle" });
      await page.screenshot({
        path: "test-results/screenshots/manifesto-detail.png",
        fullPage: true,
      });
    }
  });

  test("minister cards", async ({ page }) => {
    await page.goto("/ministers", { waitUntil: "networkidle" });
    await page.screenshot({
      path: "test-results/screenshots/ministers-grid.png",
      fullPage: true,
    });
  });

  test("minister detail page", async ({ page }) => {
    await page.goto("/ministers", { waitUntil: "networkidle" });
    const ministerLink = page.locator('a[href^="/ministers/"]').first();
    if (await ministerLink.isVisible()) {
      const href = await ministerLink.getAttribute("href");
      await page.goto(href!, { waitUntil: "networkidle" });
      await page.screenshot({
        path: "test-results/screenshots/minister-detail.png",
        fullPage: true,
      });
    }
  });

  test("footer", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const footer = page.locator("footer");
    if (await footer.isVisible()) {
      await footer.screenshot({
        path: "test-results/screenshots/footer.png",
      });
    }
  });

  test("language toggle switches to Nepali", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const npButton = page.locator("button[aria-pressed]").last();
    if (await npButton.isVisible()) {
      await npButton.click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: "test-results/screenshots/home-nepali.png",
        fullPage: true,
      });
    }
  });
});
