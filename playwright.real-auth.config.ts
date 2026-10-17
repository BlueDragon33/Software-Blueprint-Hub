import { defineConfig, devices } from "@playwright/test";
import { requireRealAuthEnvironment } from "./tests/e2e/continuous-authenticated-environment";

// Intentionally NEVER launches a replacement server or issues an auth cookie.
// Run only against an already running, independently authenticated localhost.
const env=requireRealAuthEnvironment();
export default defineConfig({
  testDir:"./tests/e2e",
  testMatch:"**/continuous-execution-authenticated.real.ts",
  fullyParallel:false,workers:1,retries:0,
  reporter:[["list"]],
  use:{
    ...devices["Desktop Chrome"],
    baseURL:env.baseURL,
    trace:"off",screenshot:"off",video:"off"
  },
  projects:[{name:"real-localhost-chromium",use:{...devices["Desktop Chrome"]}}],
  timeout:45000,
  expect:{timeout:12000}
});
