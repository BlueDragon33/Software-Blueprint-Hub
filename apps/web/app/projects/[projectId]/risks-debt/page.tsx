import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface RisksDebtPageProps {
  readonly params: Promise<{ projectId: string }>;
}

function stateClass(status: string): string {
  if (status === "closed" || status === "resolved") return "status-chip-success";
  if (status === "accepted") return "status-chip-warning";
  if (status === "mitigating" || status === "in-progress") return "status-chip-info";
  return "status-chip-neutral";
}

function severityClass(value: string): string {
  if (value === "critical" || value === "high") return "status-chip-warning";
  if (value === "medium") return "status-chip-info";
  return "status-chip-neutral";
}

export default async function RisksDebtPage({ params }: RisksDebtPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const [risks, debts] = await Promise.all([
    workspace.runtime.governance.listRisks(workspace.actor, workspace.projectId),
    workspace.runtime.governance.listTechnicalDebt(
      workspace.actor,
      workspace.projectId
    )
  ]);

  const activeRisks = risks.filter((item) => item.status !== "closed").length;
  const unresolvedDebt = debts.filter((item) => item.status !== "resolved").length;

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="risks-debt"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Risks & Debt</p>
          <h2>Risks & Technical Debt</h2>
          <p>
            Canonical registers keep operational risk separate from technical
            debt and from Quality Gate or Work Package completion.
          </p>
        </div>
        <span className="status-chip status-chip-success">Canonical</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Risk and debt summary">
        <article className="workspace-fact">
          <span>Risk records</span>
          <strong>{risks.length}</strong>
          <small>{activeRisks} not closed</small>
        </article>
        <article className="workspace-fact">
          <span>Debt records</span>
          <strong>{debts.length}</strong>
          <small>{unresolvedDebt} unresolved</small>
        </article>
        <article className="workspace-fact">
          <span>Lifecycle rule</span>
          <strong>Explicit</strong>
          <small>Accepted debt remains visible</small>
        </article>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Risk register</p>
            <h3>Threats to project outcomes</h3>
          </div>
        </div>

        {risks.length === 0 ? (
          <div className="workspace-empty-inline">
            No canonical Risk record exists for this project.
          </div>
        ) : (
          <div className="governance-record-list">
            {risks.map((item) => (
              <article className="governance-record-card" key={item.id}>
                <div className="governance-record-heading">
                  <div>
                    <h4>{item.title}</h4>
                    <span>{item.id}</span>
                  </div>
                  <div className="governance-status-stack">
                    <span className={"status-chip " + stateClass(item.status)}>
                      {item.status}
                    </span>
                    <span className={"status-chip " + severityClass(item.impact)}>
                      impact {item.impact}
                    </span>
                  </div>
                </div>

                <p>{item.description}</p>

                <div className="governance-detail-grid">
                  <div><strong>Likelihood</strong><span>{item.likelihood}</span></div>
                  <div><strong>Owner</strong><span>{item.owner ?? "Unassigned"}</span></div>
                  <div className="governance-detail-span">
                    <strong>Mitigation</strong><span>{item.mitigation}</span>
                  </div>
                </div>

                <div className="governance-linked-work">
                  <strong>Linked Work Packages</strong>
                  {item.linkedWorkPackageIds.length ? (
                    <div className="workspace-chip-list">
                      {item.linkedWorkPackageIds.map((id) => (
                        <span className="status-chip status-chip-neutral" key={id}>
                          {id}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>None</span>
                  )}
                </div>

                <footer className="governance-record-footer">
                  <span>Record v{item.meta.recordVersion}</span>
                  <span>Source {item.source}</span>
                  <span>Revision {item.sourceRevision ?? "not recorded"}</span>
                  <span>Updated {item.meta.updatedAt}</span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Technical debt register</p>
            <h3>Known engineering compromise and remediation</h3>
          </div>
        </div>

        {debts.length === 0 ? (
          <div className="workspace-empty-inline">
            No canonical TechnicalDebt record exists for this project.
          </div>
        ) : (
          <div className="governance-record-list">
            {debts.map((item) => (
              <article className="governance-record-card" key={item.id}>
                <div className="governance-record-heading">
                  <div>
                    <h4>{item.title}</h4>
                    <span>{item.id}</span>
                  </div>
                  <div className="governance-status-stack">
                    <span className={"status-chip " + stateClass(item.status)}>
                      {item.status}
                    </span>
                    <span className={"status-chip " + severityClass(item.severity)}>
                      {item.severity}
                    </span>
                  </div>
                </div>

                <p>{item.description}</p>

                <div className="governance-detail-grid">
                  <div className="governance-detail-span">
                    <strong>Remediation</strong><span>{item.remediation}</span>
                  </div>
                </div>

                <div className="governance-linked-work">
                  <strong>Linked Work Packages</strong>
                  {item.linkedWorkPackageIds.length ? (
                    <div className="workspace-chip-list">
                      {item.linkedWorkPackageIds.map((id) => (
                        <span className="status-chip status-chip-neutral" key={id}>
                          {id}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>None</span>
                  )}
                </div>

                <footer className="governance-record-footer">
                  <span>Record v{item.meta.recordVersion}</span>
                  <span>Source {item.source}</span>
                  <span>Revision {item.sourceRevision ?? "not recorded"}</span>
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
