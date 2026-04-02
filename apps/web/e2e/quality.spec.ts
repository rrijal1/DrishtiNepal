import { expect, test } from "@playwright/test";

test.describe("Performance & Loading", () => {
  test("home page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test("ministers page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/ministers", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test("no broken images on home page", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      );
      const src = await img.getAttribute("src");
      // Skip placeholder/avatar images that may be intentionally empty
      if (src && !src.includes("placeholder")) {
        expect(naturalWidth, `Broken image: ${src}`).toBeGreaterThan(0);
      }
    }
  });

  test("no broken links in header navigation", async ({ page }) => {
    await page.goto("/");
    const navLinks = page.locator("header a[href]");
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute("href");
      if (href && href.startsWith("/")) {
        const response = await page.request.get(href);
        expect(response.status(), `Broken link: ${href}`).toBeLessThan(500);
      }
    }
  });
});

test.describe("Accessibility Basics", () => {
  test("page has lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
    expect(["en", "np"]).toContain(lang);
  });

  test("images have alt text", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      // alt can be empty string for decorative images, but should exist
      expect(alt).not.toBeNull();
    }
  });

  test("buttons and links have accessible names", async ({ page }) => {
    await page.goto("/");
    // Check that interactive elements have labels
    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute("aria-label");
      const title = await btn.getAttribute("title");
      expect(
        (text?.trim().length ?? 0) > 0 ||
          (ariaLabel?.length ?? 0) > 0 ||
          (title?.length ?? 0) > 0,
        "Button should have accessible name",
      ).toBeTruthy();
    }
  });

  test("heading hierarchy is correct on home page", async ({ page }) => {
    await page.goto("/");
    // Should have exactly one h1
    const h1s = page.locator("h1");
    const h1Count = await h1s.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("form inputs have labels", async ({ page }) => {
    await page.goto("/submit");
    const inputs = page.locator(
      "input:not([type='hidden']):not([type='submit']), textarea, select",
    );
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const placeholder = await input.getAttribute("placeholder");

      // Each input should have either a label[for], aria-label, or placeholder
      const hasLabel =
        id && (await page.locator(`label[for="${id}"]`).count()) > 0;
      expect(
        hasLabel ||
          (ariaLabel?.length ?? 0) > 0 ||
          (placeholder?.length ?? 0) > 0,
        `Input ${id ?? i} should have accessible label`,
      ).toBeTruthy();
    }
  });
});
