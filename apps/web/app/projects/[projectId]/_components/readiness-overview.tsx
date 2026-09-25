import type { BlueprintServerRuntime } from "@blueprint-os/runtime";

type ReadinessSnapshot = Awaited<
  ReturnType<BlueprintServerRuntime["readiness"]["read"]>
>;

type ReadinessState = ReadinessSnapshot["state"];
type EvidenceFreshness = ReadinessSnapshot["evidenceSummary"]["freshness"];

function readinessLabel(state: ReadinessState): string {
  if (state === "blocked") return "Blocked";
  if (state === "attention") return "Review needed";
  if (state === "gate-ready") return "Required gates PASS";
  return "In progress";
}

function readinessChipClass(state: ReadinessState): string {
  if (state === "blocked") return "status-chip-warning";
  if (state === "gate-ready") return "status-chip-success";
  if (state === "attention") return "status-chip-info";
  return "status-chip-neutral";
}

function evidenceLabel(freshness: EvidenceFreshness): string {
  if (freshness === "none") return "No linked evidence";
  if (freshness === "incomplete") return "Evidence references incomplete";
  return "Revision recorded · currentness unverified";
}

function gateStatusClass(status: string): string {
  if (status === "pass") return "status-chip-success";
  if (status === "fail" || status === "missing") return "status-chip-warning";
  if (status === "candidate") return "status-chip-info";
  return "status-chip-neutral";
}

function shortRevision(revision: string | null): string | null {
  if (!revision) return null;
  return revision.length > 18 ? revision.slice(0, 18) + "…" : revision;
}

export function ReadinessOverview({
  readiness
}: {
  readonly readiness: ReadinessSnapshot;
}) {
  return (
    <>
      <section
        className={"readiness-hero readiness-" + readiness.state}
        aria-labelledby="readiness-heading"
      >
        <div>
          <p className="section-kicker">Project readiness</p>
          <h2 id="readiness-heading">{readiness.headline}</h2>
          <p>
            Readiness comes from canonical gates, evidence and dependency state.
            Blueprint OS does not manufacture a progress percentage.
          </p>
        </div>
        <span
          className={"status-chip " + readinessChipClass(readiness.state)}
        >
          {readinessLabel(readiness.state)}
        </span>
      </section>

      <section
        className="readiness-metrics"
        aria-label="Canonical readiness summary"
      >
        <article className="readiness-metric">
          <span>Required gates</span>
          <strong>
            {readiness.gateSummary.passRequired} /{" "}
            {readiness.gateSummary.required} PASS
          </strong>
          <small>
            {readiness.gateSummary.missingRequired > 0
              ? readiness.gateSummary.missingRequired +
                " required gate records missing"
              : readiness.gateSummary.trackedRequired +
                " required gates tracked"}
          </small>
        </article>
        <article className="readiness-metric">
          <span>Canonical work</span>
          <strong>{readiness.workSummary.blocked} blocked</strong>
          <small>
            {readiness.workSummary.completed} of {readiness.workSummary.total}{" "}
            completed
          </small>
        </article>
        <article className="readiness-metric">
          <span>Linked evidence</span>
          <strong>{readiness.evidenceSummary.linked}</strong>
          <small>{evidenceLabel(readiness.evidenceSummary.freshness)}</small>
        </article>
      </section>

      <section className="readiness-detail-grid">
        <article className="readiness-panel">
          <div className="readiness-panel-heading">
            <div>
              <p className="section-kicker">Active gates</p>
              <h2>What still needs attention</h2>
            </div>
            <span className="status-chip status-chip-neutral">
              {readiness.gateSummary.activeTracked} active
            </span>
          </div>

          {readiness.activeGates.length === 0 ? (
            <div className="readiness-empty">
              No active canonical gates are recorded.
            </div>
          ) : (
            <div className="readiness-gate-list">
              {readiness.activeGates.slice(0, 8).map((gate) => (
                <div className="readiness-gate-row" key={gate.id}>
                  <div>
                    <strong>{gate.name}</strong>
                    <span>{gate.id}</span>
                    <small>
                      {gate.latestEvidenceRevision
                        ? "Evidence revision " +
                          shortRevision(gate.latestEvidenceRevision)
                        : evidenceLabel(gate.evidenceFreshness)}
                    </small>
                  </div>
                  <span
                    className={
                      "status-chip " + gateStatusClass(gate.status)
                    }
                  >
                    {gate.status === "missing"
                      ? "Missing"
                      : gate.status.replace("-", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="readiness-provenance-note">
            Evidence source/revision is preserved. Current-vs-stale status is not
            asserted until a trusted source can provide the current revision for
            comparison.
          </p>
        </article>

        <div className="readiness-side-stack">
          <article className="next-action-card">
            <p className="section-kicker">Next action</p>
            <h2>{readiness.nextAction.label}</h2>
            <p>{readiness.nextAction.reason}</p>
          </article>

          <article className="readiness-panel">
            <div className="readiness-panel-heading">
              <div>
                <p className="section-kicker">Blocked work</p>
                <h2>Dependency blockers</h2>
              </div>
              <span className="status-chip status-chip-neutral">
                {readiness.blockedWork.length}
              </span>
            </div>

            {readiness.blockedWork.length === 0 ? (
              <div className="readiness-empty">
                No Work Package is blocked by an unfinished dependency.
              </div>
            ) : (
              <div className="readiness-blocker-list">
                {readiness.blockedWork.slice(0, 6).map((work) => (
                  <div className="readiness-blocker" key={work.id}>
                    <strong>{work.title}</strong>
                    <span>{work.id}</span>
                    {work.blockers.map((blocker) => (
                      <small key={blocker.dependencyId}>
                        {blocker.reason}
                      </small>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </>
  );
}
