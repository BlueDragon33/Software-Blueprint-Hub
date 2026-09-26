import {
  buildReleasePromotionPlan
} from "@blueprint-os/application";

import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface ReleaseOrchestrationPageProps {
  readonly params: Promise<{ projectId: string }>;
}

export default async function ReleaseOrchestrationPage({
  params
}: ReleaseOrchestrationPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const [gateModels, releases] = await Promise.all([
    workspace.runtime.workQuality.listQualityGates(
      workspace.actor,
      workspace.projectId
    ),
    workspace.runtime.releases.listReleases(
      workspace.actor,
      workspace.projectId
    )
  ]);

  const qualityGates = gateModels.map((item) => item.gate);
  const evidence = gateModels.flatMap((item) => item.evidence);
  const candidates = releases.filter((release) => release.status === "candidate");
  const plans = candidates.map((release) =>
    buildReleasePromotionPlan({
      projectId: workspace.projectId,
      release,
      qualityGates,
      evidence,
      targetEnvironment: "production",
      deploymentProvider: null
    })
  );

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="release-orchestration"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Release orchestration</p>
          <h2>Exact revision → evidence → provider → explicit execution</h2>
          <p>
            Promotion planning verifies canonical evidence and deployment
            preconditions. Merge, green CI and Release Gate PASS are evidence —
            they are not deployment.
          </p>
        </div>
        <span className="status-chip status-chip-info">Execution gated</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Release orchestration summary">
        <article className="workspace-fact">
          <span>Candidate releases</span>
          <strong>{candidates.length}</strong>
          <small>Canonical ReleaseRecord candidates</small>
        </article>
        <article className="workspace-fact">
          <span>Promotion plans</span>
          <strong>{plans.length}</strong>
          <small>Exact-revision plans only</small>
        </article>
        <article className="workspace-fact">
          <span>Ready to execute</span>
          <strong>{plans.filter((plan) => plan.state === "ready-for-explicit-execution").length}</strong>
          <small>Still requires explicit external execution</small>
        </article>
        <article className="workspace-fact">
          <span>Deployment observed</span>
          <strong>0</strong>
          <small>No provider execution is claimed</small>
        </article>
      </section>

      <section className="evidence-graph-boundary">
        <strong>Truth boundary</strong>
        <p>
          This workspace has no connected deployment-provider execution path yet.
          Production publish remains blocked until a real scoped provider is
          connected and an explicit deployment action succeeds.
        </p>
      </section>

      <section className="workspace-section" aria-labelledby="promotion-plans-title">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Promotion preconditions</p>
            <h3 id="promotion-plans-title">Release promotion plans</h3>
          </div>
        </div>

        {plans.length ? (
          <div className="evidence-graph-edges">
            {plans.map((plan) => (
              <article key={plan.id}>
                <span className="status-chip status-chip-neutral">{plan.state}</span>
                <div>
                  <strong>{plan.version}</strong>
                  <code>{plan.sourceRevision}</code>
                </div>
                <p>{plan.boundaryNote}</p>
                <dl>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{plan.evidenceIds.length} exact-revision record(s)</dd>
                  </div>
                  <div>
                    <dt>PASS gates</dt>
                    <dd>{plan.passedGateIds.length}</dd>
                  </div>
                  <div>
                    <dt>Provider</dt>
                    <dd>{plan.deploymentProviderId ?? "Not connected"}</dd>
                  </div>
                  <div>
                    <dt>Blockers</dt>
                    <dd>{plan.blockers.length ? plan.blockers.join(", ") : "None"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty-inline">
            No canonical candidate ReleaseRecord exists yet. Release orchestration
            does not invent a candidate from merge history or CI status.
          </div>
        )}
      </section>
    </ProjectWorkspaceFrame>
  );
}
