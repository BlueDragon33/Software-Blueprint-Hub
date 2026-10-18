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
      repository: "BlueDragon33/Application-Management",
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
    expect(markup).toContain("Hỗ trợ / Next Action");
    expect(markup).toContain("Copyable Next Action fallback");
    expect(markup).toContain("verify exact HEAD");
    expect(markup).not.toContain("Gate PASS recorded");
    expect(markup.match(/marker-end=/g)).toHaveLength(6);
  });

  it("renders owner-only catalog as manifest graph, without pretending target canonical profile exists", () => {
    const markup = renderToStaticMarkup(createElement(WorkflowStudio, {
      repository: "BlueDragon33/Application-Management",
      nodes: manifest.nodes,
      rootNodeIds: ["inventory"],
      graphOnly: true,
      preview: null,
      previewError: "No canonical target Project Profile is authorized",
      readinessError: "Registry metadata only, no signed readiness"
    }));
    expect(markup.match(/aria-pressed="/g)).toHaveLength(7);
    expect(markup).toContain("Manifest candidate");
    expect(markup).toContain("Central catalog only");
    expect(markup).toContain("Hỗ trợ / Next Action");
    expect(markup).toContain("verify exact HEAD");
    expect(markup).toContain("Registry metadata only");
    expect(markup).toContain("Human gate");
    expect(markup).not.toContain("Canonical prompt + node projection");
    expect(markup).not.toContain("Inspect prompt");
    expect(markup).not.toContain("Gate PASS recorded");
  });

  it("does not expose a long generated prompt until explicit inspect interaction", () => {
    const marker = "PRIVATE_PREVIEW_CONTENT_SHOULD_NOT_RENDER_BY_DEFAULT";
    const markup = renderToStaticMarkup(createElement(WorkflowStudio, {
      repository: "BlueDragon33/Application-Management",
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
    expect(markup).toContain("Hỗ trợ / Next Action");
    expect(markup).toContain("at verified source HEAD");
    expect(markup).toContain("Copyable Next Action fallback");
    expect(markup).not.toContain(marker);
    expect(markup).toContain("aria-expanded=\"false\"");
  });
});
