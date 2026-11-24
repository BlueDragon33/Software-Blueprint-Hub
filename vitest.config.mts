import { defineConfig } from "vitest/config";

// Keep Next.js JSX-preserve settings in the app; compile JSX for all Vitest runs.
export default defineConfig({
  // Native .mjs tests belong to node --test, not Vitest discovery.
  test: { include: ["tests/**/*.test.{ts,tsx}"] },
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react"
    }
  }
});
