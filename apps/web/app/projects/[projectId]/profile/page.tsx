import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface ProjectProfilePageProps {
  readonly params: Promise<{ projectId: string }>;
}

function value(value: string | undefined): string {
  return value?.trim() || "Not specified";
}

export default async function ProjectProfilePage({
  params
}: ProjectProfilePageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const profile = workspace.project.profile;

  return (
    <ProjectWorkspaceFrame profile={profile} active="profile">
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Profile</p>
          <h2>Canonical Project Profile</h2>
          <p>
            Classification inputs that control Blueprint depth and template
            activation.
          </p>
        </div>
        <span className="status-chip status-chip-success">
          Record v{profile.meta.recordVersion}
        </span>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Identity & classification</p>
            <h3>What this project is</h3>
          </div>
        </div>
        <dl className="workspace-definition-grid">
          <div><dt>Project name</dt><dd>{profile.name}</dd></div>
          <div><dt>Project type</dt><dd>{profile.projectType}</dd></div>
          <div><dt>Blueprint level</dt><dd>{profile.blueprintLevel}</dd></div>
          <div><dt>Deployment target</dt><dd>{profile.deploymentTarget}</dd></div>
          <div><dt>Expected lifetime</dt><dd>{profile.expectedLifetime}</dd></div>
          <div><dt>Expected scale</dt><dd>{value(profile.expectedScale)}</dd></div>
        </dl>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">People & jobs</p>
            <h3>Who the product serves</h3>
          </div>
        </div>
        <div className="workspace-two-column">
          <article className="workspace-list-card">
            <h4>Primary users</h4>
            <ul>
              {profile.primaryUsers.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article className="workspace-list-card">
            <h4>Jobs to be done</h4>
            <ul>
              {profile.jobsToBeDone.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Data, trust & operation</p>
            <h3>Engineering constraints</h3>
          </div>
        </div>
        <dl className="workspace-definition-grid">
          <div><dt>Data sensitivity</dt><dd>{profile.dataSensitivity}</dd></div>
          <div><dt>Persistence</dt><dd>{profile.persistence}</dd></div>
          <div><dt>Authentication</dt><dd>{profile.authentication}</dd></div>
          <div><dt>Authorization</dt><dd>{profile.authorization}</dd></div>
          <div><dt>Offline</dt><dd>{profile.offlineRequirement ?? "none"}</dd></div>
          <div><dt>AI use</dt><dd>{profile.aiUse ?? "none"}</dd></div>
          <div>
            <dt>Extensibility</dt>
            <dd>{profile.extensibilityRequirement ?? "none"}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>{value(profile.availabilityRequirement)}</dd>
          </div>
          <div>
            <dt>Security / compliance</dt>
            <dd>{value(profile.complianceSecuritySensitivity)}</dd>
          </div>
          <div>
            <dt>Maintenance</dt>
            <dd>{value(profile.maintenanceModel)}</dd>
          </div>
        </dl>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Integrations</p>
            <h3>External systems</h3>
          </div>
        </div>
        {profile.externalIntegrations?.length ? (
          <div className="workspace-chip-list">
            {profile.externalIntegrations.map((item) => (
              <span className="status-chip status-chip-neutral" key={item}>
                {item}
              </span>
            ))}
          </div>
        ) : (
          <div className="workspace-empty-inline">
            No external integration is recorded in the Project Profile.
          </div>
        )}
      </section>

      <footer className="workspace-record-footer">
        <span>Schema {profile.meta.schemaVersion}</span>
        <span>Created {profile.meta.createdAt}</span>
        <span>Updated {profile.meta.updatedAt}</span>
      </footer>
    </ProjectWorkspaceFrame>
  );
}
