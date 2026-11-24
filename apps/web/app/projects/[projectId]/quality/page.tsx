import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";
import { QualityGateRegister } from "./quality-gate-register";
import { readProjectQualityReview } from "../../../../src/server/project-quality-review";
import { classifyCanonicalReadFailure } from "../../../../src/server/runtime-state";

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

  let review: Awaited<ReturnType<typeof readProjectQualityReview>>;
  try {
    review = await readProjectQualityReview(workspace.runtime, workspace.actor, workspace.projectId);
  } catch (error) {
    return <ProjectWorkspaceState state={classifyCanonicalReadFailure(error)} />;
  }
  const { gateModels, canReview } = review;
  const requiredTemplates = workspace.project.blueprint.requiredGates;

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

      <section className="workspace-section" aria-label="Project review access">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Review access</p>
            <h3>{canReview ? "PROJECT_REVIEW verified for this read" : "Read only — PROJECT_REVIEW not granted"}</h3>
            <p>Project: <code>{workspace.projectId}</code></p>
            <p>Permission is checked on the server for this session. This is not acceptance, evidence verification or release authority.</p>
          </div>
          <span className={"status-chip " + (canReview ? "status-chip-info" : "status-chip-neutral")}>
            {canReview ? "Review permission" : "Read only"}
          </span>
        </div>
        <p>{gateModels.length ? "Canonical instance IDs and record versions are shown below." : "No canonical gate instances recorded. Do not substitute template IDs."}</p>
        <details className="canonical-disclosure quality-disclosure">
          <summary>Required blueprint gate keys ({requiredTemplates.length}) — not instance IDs</summary>
          <ul>{requiredTemplates.map((id) => <li key={id}><code>{id}</code></li>)}</ul>
          <p>Repository binding, template-to-instance mapping and revision coverage require separate verification. No review submission is enabled in this read-only slice.</p>
        </details>
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
