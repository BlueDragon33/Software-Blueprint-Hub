import { defineConfig } from "vitest/config";

// Vite 8 uses Oxc, not esbuild, for JSX transform. Override only this
// isolated Next.js component test, leaving the app's JSX-preserve policy intact.
export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react"
    }
  },
  test: {
    environment: "node",
    include: ["tests/web/workflow-studio.test.tsx", "tests/web/hub-launcher.test.tsx"]
  }
});
