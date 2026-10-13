import { defineConfig } from "vitest/config";

// Next.js preserves JSX for its own compiler; isolated Vitest SSR needs JSX
// transformed instead. Scope this override only to the workflow-studio tests.
export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
    tsconfigRaw: {
      compilerOptions: {
        jsx: "react-jsx"
      }
    }
  },
  test: {
    environment: "node",
    include: ["tests/web/workflow-studio.test.tsx"]
  }
});
