import type { BlueprintServerRuntime } from "@blueprint-os/runtime";
import {
  EmptyState,
  MetricCard,
  SectionHeading,
  StatusChip,
  type StatusTone
} from "@blueprint-os/ui";

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

function readinessTone(state: ReadinessState): StatusTone {
  if (state === "blocked") return "warning";
  if (state === "gate-ready") return "success";
  if (state === "attention") return "info";
  return "neutral";
}

function evidenceLabel(freshness: EvidenceFreshness): string {
  if (freshness === "none") return "No linked evidence";
  if (freshness === "incomplete") return "Evidence references incomplete";
  return "Revision recorded · currentness unverified";
}

function gateStatusTone(status: string): StatusTone {
  if (status === "pass") return "success";
  if (status === "fail" || status === "missing") return "warning";
  if (status === "candidate") return "info";
  return "neutral";
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
        <StatusChip tone={readinessTone(readiness.state)}>
          {readinessLabel(readiness.state)}
        </StatusChip>
      </section>

      <section
        className="readiness-metrics"
        aria-label="Canonical readiness summary"
      >
        <MetricCard
          className="readiness-metric"
          label="Required gates"
          value={
            <>
              {readiness.gateSummary.passRequired} /{" "}
              {readiness.gateSummary.required} PASS
            </>
          }
          detail={
            readiness.gateSummary.missingRequired > 0
              ? readiness.gateSummary.missingRequired +
                " required gate records missing"
              : readiness.gateSummary.trackedRequired +
                " required gates tracked"
          }
        />
        <MetricCard
          className="readiness-metric"
          label="Canonical work"
          value={readiness.workSummary.blocked + " blocked"}
          detail={
            readiness.workSummary.completed +
            " of " +
            readiness.workSummary.total +
            " completed"
          }
        />
        <MetricCard
          className="readiness-metric"
          label="Linked evidence"
          value={readiness.evidenceSummary.linked}
          detail={evidenceLabel(readiness.evidenceSummary.freshness)}
        />
      </section>

      <section className="readiness-detail-grid">
        <article className="readiness-panel">
          <SectionHeading
            className="readiness-panel-heading"
            kicker="Active gates"
            title="What still needs attention"
            aside={
              <StatusChip>
                {readiness.gateSummary.activeTracked} active
              </StatusChip>
            }
          />

          {readiness.activeGates.length === 0 ? (
            <EmptyState
              className="readiness-empty"
              title="No active canonical gates are recorded."
            />
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
                  <StatusChip tone={gateStatusTone(gate.status)}>
                    {gate.status === "missing"
                      ? "Missing"
                      : gate.status.replace("-", " ")}
                  </StatusChip>
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
            <SectionHeading
              className="readiness-panel-heading"
              kicker="Blocked work"
              title="Dependency blockers"
              aside={<StatusChip>{readiness.blockedWork.length}</StatusChip>}
            />

            {readiness.blockedWork.length === 0 ? (
              <EmptyState
                className="readiness-empty"
                title="No Work Package is blocked by an unfinished dependency."
              />
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
