import { defineConfig } from "@playwright/test";

/**
 * Playwright config for running tests against the live Vercel deployment.
 * Usage: npx playwright test --config=playwright.prod.config.ts
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: 1,
  reporter: [
    ["html", { open: "never", outputFolder: "test-results/prod" }],
    ["list"],
  ],
  use: {
    baseURL: "https://drishti-nepal.vercel.app",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1280, height: 720 } },
    },
  ],
  // No webServer - we're hitting the live deployment directly
});
