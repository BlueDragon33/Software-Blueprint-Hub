import { defineConfig, devices } from "@playwright/test";

/** Real headless Chromium against offline SSR of the shared view only.
 * No Next server, auth fixture, remote app, deployment or publication. */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "universal-next-action.pw.ts",
  fullyParallel: false,
  retries: 0,
  timeout: 20_000,
  reporter: [["list"]],
  use: { ...devices["Desktop Chrome"], trace:"retain-on-failure" },
  projects: [{ name:"chromium", use:{...devices["Desktop Chrome"]} }]
});
