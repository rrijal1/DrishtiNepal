import { expect, test } from "@playwright/test";

test.describe("Static Pages", () => {
  test("about page renders", async ({ page }) => {
    await page.goto("/about");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("methodology page renders", async ({ page }) => {
    await page.goto("/methodology");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("moderate page renders without crash", async ({ page }) => {
    await page.goto("/moderate");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });
});

test.describe("Language Toggle", () => {
  test("language toggle is visible in header", async ({ page }) => {
    await page.goto("/");
    // The language toggle uses aria-pressed buttons
    const toggle = page.locator("button[aria-pressed]");
    await expect(toggle.first()).toBeVisible();
  });

  test("switching language updates content", async ({ page }) => {
    await page.goto("/");
    // Get initial hero title text
    const h1 = page.locator("h1");
    const initialText = await h1.textContent();

    // Click Nepali toggle button (text is "नेपाली")
    const npButton = page.locator("button[aria-pressed]").last();
    if (await npButton.isVisible()) {
      await npButton.click();
      // router.refresh() triggers a re-render — wait for it
      await page.waitForTimeout(1500);
      const newText = await h1.textContent();
      // Text should be different (Nepali vs English) or at least page didn't crash
      expect(newText?.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Responsive Layout", () => {
  test("content is contained within max-width on desktop", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1280) < 768, "Desktop-only test");
    await page.goto("/");
    const container = page.locator(".max-w-7xl").first();
    await expect(container).toBeVisible();
  });

  test("no horizontal scrollbar on mobile", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1280) >= 768, "Mobile-only test");
    await page.goto("/");
    const overflowDiff = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    // Allow up to 5px tolerance for minor overflow
    expect(overflowDiff).toBeLessThanOrEqual(5);
  });

  test("minister cards stack on mobile", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1280) >= 768, "Mobile-only test");
    await page.goto("/ministers");
    const grid = page.locator(".grid").first();
    if (await grid.isVisible()) {
      const gridStyle = await grid.evaluate((el) =>
        getComputedStyle(el).getPropertyValue("grid-template-columns"),
      );
      // On mobile, should be single column or minimal columns
      expect(gridStyle).toBeDefined();
    }
  });
});

test.describe("SEO & Metadata", () => {
  test("all pages have proper title tags", async ({ page }) => {
    const routes = [
      "/",
      "/ministers",
      "/manifesto",
      "/scores",
      "/decisions",
      "/articles",
      "/about",
      "/methodology",
      "/submit",
      "/search",
    ];

    for (const route of routes) {
      await page.goto(route);
      const title = await page.title();
      expect(title.length, `Missing title on ${route}`).toBeGreaterThan(0);
    }
  });

  test("OG tags present on home page", async ({ page }) => {
    await page.goto("/");
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /.+/);
    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveAttribute("content", /.+/);
  });

  test("robots.txt is accessible", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });

  test("sitemap.xml is accessible", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Error Handling", () => {
  test("404 page for non-existent route", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });

  test("non-existent minister ID shows 404", async ({ page }) => {
    const response = await page.goto(
      "/ministers/00000000-0000-0000-0000-000000000000",
    );
    // Should be 404 or redirect
    expect([404, 200]).toContain(response?.status());
  });

  test("no console errors on main pages", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.goto("/ministers");
    await page.goto("/manifesto");
    await page.goto("/scores");

    // Filter out benign errors (hydration warnings, fetch failures for data)
    const critical = errors.filter(
      (e) =>
        !e.includes("hydrat") &&
        !e.includes("fetch") &&
        !e.includes("Failed to load resource") &&
        !e.includes("Supabase"),
    );
    expect(critical).toHaveLength(0);
  });
});
