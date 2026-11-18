import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

import type { WorkflowNode } from "../../packages/application/src/prompt-workflow-core.mjs";
import WorkflowPreviewPage from "../../apps/web/app/projects/[projectId]/prompt/workflow/page";
import { WorkflowStudio } from "../../apps/web/app/projects/[projectId]/prompt/workflow/workflow-studio";
import { loadProjectWorkspace } from "../../apps/web/src/server/project-workspace";
import { readConstitutionalWorkflowCatalog, registeredWorkflowSummaries } from "../../apps/web/src/server/prompt-workflow";
import { REVIEWER_AB_P3_WORKFLOW } from "../../apps/web/src/server/reviewer-ab-preview-p3";

vi.mock("../../apps/web/app/projects/[projectId]/_components/project-workspace", () => ({
  ProjectWorkspaceFrame: ({ children }: { children: unknown }) => children,
  ProjectWorkspaceState: () => null
}));
vi.mock("../../apps/web/src/server/project-workspace", () => ({ loadProjectWorkspace: vi.fn() }));
vi.mock("../../apps/web/src/server/prompt-workflow", () => ({
  isRegisteredGovernedProject: () => true,
  inspectLatestWorkflowRootChange: vi.fn(),
  previewRegisteredWorkflowRoot: vi.fn(),
  readConstitutionalWorkflowCatalog: vi.fn(),
  readRegisteredWorkflowReadiness: vi.fn(),
  registeredWorkflowNodes: () => manifest.nodes,
  registeredWorkflowSummaries: vi.fn(),
  reviewerAbP3Binding: () => null
}));

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

  it("renders owner-only catalog as manifest graph, without pretending target canonical profile exists", () => {
    const markup = renderToStaticMarkup(createElement(WorkflowStudio, {
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
    expect(markup).toContain("Registry metadata only");
    expect(markup).toContain("Human gate");
    expect(markup).not.toContain("Canonical prompt + node projection");
    expect(markup).not.toContain("Inspect prompt");
    expect(markup).not.toContain("Gate PASS recorded");
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

describe("Reviewer A/B Constitution action", () => {
  const projectId = "project:blueprint-os";
  const constitutionHref = "/constitution#constitution-authority-set-title";

  async function renderSelectedWorkflow(owner: boolean, workflowId: string) {
    vi.mocked(loadProjectWorkspace).mockResolvedValue({
      state: "ready",
      actor: { principalId: owner ? "owner" : "reader" },
      projectId,
      project: { profile: { projectId } },
      runtime: { authority: { canExerciseConstitutionalAuthority: async () => owner } }
    } as Awaited<ReturnType<typeof loadProjectWorkspace>>);
    const workflows = [{
      projectId, workflowId, area: "Workflow", repository: "BlueDragon33/Software-Blueprint-Hub",
      branch: "main", workflowVersion: "1.0.0", status: "candidate",
      nodeCount: manifest.nodes.length, rootNodeIds: ["inventory"]
    }] as ReturnType<typeof registeredWorkflowSummaries>;
    vi.mocked(registeredWorkflowSummaries).mockReturnValue(workflows);
    vi.mocked(readConstitutionalWorkflowCatalog).mockResolvedValue(workflows);
    return renderToStaticMarkup(await WorkflowPreviewPage({
      params: Promise.resolve({ projectId }), searchParams: Promise.resolve({ workflowId })
    }));
  }

  it("links the Owner to the published authority set even before P3 is configured", async () => {
    const markup = await renderSelectedWorkflow(true, REVIEWER_AB_P3_WORKFLOW);
    expect(markup).toContain(`href="${constitutionHref}">Theo Hiến pháp</a>`);
    expect(markup).not.toContain("Record Preview P3 binding");
  });

  it("does not put the Owner action on a reader's view or another workflow", async () => {
    expect(await renderSelectedWorkflow(false, REVIEWER_AB_P3_WORKFLOW)).not.toContain(constitutionHref);
    expect(await renderSelectedWorkflow(true, "independent-workflow")).not.toContain(constitutionHref);
  });
});
