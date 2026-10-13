import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import type { WorkflowNode } from "../../packages/application/src/prompt-workflow-core.mjs";
import { WorkflowStudio } from "../../apps/web/app/projects/[projectId]/prompt/workflow/workflow-studio";

// pnpm isolates React dependencies within @blueprint-os/web, not repository root.
const fromWeb = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { renderToStaticMarkup } = fromWeb("react-dom/server") as { renderToStaticMarkup: (element: unknown) => string };
const { createElement } = fromWeb("react") as { createElement: (...args: unknown[]) => unknown };

const manifest = JSON.parse(readFileSync(
  new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url), "utf8"
)) as { nodes: WorkflowNode[] };

describe("Visual Workflow Studio semantic and fail-closed output", () => {
  it("renders real node controls, dependency paths, and no fake completed status", () => {
    const markup = renderToStaticMarkup(createElement(WorkflowStudio, {
      nodes: manifest.nodes,
      rootNodeIds: ["inventory"],
      preview: null,
      previewError: "Verified project HEAD unavailable"
    }));
    expect(markup.match(/aria-pressed="/g)).toHaveLength(7);
    expect(markup).toContain("aria-label=\"Workflow diagram");
    expect(markup).toContain("Required inputs");
    expect(markup).toContain("Preview unavailable");
    expect(markup).toContain("Verified project HEAD unavailable");
    expect(markup).toContain("Evidence required");
    expect(markup).toContain("Human gate");
    expect(markup).toContain("On failure: BLOCK");
    expect(markup).not.toContain("Gate PASS recorded");
    expect(markup.match(/marker-end=/g)).toHaveLength(6);
  });

  it("does not expose a long generated prompt until explicit inspect interaction", () => {
    const marker = "PRIVATE_PREVIEW_CONTENT_SHOULD_NOT_RENDER_BY_DEFAULT";
    const markup = renderToStaticMarkup(createElement(WorkflowStudio, {
      nodes: manifest.nodes,
      rootNodeIds: ["inventory"],
      preview: {
        rootNodeId: "inventory",
        content: marker,
        appHead: "a".repeat(40),
        canonicalRevision: "sha256:" + "b".repeat(64),
        sourceRevision: "sha256:" + "c".repeat(64),
        contentHash: "sha256:" + "d".repeat(64)
      },
      previewError: ""
    }));
    expect(markup).toContain("Inspect prompt");
    expect(markup).toContain("App HEAD");
    expect(markup).not.toContain(marker);
    expect(markup).toContain("aria-expanded=\"false\"");
  });
});
