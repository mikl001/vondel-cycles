import { defineConfig, devices } from "@playwright/test";

/**
 * E2E against the local stack: requires `npx supabase start` + seeded DB.
 * Reuses a running dev server; in CI it starts one itself.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // checkout tests mutate stock; keep them ordered
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "nl-NL",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/nl",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
