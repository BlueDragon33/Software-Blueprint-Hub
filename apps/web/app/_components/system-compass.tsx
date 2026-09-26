import Link from "next/link";
import { StatusChip } from "@blueprint-os/ui";
import {
  getBlueprintCompassProjection,
  type BlueprintCompassProjection
} from "@blueprint-os/application";

function shortRevision(revision: string) {
  return revision.slice(0, 12) + "…";
}

function statusTone(status: "complete" | "active" | "next") {
  if (status === "complete") return "success" as const;
  if (status === "active") return "info" as const;
  return "neutral" as const;
}

export function SystemCompass({
  compact = false,
  projection = getBlueprintCompassProjection()
}: {
  readonly compact?: boolean;
  readonly projection?: BlueprintCompassProjection;
}) {
  return (
    <section className={compact ? "system-compass system-compass-compact" : "system-compass"} aria-labelledby="system-compass-title">
      <header className="system-compass-header">
        <div>
          <p className="section-kicker">Engineering compass</p>
          <h2 id="system-compass-title">
            {projection.phase}
          </h2>
          <p>
            Where the system is, why this work is valid, and what may happen next.
            No synthetic progress percentage is used.
          </p>
        </div>
        <div className="system-compass-badges">
          <StatusChip tone="info">Storey {projection.currentStorey.number} / {projection.currentStorey.total}</StatusChip>
          <StatusChip tone="warning">Production not authorized</StatusChip>
        </div>
      </header>

      <div className="system-compass-current">
        <div className="system-compass-storey" aria-hidden="true">
          <span>{String(projection.currentStorey.number).padStart(2, "0")}</span>
          <small>STOREY</small>
        </div>
        <div>
          <p className="section-kicker">Active Work Package</p>
          <h3>{projection.activeWork.id} · {projection.activeWork.title}</h3>
          <p>{projection.activeWork.reason}</p>
        </div>
      </div>

      <div className="system-compass-sequence" aria-label="Current construction sequence">
        {projection.workSequence.map((item) => (
          <article key={item.id} data-status={item.status}>
            <div>
              <small>Storey {item.storey}</small>
              <strong>{item.id}</strong>
            </div>
            <span>{item.title}</span>
            <StatusChip tone={statusTone(item.status)}>
              {item.status === "complete" ? "Complete" : item.status === "active" ? "Active" : "Next"}
            </StatusChip>
          </article>
        ))}
      </div>

      {!compact ? (
        <div className="system-compass-detail-grid">
          <article className="system-compass-panel">
            <div className="system-compass-panel-heading">
              <div>
                <p className="section-kicker">Dependency state</p>
                <h3>What is blocking construction?</h3>
              </div>
              <StatusChip tone={projection.dependencyBlockers.length ? "warning" : "success"}>
                {projection.dependencyBlockers.length ? projection.dependencyBlockers.length + " blockers" : "No recorded dependency blocker"}
              </StatusChip>
            </div>
            {projection.dependencyBlockers.length ? (
              <ul>
                {projection.dependencyBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            ) : (
              <p className="system-compass-note">
                P9-001 is complete. P9-002 is therefore the next dependency-valid Work Package.
              </p>
            )}
          </article>

          <article className="system-compass-panel">
            <div className="system-compass-panel-heading">
              <div>
                <p className="section-kicker">Open risks</p>
                <h3>What must not be forgotten?</h3>
              </div>
              <StatusChip>{projection.risks.length}</StatusChip>
            </div>
            <div className="system-compass-risk-list">
              {projection.risks.map((risk) => (
                <div key={risk.id}>
                  <strong>{risk.title}</strong>
                  <p>{risk.treatment}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="system-compass-panel">
            <div className="system-compass-panel-heading">
              <div>
                <p className="section-kicker">Exact evidence</p>
                <h3>Why may construction continue?</h3>
              </div>
              <StatusChip tone="success">Evidence linked</StatusChip>
            </div>
            <div className="system-compass-evidence-list">
              {projection.evidence.map((item) => (
                <div key={item.revision}>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.source}</small>
                  </span>
                  <code title={item.revision}>{shortRevision(item.revision)}</code>
                </div>
              ))}
            </div>
          </article>

          <article className="system-compass-panel">
            <div className="system-compass-panel-heading">
              <div>
                <p className="section-kicker">Next valid actions</p>
                <h3>What happens after this?</h3>
              </div>
            </div>
            <ol className="system-compass-next-list">
              {projection.nextActions.map((action) => <li key={action}>{action}</li>)}
            </ol>
          </article>
        </div>
      ) : null}

      <footer className="system-compass-footer">
        <p>{projection.truthNote}</p>
        {compact ? <Link className="secondary-button" href="/compass">Open full Compass</Link> : <Link className="secondary-button" href="/">Back to Projects</Link>}
      </footer>
    </section>
  );
}
