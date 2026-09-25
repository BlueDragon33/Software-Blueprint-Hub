import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface ProjectBlueprintPageProps {
  readonly params: Promise<{ projectId: string }>;
}

function displayId(id: string): string {
  return id.split(":").slice(1).join(" · ").replaceAll("-", " ");
}

export default async function ProjectBlueprintPage({
  params
}: ProjectBlueprintPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const { profile, blueprint, templateVersions } = workspace.project;

  return (
    <ProjectWorkspaceFrame profile={profile} active="blueprint">
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Blueprint</p>
          <h2>Resolved engineering requirements</h2>
          <p>
            Deterministic requirements resolved from the Project Profile,
            Blueprint Level and exact template versions.
          </p>
        </div>
        <span className="status-chip status-chip-success">Canonical</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Blueprint facts">
        <article className="workspace-fact">
          <span>Required modules</span>
          <strong>{blueprint.requiredModules.length}</strong>
          <small>Canonical engineering modules</small>
        </article>
        <article className="workspace-fact">
          <span>Required gates</span>
          <strong>{blueprint.requiredGates.length}</strong>
          <small>Evidence-backed acceptance points</small>
        </article>
        <article className="workspace-fact">
          <span>Profile version</span>
          <strong>{blueprint.profileRecordVersion}</strong>
          <small>Resolver {blueprint.resolverVersion}</small>
        </article>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Modules</p>
            <h3>What must be designed or implemented</h3>
          </div>
          <span className="status-chip status-chip-neutral">
            {blueprint.requiredModules.length} required
          </span>
        </div>
        <div className="workspace-record-list">
          {blueprint.requiredModules.map((id) => (
            <div className="workspace-record-row" key={id}>
              <div>
                <strong>{displayId(id)}</strong>
                <span>{id}</span>
              </div>
              <span className="status-chip status-chip-neutral">Required</span>
            </div>
          ))}
        </div>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Quality Gates</p>
            <h3>What must earn evidence before PASS</h3>
          </div>
          <span className="status-chip status-chip-info">
            {blueprint.requiredGates.length} gates
          </span>
        </div>
        <div className="workspace-record-list">
          {blueprint.requiredGates.map((id) => (
            <div className="workspace-record-row" key={id}>
              <div>
                <strong>{displayId(id)}</strong>
                <span>{id}</span>
              </div>
              <span className="status-chip status-chip-info">Required gate</span>
            </div>
          ))}
        </div>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Template provenance</p>
            <h3>Exact reusable definitions used for this resolution</h3>
          </div>
        </div>
        <div className="workspace-record-list">
          {templateVersions.map((template) => (
            <div className="workspace-record-row" key={template.id + template.version}>
              <div>
                <strong>{template.id}</strong>
                <span>Template version</span>
              </div>
              <span className="status-chip status-chip-neutral">
                {template.version}
              </span>
            </div>
          ))}
        </div>
      </section>

      {blueprint.warnings?.length ? (
        <section className="workspace-section workspace-section-warning">
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Resolver warnings</p>
              <h3>Review before implementation</h3>
            </div>
          </div>
          <ul className="workspace-plain-list">
            {blueprint.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="workspace-record-footer">
        <span>Resolution {blueprint.resolutionId}</span>
        <span>Fingerprint {blueprint.inputFingerprint.slice(0, 18)}…</span>
      </footer>
    </ProjectWorkspaceFrame>
  );
}
