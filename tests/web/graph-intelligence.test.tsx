import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { buildGraphIntelligence } from "../../packages/application/src/graph-intelligence";
import { GraphIntelligenceStudio } from "../../apps/web/app/projects/[projectId]/evidence-graph/graph-intelligence-studio";
import GraphLoading from "../../apps/web/app/projects/[projectId]/evidence-graph/loading";
import GraphError from "../../apps/web/app/projects/[projectId]/evidence-graph/error";
import { graphFixture } from "../fixtures/graph-intelligence";

const fromWeb = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { renderToStaticMarkup } = fromWeb("react-dom/server") as { renderToStaticMarkup: (element: unknown) => string };
const { createElement } = fromWeb("react") as { createElement: (...args: unknown[]) => unknown };

describe("Graph Intelligence semantic rendering", () => {
  it("renders overview, keyboard controls, three distinct states and source provenance", () => {
    const graph = buildGraphIntelligence(graphFixture());
    const html = renderToStaticMarkup(createElement(GraphIntelligenceStudio, { graph }));
    expect(html).toContain("Graph Intelligence Studio");
    expect(html).toContain("không phải LLM");
    expect(html).toContain("aria-controls=");
    expect(html).toContain("source-contract");
    expect(html).toContain("source-contract-runtime-unobserved");
    expect(html).toContain("separate-human-authority");
    expect(html).not.toContain("Gate PASS recorded");
    expect(html).not.toContain("dispatch-agent");
    expect(html.match(/class="[^"]*node[^\"]*"/g)?.length).toBeGreaterThan(0);
    expect(html).toContain("https://github.com/BlueDragon33/Software-Blueprint-Hub/blob/" + "c".repeat(40));
  });
  it("does not fabricate a code SHA or evidence authentication when build metadata is absent", () => {
    const graph = buildGraphIntelligence({ ...graphFixture(), sourceCodeRevision: null });
    const html = renderToStaticMarkup(createElement(GraphIntelligenceStudio, { graph }));
    expect(html).toContain("UNVERIFIED");
    expect(html).not.toContain("https://github.com/");
    expect(html).toContain("Digest");
  });
  it("offers explicit empty/loading/error recovery without fallback success", () => {
    const graph = { ...buildGraphIntelligence(graphFixture()), nodes: [], edges: [], findings: [] };
    const empty = renderToStaticMarkup(createElement(GraphIntelligenceStudio, { graph }));
    expect(empty).toContain("Chưa có nguồn đồ thị");
    expect(renderToStaticMarkup(createElement(GraphLoading))).toContain("role=\"status\"");
    expect(renderToStaticMarkup(createElement(GraphError, { reset: () => {} }))).toContain("Retry project graph");
  });
});
