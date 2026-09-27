import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";
import { QualityGateRegister } from "./quality-gate-register";

export const dynamic = "force-dynamic";

interface ProjectQualityPageProps {
  readonly params: Promise<{ projectId: string }>;
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
          <QualityGateRegister gateModels={gateModels} />
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
