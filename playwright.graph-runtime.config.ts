import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "graph-intelligence.pw.ts",
  workers: 1,
  reporter: [["list"], ["json", { outputFile: process.env.GRAPH_QA_RESTART_STAGE === "true"
    ? "artifacts/graph-runtime-restart.json" : "artifacts/graph-runtime-browser.json" }]],
  use: { ...base.use, screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-light", use: { ...devices["Desktop Chrome"], colorScheme: "light" } },
    { name: "desktop-dark", use: { ...devices["Desktop Chrome"], colorScheme: "dark" } },
    { name: "mobile-light", use: { ...devices["Pixel 7"], colorScheme: "light" } },
    { name: "mobile-dark", use: { ...devices["Pixel 7"], colorScheme: "dark" } }
  ]
});
