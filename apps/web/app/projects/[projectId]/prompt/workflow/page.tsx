import Link from "next/link";

import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../../src/server/project-workspace";
import {
  isRegisteredGovernedProject,
  previewRegisteredWorkflowRoot,
  registeredWorkflowNodes,
  registeredWorkflowSummaries
} from "../../../../../src/server/prompt-workflow";

export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ projectId: string }>;
  readonly searchParams: Promise<{ workflowId?: string | string[] }>;
}

export default async function WorkflowPreviewPage({ params, searchParams }: Props) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  // Canonical project permission is verified before any project-scoped metadata.
  const workspace = await loadProjectWorkspace(projectId);
  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const workflows = registeredWorkflowSummaries(workspace.projectId);
  const rawId = Array.isArray(query.workflowId) ? query.workflowId[0] : query.workflowId;
  const selected = rawId
    ? workflows.find((item) => item.workflowId === rawId)
    : workflows[0];
  const nodes = selected
    ? registeredWorkflowNodes(workspace.projectId, selected.workflowId)
    : [];
  const firstRoot = selected?.rootNodeIds[0];
  let preview: Awaited<ReturnType<typeof previewRegisteredWorkflowRoot>> | null = null;
  let blocked = "";
  if (selected && firstRoot) {
    try {
      preview = await previewRegisteredWorkflowRoot(
        workspace.actor,
        workspace.projectId,
        selected.workflowId,
        firstRoot
      );
    } catch (error) {
      blocked = error instanceof Error ? error.message : "Canonical preview unavailable";
    }
  } else if (rawId && !selected) {
    blocked = "The requested workflow is not registered for this project.";
  } else if (selected) {
    blocked = "No safe root node is available for candidate preview.";
  }

  return (
    <ProjectWorkspaceFrame profile={workspace.project.profile} active="prompt">
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Central Prompt Workflow Registry</p>
          <h2>Project workflow pipelines</h2>
          <p>Hub-managed prompt graphs remain read-only candidates until formally adopted. This view never invents completion, credentials or Production authority.</p>
          <Link href={"/projects/" + encodeURIComponent(workspace.projectId) + "/prompt"}>
            Back to canonical Prompt Workspace
          </Link>
        </div>
      </section>

      {workflows.length === 0 ? (
        <section className="workspace-module-state">
          <h3>No workflow assigned</h3>
          <p>
            {isRegisteredGovernedProject(workspace.projectId)
              ? "This repository is governed by the Hub, but no project-specific workflow has been authored and reviewed."
              : "This project is not present in the Hub's governed-repository registry."}
          </p>
          <p>The canonical project remains usable. No example prompt or artificial status has been installed.</p>
        </section>
      ) : (
        <>
          {workflows.length > 1 ? (
            <section className="workspace-section">
              <h3>Workflow selections</h3>
              <nav aria-label="Registered workflow selections">
                {workflows.map((item) => (
                  <p key={item.workflowId}>
                    <Link href={"?workflowId=" + encodeURIComponent(item.workflowId)}
                      aria-current={selected?.workflowId === item.workflowId ? "page" : undefined}>
                      {item.area} · {item.workflowVersion} · {item.status}
                    </Link>
                  </p>
                ))}
              </nav>
            </section>
          ) : null}

          {selected ? (
            <>
              <section className="workspace-section">
                <div className="workspace-section-heading">
                  <div>
                    <p className="section-kicker">Registry entry · {selected.status}</p>
                    <h3>{selected.area}</h3>
                    <p>
                      {selected.repository} · branch {selected.branch} · workflow {selected.workflowId}@{selected.workflowVersion}
                    </p>
                    <small>
                      {selected.nodeCount} linked nodes. Registered does not mean approved, executed or completed.
                    </small>
                  </div>
                </div>
                <ol>
                  {nodes.map((node) => (
                    <li key={node.id} style={{ marginBlock: "0.85rem" }}>
                      <strong>{node.stage}: {node.id}</strong>
                      <p>{node.goal}</p>
                      <small>
                        {selected.rootNodeIds.includes(node.id)
                          ? "Root · read-only preview candidate"
                          : node.humanGate
                            ? "Blocked · separate human gate required"
                            : "Blocked · verified completion receipts required: " + node.dependencies.join(", ")}
                      </small>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="workspace-section">
                <div className="workspace-section-heading">
                  <div>
                    <p className="section-kicker">Canonical + workflow projection</p>
                    <h3>{firstRoot ? "Root node — " + firstRoot : "Preview unavailable"}</h3>
                  </div>
                </div>
                {preview ? (
                  <div className="prompt-card prompt-workspace-content-card">
                    <div className="prompt-toolbar">
                      <span>Derived preview only · {selected.status} · not persisted</span>
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
                    <p>Verified project permission, canonical project data and repository HEAD are required.</p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="workspace-module-state" role="status">
              <h3>Workflow not found</h3>
              <p>{blocked}</p>
              <p>Select a registered workflow without supplying untrusted manifest content.</p>
            </section>
          )}
        </>
      )}
    </ProjectWorkspaceFrame>
  );
}
