import { expect, test } from "@playwright/test";

test.describe("Header & Navigation", () => {
  test("sticky header is visible on page load", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header).toHaveCSS("position", "sticky");
  });

  test("logo links to home", async ({ page }) => {
    await page.goto("/ministers");
    const logo = page.locator('header a[href="/"]');
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL("/");
  });

  test("desktop nav links are visible on wide viewport", async ({ page }) => {
    // This test only runs on desktop (non-mobile project)
    test.skip((page.viewportSize()?.width ?? 1280) < 768, "Desktop-only test");
    await page.goto("/");
    const nav = page.locator("header nav");
    await expect(nav.first()).toBeVisible();

    const links = [
      "/ministers",
      "/decisions",
      "/manifesto",
      "/scores",
      "/articles",
      "/submit",
    ];
    for (const href of links) {
      await expect(page.locator(`header nav a[href="${href}"]`)).toBeVisible();
    }
  });

  test("mobile menu toggle works", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1280) >= 768, "Mobile-only test");
    await page.goto("/");
    // Menu should be hidden initially
    const mobileNav = page.locator("header nav.border-t");
    await expect(mobileNav).not.toBeVisible();

    // Click hamburger
    const menuBtn = page.locator('header button[aria-label="Open menu"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Mobile nav should now be visible
    const openNav = page.locator("header nav").last();
    await expect(openNav).toBeVisible();

    // Close menu
    const closeBtn = page.locator('header button[aria-label="Close menu"]');
    await closeBtn.click();
  });

  test("search icon links to search page", async ({ page }) => {
    await page.goto("/");
    const searchLink = page.locator('header a[href="/search"]');
    await expect(searchLink).toBeVisible();
    await searchLink.click();
    await expect(page).toHaveURL(/\/search/);
  });

  test("all nav links navigate to correct pages", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1280) < 768, "Desktop-only test");
    await page.goto("/");

    const routes = [
      { href: "/ministers", text: /Ministers|मन्त्रिपरिषद्/ },
      { href: "/decisions", text: /Decisions|निर्णय/ },
      { href: "/manifesto", text: /Manifesto|वाचा/ },
      { href: "/scores", text: /Scores|स्कोर/ },
      { href: "/articles", text: /Articles|लेख/ },
      { href: "/submit", text: /Submit|पेश/ },
    ];

    for (const route of routes) {
      await page.goto("/");
      await page.locator(`header nav a[href="${route.href}"]`).click();
      await expect(page).toHaveURL(route.href);
    }
  });
});
