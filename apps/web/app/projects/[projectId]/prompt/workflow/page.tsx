import Link from "next/link";

import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../../../src/server/project-workspace";
import {
  candidateVisaWorkflowStages,
  previewVisaWorkflowRoot,
  VISA_WORKFLOW_PROJECT_ID
} from "../../../../../../src/server/prompt-workflow";

export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ projectId: string }>;
}

export default async function WorkflowPreviewPage({ params }: Props) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);
  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }
  if (workspace.projectId !== VISA_WORKFLOW_PROJECT_ID) {
    return (
      <ProjectWorkspaceFrame profile={workspace.project.profile} active="prompt">
        <section className="workspace-module-state">
          <h2>No central workflow assigned</h2>
          <p>This project has no reviewed workflow mapping. No repository state has been invented.</p>
        </section>
      </ProjectWorkspaceFrame>
    );
  }

  const stages = candidateVisaWorkflowStages();
  let preview: Awaited<ReturnType<typeof previewVisaWorkflowRoot>> | null = null;
  let blocked = "";
  try {
    preview = await previewVisaWorkflowRoot(workspace.actor, workspace.projectId);
  } catch (error) {
    blocked = error instanceof Error ? error.message : "Trusted canonical source unavailable";
  }

  return (
    <ProjectWorkspaceFrame profile={workspace.project.profile} active="prompt">
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Central Prompt Workflow · candidate</p>
          <h2>Visa/KD-MID form recovery</h2>
          <p>
            This is a controlled, read-only multi-node production workflow owned by
            Blueprint OS. It does not authorize execution, Quality Gate PASS or Production release.
          </p>
          <Link href={"../prompt"}>Back to canonical Prompt Workspace</Link>
        </div>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Dependency-aware stages</p>
            <h3>Seven linked node contracts</h3>
          </div>
        </div>
        <ol>
          {stages.map((node) => (
            <li key={node.id} style={{ marginBlock: "0.85rem" }}>
              <strong>{node.stage}: {node.id}</strong>
              <p>{node.goal}</p>
              <small>
                {node.dependencies.length === 0
                  ? "Root node · read-only preview available"
                  : "Blocked until trusted completion receipts exist: " + node.dependencies.join(", ")}
              </small>
            </li>
          ))}
        </ol>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Canonical + workflow prompt projection</p>
            <h3>Root node — inventory</h3>
          </div>
        </div>
        {preview ? (
          <div className="prompt-card prompt-workspace-content-card">
            <div className="prompt-toolbar">
              <span>Derived preview only · candidate · no persistence</span>
              <span>Application HEAD: {preview.appHead.slice(0, 12)}</span>
            </div>
            <details className="canonical-disclosure">
              <summary>Source revisions and provenance</summary>
              <dl className="prompt-workspace-metadata">
                <div><dt>Canonical</dt><dd>{preview.canonicalPromptRevision}</dd></div>
                <div><dt>Composite</dt><dd>{preview.projection.sourceRevision}</dd></div>
                <div><dt>Content</dt><dd>{preview.projection.contentHash}</dd></div>
              </dl>
            </details>
            <pre>{preview.projection.content}</pre>
          </div>
        ) : (
          <div className="workspace-module-state" role="status">
            <h3>Preview blocked — no placeholder completion</h3>
            <p>{blocked}</p>
            <p>Canonical access or verified application HEAD is required. The workflow remains a candidate.</p>
          </div>
        )}
      </section>
    </ProjectWorkspaceFrame>
  );
}
