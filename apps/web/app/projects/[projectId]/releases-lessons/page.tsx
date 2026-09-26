import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface ReleaseLessonsPageProps {
  readonly params: Promise<{ projectId: string }>;
}

function releaseStatusClass(status: string): string {
  if (status === "released") return "status-chip-success";
  if (status === "rolled-back") return "status-chip-warning";
  if (status === "candidate") return "status-chip-info";
  return "status-chip-neutral";
}

export default async function ReleaseLessonsPage({
  params
}: ReleaseLessonsPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const [releases, lessons] = await Promise.all([
    workspace.runtime.releases.listReleases(
      workspace.actor,
      workspace.projectId
    ),
    workspace.runtime.releases.listLessons(
      workspace.actor,
      workspace.projectId
    )
  ]);

  const released = releases.filter((item) => item.status === "released").length;
  const rolledBack = releases.filter(
    (item) => item.status === "rolled-back"
  ).length;

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="releases-lessons"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Releases & Lessons</p>
          <h2>Exact revisions, rollback history and reusable learning</h2>
          <p>
            Release records are canonical project state. A released artifact
            must point to PASS-linked evidence for the exact shipped revision.
          </p>
        </div>
        <span className="status-chip status-chip-success">Canonical</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Release summary">
        <article className="workspace-fact">
          <span>Release records</span>
          <strong>{releases.length}</strong>
          <small>{released} currently released</small>
        </article>
        <article className="workspace-fact">
          <span>Rollbacks</span>
          <strong>{rolledBack}</strong>
          <small>Rollback revision is explicit</small>
        </article>
        <article className="workspace-fact">
          <span>Lessons learned</span>
          <strong>{lessons.length}</strong>
          <small>Structured learning, not release notes</small>
        </article>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Release register</p>
            <h3>Exact artifact identity and release evidence</h3>
          </div>
        </div>

        {releases.length === 0 ? (
          <div className="workspace-empty-inline">
            No canonical ReleaseRecord exists for this project.
          </div>
        ) : (
          <div className="governance-record-list">
            {releases.map((item) => (
              <article className="governance-record-card" key={item.id}>
                <div className="governance-record-heading">
                  <div>
                    <h4>{item.version}</h4>
                    <span>{item.id}</span>
                  </div>
                  <div className="governance-status-stack">
                    <span
                      className={
                        "status-chip " + releaseStatusClass(item.status)
                      }
                    >
                      {item.status}
                    </span>
                    <span className="status-chip status-chip-neutral">
                      {item.environment}
                    </span>
                  </div>
                </div>

                <div className="canonical-release-critical">
                  <div>
                    <strong>Exact revision</strong>
                    <span>{item.revision}</span>
                  </div>
                  <div className="governance-linked-work">
                    <strong>Gate evidence</strong>
                    {item.gateEvidenceIds.length ? (
                      <div className="workspace-chip-list">
                        {item.gateEvidenceIds.map((id) => (
                          <span
                            className="status-chip status-chip-neutral"
                            key={id}
                          >
                            {id}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span>No release evidence linked yet.</span>
                    )}
                  </div>
                </div>

                <details className="canonical-disclosure release-disclosure">
                  <summary>
                    Rollback & provenance
                    <span>{item.rollbackRevision ?? item.artifactSource}</span>
                  </summary>
                  <div className="canonical-disclosure-body">
                    <div className="governance-detail-grid">
                      <div>
                        <strong>Artifact source</strong>
                        <span>{item.artifactSource}</span>
                      </div>
                      <div>
                        <strong>Released at</strong>
                        <span>{item.releasedAt ?? "Not released yet"}</span>
                      </div>
                      <div>
                        <strong>Rollback revision</strong>
                        <span>{item.rollbackRevision ?? "Not rolled back"}</span>
                      </div>
                      <div className="governance-detail-span">
                        <strong>Rollback plan</strong>
                        <span>{item.rollbackPlan}</span>
                      </div>
                    </div>

                    {item.notes ? (
                      <p className="governance-link-note">{item.notes}</p>
                    ) : null}

                    <footer className="governance-record-footer">
                      <span>Record v{item.meta.recordVersion}</span>
                      <span>Updated {item.meta.updatedAt}</span>
                    </footer>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Lessons Learned</p>
            <h3>Observed learning and follow-up action</h3>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="workspace-empty-inline">
            No canonical LessonLearned record exists for this project.
          </div>
        ) : (
          <div className="governance-record-list">
            {lessons.map((item) => (
              <article className="governance-record-card" key={item.id}>
                <div className="governance-record-heading">
                  <div>
                    <h4>{item.title}</h4>
                    <span>{item.id}</span>
                  </div>
                  <span className="status-chip status-chip-info">
                    {item.category}
                  </span>
                </div>

                <div className="canonical-lesson-primary">
                  <strong>Action</strong>
                  <span>{item.action}</span>
                </div>

                <details className="canonical-disclosure lesson-disclosure">
                  <summary>
                    Observation, impact & provenance
                    <span>{item.sourceRevision}</span>
                  </summary>
                  <div className="canonical-disclosure-body">
                    <div className="governance-record-body">
                      <div>
                        <strong>Observation</strong>
                        <p>{item.observation}</p>
                      </div>
                      <div>
                        <strong>Impact</strong>
                        <p>{item.impact}</p>
                      </div>
                    </div>

                    <div className="governance-detail-grid">
                      <div>
                        <strong>Linked release</strong>
                        <span>{item.releaseId ?? "No release link"}</span>
                      </div>
                      <div>
                        <strong>Source revision</strong>
                        <span>{item.sourceRevision}</span>
                      </div>
                    </div>

                    <div className="governance-linked-work">
                      <strong>Linked Work Packages</strong>
                      {item.linkedWorkPackageIds.length ? (
                        <div className="workspace-chip-list">
                          {item.linkedWorkPackageIds.map((id) => (
                            <span
                              className="status-chip status-chip-neutral"
                              key={id}
                            >
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
                      <span>Updated {item.meta.updatedAt}</span>
                    </footer>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </ProjectWorkspaceFrame>
  );
}
