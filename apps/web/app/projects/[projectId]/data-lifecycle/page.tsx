import { blueprintOsDataLifecyclePolicyV1 } from "@blueprint-os/application";

import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface DataLifecyclePageProps {
  readonly params: Promise<{ projectId: string }>;
}

export default async function DataLifecyclePage({ params }: DataLifecyclePageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);
  if (workspace.state !== "ready") return <ProjectWorkspaceState state={workspace.state} />;

  const policy =
    workspace.projectId === "project:blueprint-os"
      ? blueprintOsDataLifecyclePolicyV1
      : null;

  return (
    <ProjectWorkspaceFrame profile={workspace.project.profile} active="data-lifecycle">
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Data lifecycle & archive</p>
          <h2>Retain → archive → export → migrate → delete</h2>
          <p>
            Lifecycle policy is explicit, project-scoped and fail-closed. This surface
            can show blockers and requirements but cannot execute destructive mutations.
          </p>
        </div>
        <span className="status-chip status-chip-info">Preview-only authority</span>
      </section>

      {!policy ? (
        <div className="workspace-empty-inline">
          No checked-in lifecycle policy exists for this project. Blueprint OS does not
          inherit retention/deletion rules from another project.
        </div>
      ) : (
        <>
          <section className="workspace-fact-grid" aria-label="Lifecycle policy summary">
            <article className="workspace-fact"><span>Rules</span><strong>{policy.rules.length}</strong><small>Explicit record kinds</small></article>
            <article className="workspace-fact"><span>Policy version</span><strong>{policy.policyVersion}</strong><small>Versioned governance</small></article>
            <article className="workspace-fact"><span>Destructive authority</span><strong>No</strong><small>Explicit confirmation required elsewhere</small></article>
            <article className="workspace-fact"><span>Production authority</span><strong>No</strong><small>Release remains separate</small></article>
          </section>

          <section className="evidence-graph-boundary">
            <strong>Authority boundary</strong>
            <p>{policy.boundaryNote}</p>
            <code>{policy.fingerprint}</code>
          </section>

          <section className="workspace-section" aria-labelledby="lifecycle-rules-title">
            <div className="workspace-section-heading">
              <div>
                <p className="section-kicker">Lifecycle matrix</p>
                <h3 id="lifecycle-rules-title">Record retention and archive rules</h3>
              </div>
            </div>
            <div className="evidence-graph-edges">
              {policy.rules.map((rule) => (
                <article key={rule.recordKind}>
                  <div>
                    <strong>{rule.recordKind}</strong>
                    <span className="status-chip status-chip-neutral">
                      {rule.deletionAllowed ? "Conditional delete" : "Durable"}
                    </span>
                  </div>
                  <p>{rule.rationale}</p>
                  <dl>
                    <div><dt>Minimum retention</dt><dd>{rule.minimumRetentionDays} days</dd></div>
                    <div><dt>Archive after</dt><dd>{rule.archiveAfterDays === null ? "Not automatic" : rule.archiveAfterDays + " days"}</dd></div>
                    <div><dt>Export before delete</dt><dd>{rule.exportRequiredBeforeDelete ? "Required" : "No"}</dd></div>
                    <div><dt>Migration before schema retirement</dt><dd>{rule.migrationRequiredBeforeSchemaRetirement ? "Required" : "No"}</dd></div>
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
