import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface DecisionsPageProps {
  readonly params: Promise<{ projectId: string }>;
}

function statusClass(status: string): string {
  if (status === "accepted") return "status-chip-success";
  if (status === "proposed") return "status-chip-info";
  if (status === "superseded") return "status-chip-warning";
  return "status-chip-neutral";
}

export default async function DecisionsPage({ params }: DecisionsPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const decisions = await workspace.runtime.governance.listArchitectureDecisions(
    workspace.actor,
    workspace.projectId
  );

  const accepted = decisions.filter((item) => item.status === "accepted").length;
  const proposed = decisions.filter((item) => item.status === "proposed").length;

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="decisions"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Decisions</p>
          <h2>Architecture Decisions</h2>
          <p>
            Canonical ADR state with explicit lifecycle, consequences,
            supersession and provenance.
          </p>
        </div>
        <span className="status-chip status-chip-success">Canonical</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Decision register summary">
        <article className="workspace-fact">
          <span>Decision records</span>
          <strong>{decisions.length}</strong>
          <small>Versioned canonical ADRs</small>
        </article>
        <article className="workspace-fact">
          <span>Accepted</span>
          <strong>{accepted}</strong>
          <small>Accepted content is immutable</small>
        </article>
        <article className="workspace-fact">
          <span>Proposed</span>
          <strong>{proposed}</strong>
          <small>Awaiting architectural acceptance</small>
        </article>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">ADR register</p>
            <h3>Architectural direction and consequences</h3>
          </div>
        </div>

        {decisions.length === 0 ? (
          <div className="workspace-empty-inline">
            No canonical ArchitectureDecision record exists for this project.
          </div>
        ) : (
          <div className="governance-record-list">
            {decisions.map((item) => (
              <article className="governance-record-card" key={item.id}>
                <div className="governance-record-heading">
                  <div>
                    <h4>{item.title}</h4>
                    <span>{item.id}</span>
                  </div>
                  <span className={"status-chip " + statusClass(item.status)}>
                    {item.status}
                  </span>
                </div>

                <div className="governance-record-body">
                  <div>
                    <strong>Context</strong>
                    <p>{item.context}</p>
                  </div>
                  <div>
                    <strong>Decision</strong>
                    <p>{item.decision}</p>
                  </div>
                </div>

                <div className="workspace-acceptance">
                  <strong>Consequences</strong>
                  <ul>
                    {item.consequences.map((consequence) => (
                      <li key={consequence}>{consequence}</li>
                    ))}
                  </ul>
                </div>

                {item.supersedesId ? (
                  <p className="governance-link-note">
                    Supersedes {item.supersedesId}
                  </p>
                ) : null}

                <footer className="governance-record-footer">
                  <span>Record v{item.meta.recordVersion}</span>
                  <span>Source {item.source}</span>
                  <span>
                    Revision {item.sourceRevision ?? "not recorded"}
                  </span>
                  <span>Updated {item.meta.updatedAt}</span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </ProjectWorkspaceFrame>
  );
}
