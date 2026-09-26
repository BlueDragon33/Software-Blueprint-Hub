import Link from "next/link";
import { StatusChip } from "@blueprint-os/ui";
import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";
import { PromptTools } from "./prompt-tools";

export const dynamic = "force-dynamic";

interface PromptPageProps {
  readonly params: Promise<{ projectId: string }>;
  readonly searchParams: Promise<{
    historyPage?: string | string[];
  }>;
}

function positivePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function shortHash(value: string): string {
  return value.length > 24 ? value.slice(0, 24) + "…" : value;
}

export default async function PromptPage({
  params,
  searchParams
}: PromptPageProps) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const historyPageNumber = positivePage(query.historyPage);
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const [historyPage, currentSourceRevision] = await Promise.all([
    workspace.runtime.prompts.historyPage(
      workspace.actor,
      workspace.projectId,
      historyPageNumber
    ),
    workspace.runtime.prompts.currentSourceRevision(
      workspace.actor,
      workspace.projectId
    )
  ]);

  const history = historyPage.items;
  const latest = historyPage.latest;
  const latestIsStale = latest
    ? latest.sourceRevision !== currentSourceRevision
    : false;

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="prompt"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Prompt Workspace</p>
          <h2>Derived execution projection</h2>
          <p>
            Prompt content is generated from canonical project state. It is a
            handoff artifact, never a source-of-truth and never an editable
            substitute for Profile, Blueprint, Work or Quality state.
          </p>
        </div>
        <StatusChip
          tone={
            latest
              ? latestIsStale
                ? "warning"
                : "success"
              : "neutral"
          }
        >
          {latest ? (latestIsStale ? "Stale" : "Fresh") : "Not generated"}
        </StatusChip>
      </section>

      <section className="prompt-workspace-summary">
        <div className="prompt-workspace-revision">
          <span>Current canonical source revision</span>
          <strong>{shortHash(currentSourceRevision)}</strong>
          <small>
            Recomputed from current Project Profile, resolved Blueprint, Work
            Packages, Quality Gates and linked evidence.
          </small>
        </div>
        <PromptTools
          projectId={workspace.projectId}
          projection={latest}
        />
      </section>

      {latest ? (
        <>
          <section
            className={
              "prompt-workspace-state " +
              (latestIsStale
                ? "prompt-workspace-state-stale"
                : "prompt-workspace-state-fresh")
            }
          >
            <div>
              <p className="section-kicker">Latest snapshot</p>
              <h3>
                {latestIsStale
                  ? "Canonical state has changed since this prompt was generated."
                  : "This prompt matches the current canonical source revision."}
              </h3>
              <p>
                {latestIsStale
                  ? "Regenerate before execution. The existing snapshot remains in history for provenance."
                  : "Fresh means the deterministic source revision matches now; it does not mean every Quality Gate is PASS."}
              </p>
            </div>
            <StatusChip>{latest.templateVersion}</StatusChip>
          </section>

          <section className="workspace-section">
            <div className="workspace-section-heading">
              <div>
                <p className="section-kicker">Projection</p>
                <h3>Execution prompt</h3>
              </div>
              <StatusChip>{latest.id}</StatusChip>
            </div>

            <details className="canonical-disclosure prompt-metadata-disclosure">
              <summary>
                Snapshot metadata
                <span>{latest.generatedAt}</span>
              </summary>
              <div className="canonical-disclosure-body">
                <dl className="prompt-workspace-metadata">
                  <div>
                    <dt>Generated</dt>
                    <dd>{latest.generatedAt}</dd>
                  </div>
                  <div>
                    <dt>Source revision</dt>
                    <dd>{shortHash(latest.sourceRevision)}</dd>
                  </div>
                  <div>
                    <dt>Content hash</dt>
                    <dd>{shortHash(latest.contentHash)}</dd>
                  </div>
                  <div>
                    <dt>Template</dt>
                    <dd>{latest.templateVersion}</dd>
                  </div>
                </dl>
              </div>
            </details>

            <div className="prompt-card prompt-workspace-content-card">
              <div className="prompt-toolbar">
                <span>Derived · read-only</span>
                <span>
                  {latestIsStale ? "Regeneration required" : "Source revision matched"}
                </span>
              </div>
              <pre>{latest.content}</pre>
            </div>
          </section>
        </>
      ) : (
        <section className="workspace-module-state">
          <p className="section-kicker">No Prompt history yet</p>
          <h2>Generate the first canonical projection</h2>
          <p>
            Generation reads current canonical state and records an append-only
            derived snapshot. It does not mutate project truth.
          </p>
        </section>
      )}

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">History</p>
            <h3>Prompt Projection snapshots</h3>
          </div>
          <StatusChip>
            Page {historyPage.page} · {history.length} shown
          </StatusChip>
        </div>

        {history.length === 0 ? (
          <div className="workspace-empty-inline">
            No derived Prompt Projection snapshot has been recorded.
          </div>
        ) : (
          <details className="canonical-disclosure prompt-history-disclosure">
            <summary>
              Show Prompt history
              <span>
                {history.length} on this page · latest {latest?.generatedAt}
              </span>
            </summary>
            <div className="canonical-disclosure-body">
              <div className="prompt-history-list">
                {history.map((item, index) => {
                  const stale = item.sourceRevision !== currentSourceRevision;
                  return (
                    <article
                      className="prompt-history-row"
                      key={item.id + item.generatedAt}
                    >
                      <div className="prompt-history-index">{index + 1}</div>
                      <div>
                        <strong>{item.generatedAt}</strong>
                        <span>{shortHash(item.contentHash)}</span>
                        <small>{shortHash(item.sourceRevision)}</small>
                      </div>
                      <StatusChip tone={stale ? "warning" : "success"}>
                        {stale ? "Stale" : "Current"}
                      </StatusChip>
                    </article>
                  );
                })}
              </div>
            </div>
          </details>
        )}

        {(historyPage.hasPrevious || historyPage.hasNext) ? (
          <nav
            className="prompt-history-pagination"
            aria-label="Prompt history pages"
          >
            {historyPage.hasPrevious ? (
              <Link
                className="secondary-button registry-action"
                href={"?historyPage=" + (historyPage.page - 1)}
              >
                Previous history page
              </Link>
            ) : <span />}

            <span aria-live="polite">
              History page {historyPage.page}
            </span>

            {historyPage.hasNext ? (
              <Link
                className="secondary-button registry-action"
                href={"?historyPage=" + (historyPage.page + 1)}
              >
                Next history page
              </Link>
            ) : <span />}
          </nav>
        ) : null}
      </section>
    </ProjectWorkspaceFrame>
  );
}
