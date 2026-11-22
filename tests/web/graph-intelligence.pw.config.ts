import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".", testMatch: "graph-intelligence.pw.ts", fullyParallel: false, retries: 0,
  reporter: [["list"], ["json", { outputFile: "artifacts/graph-intelligence-browser.json" }]],
  use: { baseURL: "http://127.0.0.1:3107", launchOptions: process.env.GRAPH_QA_CHROMIUM ? { executablePath: process.env.GRAPH_QA_CHROMIUM } : {},
    screenshot: "only-on-failure" },
  webServer: { cwd: process.cwd(), command: "node tests/web/graph-harness/server.mjs", url: "http://127.0.0.1:3107/tests/web/graph-harness/index.html", reuseExistingServer: false },
  projects: [
    { name: "desktop-light", use: { viewport: { width: 1440, height: 1000 }, colorScheme: "light" } },
    { name: "desktop-dark", use: { viewport: { width: 1440, height: 1000 }, colorScheme: "dark" } },
    { name: "mobile-light", use: { viewport: { width: 390, height: 844 }, colorScheme: "light", isMobile: true, hasTouch: true } },
    { name: "mobile-dark", use: { viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true, hasTouch: true } }
  ]
});
