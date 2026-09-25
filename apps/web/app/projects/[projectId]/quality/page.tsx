import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface ProjectQualityPageProps {
  readonly params: Promise<{ projectId: string }>;
}

function statusClass(status: string): string {
  if (status === "pass") return "status-chip-success";
  if (status === "fail") return "status-chip-warning";
  if (status === "candidate") return "status-chip-info";
  return "status-chip-neutral";
}

function statusLabel(status: string): string {
  return status.replace("-", " ");
}

export default async function ProjectQualityPage({
  params
}: ProjectQualityPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const gateModels = await workspace.runtime.workQuality.listQualityGates(
    workspace.actor,
    workspace.projectId
  );

  const pass = gateModels.filter((item) => item.gate.status === "pass").length;
  const candidate = gateModels.filter(
    (item) => item.gate.status === "candidate"
  ).length;
  const evidenceCount = gateModels.reduce(
    (total, item) => total + item.evidence.length,
    0
  );

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="quality"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Quality</p>
          <h2>Quality Gates and revision-specific evidence</h2>
          <p>
            Gate status remains explicit. Evidence provenance is visible, and
            Work Package completion does not auto-promote a gate to PASS.
          </p>
        </div>
        <span className="status-chip status-chip-success">Canonical</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Quality summary">
        <article className="workspace-fact">
          <span>Tracked gates</span>
          <strong>{gateModels.length}</strong>
          <small>Canonical QualityGate records</small>
        </article>
        <article className="workspace-fact">
          <span>PASS</span>
          <strong>{pass}</strong>
          <small>{candidate} currently candidate</small>
        </article>
        <article className="workspace-fact">
          <span>Evidence records</span>
          <strong>{evidenceCount}</strong>
          <small>Source and revision are preserved</small>
        </article>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Gate register</p>
            <h3>Acceptance state and evidence provenance</h3>
          </div>
        </div>

        {gateModels.length ? (
          <div className="workspace-card-list">
            {gateModels.map(({ gate, evidence }) => (
              <article className="workspace-quality-card" key={gate.id}>
                <div className="workspace-work-card-heading">
                  <div>
                    <h4>{gate.name}</h4>
                    <span>{gate.id}</span>
                  </div>
                  <span
                    className={"status-chip " + statusClass(gate.status)}
                  >
                    {statusLabel(gate.status)}
                  </span>
                </div>

                <div className="workspace-quality-grid">
                  <div>
                    <strong>Requirements</strong>
                    <ul>
                      {gate.requirements.map((requirement) => (
                        <li key={requirement}>{requirement}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Linked evidence IDs</strong>
                    {gate.evidenceIds.length ? (
                      <ul>
                        {gate.evidenceIds.map((id) => <li key={id}>{id}</li>)}
                      </ul>
                    ) : (
                      <span>No evidence linked</span>
                    )}
                  </div>
                </div>

                <div className="workspace-evidence-list">
                  {evidence.length ? (
                    evidence.map((item) => (
                      <div className="workspace-evidence-row" key={item.id}>
                        <div>
                          <strong>{item.kind}</strong>
                          <span>{item.source}</span>
                        </div>
                        <div>
                          <span>{item.revision}</span>
                          <small>{item.createdAt}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="workspace-empty-inline">
                      No canonical evidence record is available for this gate.
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty-inline">
            No canonical Quality Gate exists for this project yet.
          </div>
        )}
      </section>

      <p className="readiness-provenance-note">
        This view shows recorded evidence provenance only. It does not claim an
        evidence revision is current unless a trusted source can verify the
        current revision.
      </p>
    </ProjectWorkspaceFrame>
  );
}
