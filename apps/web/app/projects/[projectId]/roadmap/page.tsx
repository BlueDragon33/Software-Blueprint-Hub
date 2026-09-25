import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface ProjectRoadmapPageProps {
  readonly params: Promise<{ projectId: string }>;
}

function statusClass(status: string): string {
  if (status === "completed") return "status-chip-success";
  if (status === "blocked") return "status-chip-warning";
  if (status === "review" || status === "testing") return "status-chip-info";
  return "status-chip-neutral";
}

export default async function ProjectRoadmapPage({
  params
}: ProjectRoadmapPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const workPackages = await workspace.runtime.workQuality.listWorkPackages(
    workspace.actor,
    workspace.projectId
  );

  const completed = workPackages.filter(
    (item) => item.status === "completed"
  ).length;
  const blocked = workPackages.filter(
    (item) => item.status === "blocked"
  ).length;

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="roadmap"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Roadmap</p>
          <h2>Dependency-aware Work Packages</h2>
          <p>
            Canonical execution state. Numbering does not determine order;
            dependencies do.
          </p>
        </div>
        <span className="status-chip status-chip-success">Canonical</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Roadmap summary">
        <article className="workspace-fact">
          <span>Total work</span>
          <strong>{workPackages.length}</strong>
          <small>Canonical Work Packages</small>
        </article>
        <article className="workspace-fact">
          <span>Completed</span>
          <strong>{completed}</strong>
          <small>Completion does not auto-pass gates</small>
        </article>
        <article className="workspace-fact">
          <span>Blocked</span>
          <strong>{blocked}</strong>
          <small>Resolve dependencies before execution</small>
        </article>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Execution graph</p>
            <h3>Work packages and dependencies</h3>
          </div>
        </div>

        {workPackages.length ? (
          <div className="workspace-card-list">
            {workPackages.map((workPackage) => (
              <article className="workspace-work-card" key={workPackage.id}>
                <div className="workspace-work-card-heading">
                  <div>
                    <h4>{workPackage.title}</h4>
                    <span>{workPackage.id}</span>
                  </div>
                  <span
                    className={"status-chip " + statusClass(workPackage.status)}
                  >
                    {workPackage.status}
                  </span>
                </div>

                <p>{workPackage.purpose}</p>

                <div className="workspace-work-meta">
                  <div>
                    <strong>Dependencies</strong>
                    {workPackage.dependencies.length ? (
                      <ul>
                        {workPackage.dependencies.map((dependency) => (
                          <li key={dependency}>{dependency}</li>
                        ))}
                      </ul>
                    ) : (
                      <span>None</span>
                    )}
                  </div>
                  <div>
                    <strong>Quality gates</strong>
                    {workPackage.qualityGateIds.length ? (
                      <ul>
                        {workPackage.qualityGateIds.map((gateId) => (
                          <li key={gateId}>{gateId}</li>
                        ))}
                      </ul>
                    ) : (
                      <span>None</span>
                    )}
                  </div>
                </div>

                <details className="workspace-acceptance">
                  <summary>Acceptance criteria</summary>
                  <ul>
                    {workPackage.acceptanceCriteria.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty-inline">
            No canonical Work Package exists for this project yet.
          </div>
        )}
      </section>
    </ProjectWorkspaceFrame>
  );
}
