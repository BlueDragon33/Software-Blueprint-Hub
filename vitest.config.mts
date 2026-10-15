import { defineConfig } from "vitest/config";

// Keep Next.js JSX-preserve settings in the app; compile JSX for all Vitest runs.
export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react"
    }
  }
});
