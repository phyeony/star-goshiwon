import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || "3100");
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      E2E_TEST_MODE: "true",
      PAYPAL_FAKE: "true",
      NEXT_PUBLIC_SITE_URL: baseURL,
      DEV_EMAIL_OVERRIDE: "playwright@example.com",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
