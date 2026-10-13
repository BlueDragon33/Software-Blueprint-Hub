import Link from "next/link";

import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../../src/server/project-workspace";
import {
  isRegisteredGovernedProject,
  inspectLatestWorkflowRootChange,
  previewRegisteredWorkflowRoot,
  readRegisteredWorkflowReadiness,
  registeredWorkflowNodes,
  registeredWorkflowSummaries
} from "../../../../../src/server/prompt-workflow";
import { WorkflowStudio } from "./workflow-studio";

export const dynamic = "force-dynamic";

interface Props {
  readonly params: Promise<{ projectId: string }>;
  readonly searchParams: Promise<{ workflowId?: string | string[]; inspect?: string | string[] }>;
}

export default async function WorkflowPreviewPage({ params, searchParams }: Props) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  // Protected metadata: require the canonical project read before reading workflow details.
  const workspace = await loadProjectWorkspace(projectId);
  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const workflows = registeredWorkflowSummaries(workspace.projectId);
  const requestedId = Array.isArray(query.workflowId) ? query.workflowId[0] : query.workflowId;
  const selected = requestedId
    ? workflows.find((workflow) => workflow.workflowId === requestedId)
    : workflows[0];
  const nodes = selected ? registeredWorkflowNodes(workspace.projectId, selected.workflowId) : [];
  const root = selected?.rootNodeIds[0];
  let preview: Awaited<ReturnType<typeof previewRegisteredWorkflowRoot>> | null = null;
  let previewError = "";
  let readiness: Awaited<ReturnType<typeof readRegisteredWorkflowReadiness>> | null = null;
  let readinessError = "";
  let inspection: Awaited<ReturnType<typeof inspectLatestWorkflowRootChange>> | null = null;
  let inspectionError = "";
  const wantsInspection = query.inspect === "1";

  if (selected && root) {
    try {
      preview = await previewRegisteredWorkflowRoot(
        workspace.actor, workspace.projectId, selected.workflowId, root
      );
    } catch (error) {
      previewError = error instanceof Error ? error.message : "Trusted canonical source unavailable";
    }
  } else if (selected) {
    previewError = "This workflow has no previewable root node.";
  }

  if (selected) {
    try {
      readiness = await readRegisteredWorkflowReadiness(
        workspace.actor, workspace.projectId, selected.workflowId
      );
    } catch (error) {
      readinessError = error instanceof Error ? error.message : "Verified readiness unavailable";
    }
  }

  if (selected && root && wantsInspection) {
    try {
      inspection = await inspectLatestWorkflowRootChange(
        workspace.actor, workspace.projectId, selected.workflowId
      );
    } catch (error) {
      inspectionError = error instanceof Error
        ? error.message
        : "Live scoped GitHub inspection unavailable";
    }
  }

  return (
    <ProjectWorkspaceFrame profile={workspace.project.profile} active="prompt">
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Central Prompt Workflow Registry</p>
          <h2>Visual Workflow Studio</h2>
          <p>
            Inspect graph dependencies and node contracts without granting workflow execution,
            canonical Gate PASS, constitutional authority or Production release.
          </p>
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
          <p>The canonical project remains usable. No sample prompt or artificial completion has been installed.</p>
        </section>
      ) : (
        <>
          {workflows.length > 1 ? (
            <section className="workspace-section">
              <h3>Workflow selections</h3>
              <nav aria-label="Registered workflow selections">
                {workflows.map((workflow) => (
                  <p key={workflow.workflowId}>
                    <Link href={"?workflowId=" + encodeURIComponent(workflow.workflowId)}
                      aria-current={selected?.workflowId === workflow.workflowId ? "page" : undefined}>
                      {workflow.area} · {workflow.workflowVersion} · {workflow.status}
                    </Link>
                  </p>
                ))}
              </nav>
            </section>
          ) : null}

          {selected ? (
            <section className="workspace-section">
              <div className="workspace-section-heading">
                <div>
                  <p className="section-kicker">Registry entry · {selected.status}</p>
                  <h3>{selected.area}</h3>
                  <p>{selected.repository} · {selected.branch} · {selected.workflowId}@{selected.workflowVersion}</p>
                  <small>
                    {selected.nodeCount} nodes in a versioned DAG. Registration is not a record of approval or execution.
                  </small>
                </div>
              </div>
              {root ? (
                <section className="workspace-section">
                  <div className="workspace-section-heading">
                    <div>
                      <p className="section-kicker">Scoped source inspection</p>
                      <h3>Inspect the latest real commit</h3>
                      <p>
                        Read-only and bounded: only relevant files from the HEAD commit diff,
                        not the entire repository or a completed workflow node.
                      </p>
                    </div>
                    <Link
                      className="secondary-button registry-action"
                      href={"?workflowId=" + encodeURIComponent(selected.workflowId) + "&inspect=1"}
                    >
                      Inspect actual HEAD
                    </Link>
                  </div>
                  {wantsInspection ? (
                    <div className="workspace-module-state" role="status">
                      {inspection ? (
                        <>
                          <h4>{inspection.state === "observed"
                            ? "Source snapshot observed"
                            : "No relevant changed files at HEAD"}</h4>
                          <p>{inspection.explanation}</p>
                          <p>HEAD: <code>{inspection.appHead}</code></p>
                          <p>Files changed in HEAD commit: {inspection.checkedChangeCount}</p>
                          {inspection.observationDigest ? (
                            <p>Inspection digest: <code>{inspection.observationDigest}</code></p>
                          ) : null}
                          {inspection.evidenceReferences.length > 0 ? (
                            <details>
                              <summary>Actual scoped file references ({inspection.evidenceReferences.length})</summary>
                              <ul>{inspection.evidenceReferences.map((reference) => (
                                <li key={reference}><code>{reference}</code></li>
                              ))}</ul>
                            </details>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <h4>Inspection blocked</h4>
                          <p>{inspectionError || "The repository or canonical project source could not be verified."}</p>
                        </>
                      )}
                    </div>
                  ) : null}
                </section>
              ) : null}
              <WorkflowStudio
                key={selected.workflowId}
                nodes={nodes}
                rootNodeIds={selected.rootNodeIds}
                readiness={readiness?.plan ?? null}
                receiptVerificationConfigured={readiness?.receiptVerificationConfigured ?? false}
                readinessError={readinessError}
                preview={preview && root ? {
                  rootNodeId: root,
                  content: preview.projection.content,
                  appHead: preview.appHead,
                  canonicalRevision: preview.canonicalPromptRevision,
                  sourceRevision: preview.projection.sourceRevision,
                  contentHash: preview.projection.contentHash
                } : null}
                previewError={previewError}
              />
            </section>
          ) : (
            <section className="workspace-module-state" role="status">
              <h3>Workflow not found</h3>
              <p>The requested workflow is not registered for this project.</p>
              <p>Choose a valid workflow without introducing external manifest content.</p>
            </section>
          )}
        </>
      )}
    </ProjectWorkspaceFrame>
  );
}
