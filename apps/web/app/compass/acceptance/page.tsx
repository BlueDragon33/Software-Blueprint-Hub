import {
  buildCompassAcceptancePreflight,
  evaluateConstitutionalCompliance,
  p9019ProfessionalReviewCandidate,
  type ConstitutionalComplianceAudit
} from "@blueprint-os/application";
import { AppShell, StatusChip } from "@blueprint-os/ui";
import Link from "next/link";

import { resolveWebActor } from "../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../src/server/runtime";

export const dynamic = "force-dynamic";

async function loadAcceptanceState(): Promise<{
  readonly preflight: ReturnType<typeof buildCompassAcceptancePreflight>;
  readonly constitutionAudit: ConstitutionalComplianceAudit | null;
}> {
  const actor = await resolveWebActor();
  if (!actor) {
    return Object.freeze({
      preflight: buildCompassAcceptancePreflight(),
      constitutionAudit: null
    });
  }

  const runtime = getBlueprintServerRuntime();
  const projectId = p9019ProfessionalReviewCandidate.projectId;
  const canReview = await runtime.authority.can(
    actor,
    projectId,
    "PROJECT_REVIEW"
  );
  if (!canReview) {
    return Object.freeze({
      preflight: buildCompassAcceptancePreflight(),
      constitutionAudit: null
    });
  }

  const [decision, project, gateBundles] = await Promise.all([
    runtime.professionalReview.currentDecision(actor),
    runtime.profiles.read(actor, projectId),
    runtime.workQuality.listQualityGates(actor, projectId)
  ]);

  const constitutionAudit = project
    ? evaluateConstitutionalCompliance({
        blueprint: project.blueprint,
        gateBundles
      })
    : null;

  return Object.freeze({
    preflight: buildCompassAcceptancePreflight({
      reviewDecision: decision,
      constitutionAudit
    }),
    constitutionAudit
  });
}

function tone(state: "pass" | "blocked" | "pending-final-evidence") {
  if (state === "pass") return "success" as const;
  if (state === "blocked") return "warning" as const;
  return "info" as const;
}

function label(state: "pass" | "blocked" | "pending-final-evidence") {
  if (state === "pass") return "Satisfied";
  if (state === "blocked") return "Blocked";
  return "Final evidence required";
}

export default async function CompassAcceptancePage() {
  const { preflight, constitutionAudit } = await loadAcceptanceState();

  return (
    <AppShell>
      <main className="compass-acceptance-page">
        <div className="professional-review-breadcrumbs">
          <Link className="text-link" href="/compass">
            System Compass
          </Link>
          <span aria-hidden="true">/</span>
          <span>P9-020 Acceptance</span>
        </div>

        <header className="compass-acceptance-header">
          <div>
            <p className="eyebrow">Blueprint OS · Storey 20</p>
            <h1>Compass Acceptance Gate</h1>
            <p className="lede">
              Final reference-baseline acceptance is dependency-driven and
              exact-evidence bound. This page is a preflight, not a PASS button.
            </p>
          </div>
          <div className="professional-review-statuses">
            <StatusChip tone={preflight.state === "locked" ? "warning" : "info"}>
              {preflight.state === "locked"
                ? "Dependency locked"
                : "Ready for final evidence"}
            </StatusChip>
            <StatusChip tone="warning">Production not authorized</StatusChip>
          </div>
        </header>

        <section
          className="compass-acceptance-summary"
          aria-label="P9-020 preflight summary"
        >
          <article>
            <span>Work Package</span>
            <strong>{preflight.workPackageId}</strong>
          </article>
          <article>
            <span>Open blockers</span>
            <strong>{preflight.blockers.length}</strong>
          </article>
          <article>
            <span>Final Release Gate</span>
            <strong>{preflight.requiresFinalReleaseGate ? "Required" : "No"}</strong>
          </article>
          <article>
            <span>Acceptance recorded</span>
            <strong>{preflight.acceptanceRecorded ? "Yes" : "No"}</strong>
          </article>
        </section>

        <section
          className="compass-constitution-audit"
          aria-labelledby="compass-constitution-audit-title"
        >
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Universal Constitution self-audit</p>
              <h2 id="compass-constitution-audit-title">
                Blueprint OS is subject to the same law it imposes
              </h2>
              <p>
                Compliance is read from the resolved Blueprint and canonical
                QualityGate evidence. Documentation cannot self-certify PASS.
              </p>
            </div>
            <StatusChip
              tone={
                constitutionAudit?.state === "compliant"
                  ? "success"
                  : "warning"
              }
            >
              {constitutionAudit?.state === "compliant"
                ? "COMPLIANT"
                : "NON-COMPLIANT"}
            </StatusChip>
          </div>

          {constitutionAudit ? (
            <>
              <div className="compass-constitution-grid">
                {constitutionAudit.pillars.map((pillar) => (
                  <article key={pillar.id}>
                    <div>
                      <strong>{pillar.label}</strong>
                      <StatusChip
                        tone={
                          pillar.state === "compliant"
                            ? "success"
                            : "warning"
                        }
                      >
                        {pillar.state === "compliant"
                          ? "Compliant"
                          : "Blocked"}
                      </StatusChip>
                    </div>
                    {pillar.missingRequirementIds.length ? (
                      <p>
                        Missing requirements:{" "}
                        {pillar.missingRequirementIds.join(", ")}
                      </p>
                    ) : pillar.blockingGateIds.length ? (
                      <p>
                        Blocking gates: {pillar.blockingGateIds.join(", ")}
                      </p>
                    ) : (
                      <p>Required module/gate obligations are satisfied.</p>
                    )}
                  </article>
                ))}
              </div>

              <div className="compass-constitution-gates">
                {constitutionAudit.gates.map((gate) => (
                  <div key={gate.id}>
                    <code>{gate.id}</code>
                    <StatusChip
                      tone={gate.state === "pass" ? "success" : "warning"}
                    >
                      {gate.state}
                    </StatusChip>
                  </div>
                ))}
              </div>

              {constitutionAudit.blockers.length ? (
                <div className="compass-constitution-blockers">
                  <strong>Constitution blockers</strong>
                  <ul>
                    {constitutionAudit.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <p className="readiness-provenance-note">
                {constitutionAudit.boundaryNote}
              </p>
            </>
          ) : (
            <div className="workspace-empty-inline">
              Canonical Blueprint / QualityGate state for project:blueprint-os
              is not available to this request. The audit fails closed and
              P9-020 remains blocked.
            </div>
          )}
        </section>

        <section
          className="compass-acceptance-criteria"
          aria-labelledby="compass-acceptance-criteria-title"
        >
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Acceptance criteria</p>
              <h2 id="compass-acceptance-criteria-title">
                Every condition must be evidence-backed
              </h2>
              <p>
                A green-looking screen is not acceptance. Pending final evidence
                remains pending until the exact P9-020 revision passes the final gate.
              </p>
            </div>
          </div>

          <div className="compass-acceptance-grid">
            {preflight.criteria.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <StatusChip tone={tone(item.state)}>{label(item.state)}</StatusChip>
                </div>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {preflight.blockers.length ? (
          <section className="compass-acceptance-blockers" aria-labelledby="compass-acceptance-blockers-title">
            <p className="section-kicker">Dependency blockers</p>
            <h2 id="compass-acceptance-blockers-title">
              P9-020 cannot begin yet
            </h2>
            <ul>
              {preflight.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
            <Link className="primary-button" href="/professional-review">
              Complete P9-019 human review
            </Link>
          </section>
        ) : (
          <section className="compass-acceptance-ready">
            <p className="section-kicker">Dependency state</p>
            <h2>P9-020 may collect final evidence</h2>
            <p>
              Human approval unlocked this Work Package. Acceptance is still
              unrecorded until the final contradiction, authority and Release
              Gate evidence is produced on the exact acceptance revision.
            </p>
          </section>
        )}

        <section className="professional-review-boundary-card">
          <p className="section-kicker">Authority boundary</p>
          <h2>Acceptance is not deployment.</h2>
          <p>{preflight.boundaryNote}</p>
          <p>
            Production release authority remains false even if every P9-020
            criterion later passes.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
