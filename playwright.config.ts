import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.TEST_BASE_URL || "https://aurra-v6em.onrender.com",
    trace: "on-first-retry",
    extraHTTPHeaders: {
      // Skip ngrok-style interstitials if base ever points at ngrok
      "ngrok-skip-browser-warning": "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
