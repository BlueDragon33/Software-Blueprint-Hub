import { projectCanonicalNextAction } from "../../../../../packages/application/src/universal-next-action-canonical.candidate.mjs";
import { UniversalNextActionCandidate } from "./_components/universal-next-action.candidate";
import { ProjectWorkspaceFrame, ProjectWorkspaceState } from "./_components/project-workspace";
import { ReadinessOverview } from "./_components/readiness-overview";
import { loadProjectWorkspace } from "../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  readonly params: Promise<{ projectId: string }>;
}

export default async function ProjectOverviewPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const [readiness, workPackages, gateBundles] = await Promise.all([
    workspace.runtime.readiness.read(
      workspace.actor, workspace.projectId, workspace.project.blueprint.requiredGates
    ),
    workspace.runtime.workQuality.listWorkPackages(workspace.actor, workspace.projectId),
    workspace.runtime.workQuality.listQualityGates(workspace.actor, workspace.projectId)
  ]);
  // Compute this after canonical reads. This is an observed projection, never
  // an atomic authorization grant; the Server Action rechecks freshness.
  const sourceRevision = await workspace.runtime.prompts.currentSourceRevisionFromProfile(
    workspace.actor, workspace.projectId, workspace.project
  );
  const nextAction = projectCanonicalNextAction({
    projectId: workspace.projectId,
    projectName: workspace.project.profile.name,
    sourceRevision,
    workPackages,
    gateBundles,
    requiredGateIds: workspace.project.blueprint.requiredGates
  });

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="overview"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Overview</p>
          <h2>Readiness, blockers and the next engineering action</h2>
        </div>
        <span className="status-chip status-chip-success">Canonical</span>
      </section>

      <UniversalNextActionCandidate view={{
        projectId: workspace.projectId,
        projectName: workspace.project.profile.name,
        workPackageId: nextAction.workPackageId,
        sourceRevision,
        checkpointRef: null,
        state: nextAction.state,
        verifiedAt: null,
        reason: nextAction.reason,
        action: { label: "Mở Prompt Workspace", href: "/projects/" + encodeURIComponent(workspace.projectId) + "/prompt", kind: "internal-navigation" }
      }} />
      <ReadinessOverview readiness={readiness} />

      <section className="workspace-fact-grid" aria-label="Project overview facts">
        <article className="workspace-fact">
          <span>Profile version</span>
          <strong>{workspace.project.profile.meta.recordVersion}</strong>
          <small>{workspace.project.profile.meta.updatedAt}</small>
        </article>
        <article className="workspace-fact">
          <span>Required modules</span>
          <strong>{workspace.project.blueprint.requiredModules.length}</strong>
          <small>Open Blueprint for the full requirement set</small>
        </article>
        <article className="workspace-fact">
          <span>Blueprint level</span>
          <strong>{workspace.project.profile.blueprintLevel}</strong>
          <small>{workspace.project.profile.projectType}</small>
        </article>
      </section>
    </ProjectWorkspaceFrame>
  );
}
