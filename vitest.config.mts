import { defineConfig } from "vitest/config";

// Keep Next.js JSX-preserve settings in the app; compile JSX for all Vitest runs.
export default defineConfig({
  // Native node:test .mjs suites run with node --test (including in CI).
  // They must not be reinterpreted as empty Vitest suites.
  test: { include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"] },
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react"
    }
  }
});
