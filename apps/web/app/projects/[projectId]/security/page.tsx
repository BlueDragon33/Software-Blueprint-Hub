import { blueprintOsThreatModelV1 } from "@blueprint-os/application";

import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface SecurityPageProps {
  readonly params: Promise<{ projectId: string }>;
}

export default async function SecurityPage({ params }: SecurityPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const model =
    workspace.projectId === "project:blueprint-os"
      ? blueprintOsThreatModelV1
      : null;

  return (
    <ProjectWorkspaceFrame profile={workspace.project.profile} active="security">
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Security hardening</p>
          <h2>Trust zones → threats → controls → evidence</h2>
          <p>
            High/critical threats require explicit mitigation evidence. This view
            can block promotion; it cannot grant release, provider or AI authority.
          </p>
        </div>
        <span className="status-chip status-chip-info">Fail closed</span>
      </section>

      {!model ? (
        <div className="workspace-empty-inline">
          No checked-in threat model has been published for this project yet.
          Security state is not inferred from another project.
        </div>
      ) : (
        <>
          <section className="workspace-fact-grid" aria-label="Threat model summary">
            <article className="workspace-fact">
              <span>Trust zones</span>
              <strong>{model.trustZones.length}</strong>
              <small>Explicit boundaries only</small>
            </article>
            <article className="workspace-fact">
              <span>Threats</span>
              <strong>{model.threats.length}</strong>
              <small>Structured abuse paths</small>
            </article>
            <article className="workspace-fact">
              <span>Open high/critical</span>
              <strong>{model.openHighOrCritical.length}</strong>
              <small>Must be zero before progression</small>
            </article>
            <article className="workspace-fact">
              <span>Publish blockers</span>
              <strong>{model.publishBlockers.length}</strong>
              <small>Missing coverage or severe open threats</small>
            </article>
          </section>

          <section className="evidence-graph-boundary">
            <strong>Authority boundary</strong>
            <p>{model.boundaryNote}</p>
          </section>

          <section className="workspace-section" aria-labelledby="trust-zones-title">
            <div className="workspace-section-heading">
              <div>
                <p className="section-kicker">Trust model</p>
                <h3 id="trust-zones-title">Trust zones</h3>
              </div>
            </div>
            <div className="evidence-graph-nodes">
              {model.trustZones.map((zone) => (
                <article className="evidence-graph-node" key={zone}>
                  <span>Trust zone</span>
                  <strong>{zone}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="workspace-section" aria-labelledby="threats-title">
            <div className="workspace-section-heading">
              <div>
                <p className="section-kicker">Threat register</p>
                <h3 id="threats-title">Threats and mitigation evidence</h3>
              </div>
            </div>
            <div className="evidence-graph-edges">
              {model.threats.map((threat) => (
                <article key={threat.id}>
                  <span className="status-chip status-chip-neutral">
                    {threat.severity} · {threat.status}
                  </span>
                  <div>
                    <strong>{threat.title}</strong>
                    <code>{threat.id}</code>
                  </div>
                  <p>{threat.attackPath}</p>
                  <dl>
                    <div><dt>Category</dt><dd>{threat.category}</dd></div>
                    <div><dt>Zone</dt><dd>{threat.trustZone}</dd></div>
                    <div><dt>Owner</dt><dd>{threat.owner}</dd></div>
                    <div><dt>Mitigation</dt><dd>{threat.mitigation}</dd></div>
                    <div><dt>Evidence</dt><dd>{threat.evidence.join(", ") || "None"}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </ProjectWorkspaceFrame>
  );
}
