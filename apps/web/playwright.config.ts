import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3001",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1280, height: 720 } },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 812 },
        isMobile: true,
      },
    },
  ],
  webServer: {
    command:
      "cd /Users/rrijal/Desktop/Create/NW/apps/web && node_modules/.bin/next build && node_modules/.bin/next start -p 3001",
    port: 3001,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
