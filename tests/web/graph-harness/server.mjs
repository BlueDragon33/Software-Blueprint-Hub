// Loopback-only fixture harness. Reuses the project's existing Vite/React dependencies.
import { createRequire } from "node:module";
const rootRequire = createRequire(new URL("../../../package.json", import.meta.url));
const fromVitest = createRequire(rootRequire.resolve("vitest/package.json"));
const fromWeb = createRequire(new URL("../../../apps/web/package.json", import.meta.url));
const { createServer } = await import(fromVitest.resolve("vite"));
const server = await createServer({
  configFile: false,
  plugins: [{ name: "graph-fixture-only", configureServer(vite) {
vite.middlewares.use(async (req, res, next) => {
  if (!req.url?.startsWith("/__graph-fixture")) return next();
  try {
    const { graphFixture } = await vite.ssrLoadModule("/tests/fixtures/graph-intelligence.ts");
    const { buildGraphIntelligence } = await vite.ssrLoadModule("/packages/application/src/graph-intelligence.ts");
    const fixture = graphFixture();
    const mode = new URL(req.url, "http://127.0.0.1:3107").searchParams.get("case");
    if (mode === "large") fixture.workPackages = Array.from({ length: 500 }, (_, i) => ({
      ...fixture.workPackages[0], id: "work:large-" + String(i).padStart(4, "0"), title: "Fixture Work " + i
    }));
    let graph = buildGraphIntelligence(fixture);
    if (mode === "empty") graph = { ...graph, nodes: [], edges: [], findings: [] };
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(graph));
  } catch (error) {
    res.statusCode = 500; res.end(String(error));
  }
});
  } }],
  oxc: { jsx: { runtime: "automatic", importSource: "react" } },
  resolve: { alias: [
    { find: "react-dom/client", replacement: fromWeb.resolve("react-dom/client") },
    { find: /^react$/, replacement: fromWeb.resolve("react") },
    { find: "react/jsx-runtime", replacement: fromWeb.resolve("react/jsx-runtime") },
    { find: "react/jsx-dev-runtime", replacement: fromWeb.resolve("react/jsx-dev-runtime") }
  ] },
  ssr: { noExternal: [/^@blueprint-os\//] },
  server: { host: "127.0.0.1", port: 3107, strictPort: true },
  appType: "mpa"
});

await server.listen();
console.log("Graph fixture QA available at http://127.0.0.1:3107/tests/web/graph-harness/index.html");
