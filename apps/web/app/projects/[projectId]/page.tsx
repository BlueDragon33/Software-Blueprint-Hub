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

  const readiness = await workspace.runtime.readiness.read(
    workspace.actor,
    workspace.projectId,
    workspace.project.blueprint.requiredGates
  );

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
