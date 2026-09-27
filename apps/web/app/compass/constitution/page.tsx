import {
  buildBlueprintOsConstitutionAudit,
  p9019ProfessionalReviewCandidate
} from "@blueprint-os/application";
import { AppShell, StatusChip } from "@blueprint-os/ui";
import Link from "next/link";

import { resolveWebActor } from "../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../src/server/runtime";

export const dynamic = "force-dynamic";

async function loadAudit() {
  const actor = await resolveWebActor();
  if (!actor) {
    return buildBlueprintOsConstitutionAudit();
  }

  const runtime = getBlueprintServerRuntime();
  const canReview = await runtime.authority.can(
    actor,
    p9019ProfessionalReviewCandidate.projectId,
    "PROJECT_REVIEW"
  );

  if (!canReview) {
    return buildBlueprintOsConstitutionAudit();
  }

  const decision = await runtime.professionalReview.currentDecision(actor);
  return buildBlueprintOsConstitutionAudit({ reviewDecision: decision });
}

function tone(state: "historical-evidence" | "human-review-required" | "final-evidence-required") {
  if (state === "human-review-required") return "warning" as const;
  if (state === "final-evidence-required") return "info" as const;
  return "success" as const;
}

function label(state: "historical-evidence" | "human-review-required" | "final-evidence-required") {
  if (state === "human-review-required") return "Human review required";
  if (state === "final-evidence-required") return "Final evidence required";
  return "Historical evidence";
}

export default async function ConstitutionSelfAuditPage() {
  const audit = await loadAudit();

  return (
    <AppShell>
      <main className="compass-acceptance-page">
        <div className="professional-review-breadcrumbs">
          <Link className="text-link" href="/compass">
            System Compass
          </Link>
          <span aria-hidden="true">/</span>
          <span>Constitution Self-Audit</span>
        </div>

        <header className="compass-acceptance-header">
          <div>
            <p className="eyebrow">Blueprint OS · Universal Constitution</p>
            <h1>Constitutional Self-Audit</h1>
            <p className="lede">
              Blueprint OS is subject to the same century-grade law it imposes
              on every other project. Historical evidence may support a pillar,
              but this surface cannot manufacture a Quality Gate PASS.
            </p>
          </div>
          <div className="professional-review-statuses">
            <StatusChip tone={audit.state === "blocked" ? "warning" : "info"}>
              {audit.state === "blocked"
                ? "Constitution blocked"
                : "Ready for final evidence"}
            </StatusChip>
            <StatusChip tone="warning">Production not authorized</StatusChip>
          </div>
        </header>

        <section
          className="compass-acceptance-summary"
          aria-label="Constitution self-audit summary"
        >
          <article>
            <span>Policy</span>
            <strong>{audit.policyVersion}</strong>
          </article>
          <article>
            <span>Blueprint level</span>
            <strong>{audit.blueprintLevel}</strong>
          </article>
          <article>
            <span>Mandatory pillars</span>
            <strong>{audit.pillars.length}</strong>
          </article>
          <article>
            <span>Gate PASS recorded here</span>
            <strong>{audit.canonicalGatePassRecorded ? "Yes" : "No"}</strong>
          </article>
        </section>

        <section
          className="compass-acceptance-criteria"
          aria-labelledby="constitution-pillars-title"
        >
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Six mandatory pillars</p>
              <h2 id="constitution-pillars-title">
                The project must satisfy its own law
              </h2>
              <p>
                Existing evidence is treated as support only. Final acceptance
                still requires current exact-revision evidence for the required
                Constitutional gates.
              </p>
            </div>
          </div>

          <div className="compass-acceptance-grid">
            {audit.pillars.map((pillar) => (
              <article key={pillar.id}>
                <div>
                  <strong>{pillar.label}</strong>
                  <StatusChip tone={tone(pillar.state)}>
                    {label(pillar.state)}
                  </StatusChip>
                </div>
                <p>{pillar.detail}</p>

                <div className="workspace-chip-list" aria-label={pillar.label + " required gates"}>
                  {pillar.requiredGateIds.map((gateId) => (
                    <span className="status-chip status-chip-neutral" key={gateId}>
                      {gateId}
                    </span>
                  ))}
                </div>

                <details className="canonical-disclosure">
                  <summary>
                    Evidence & blockers
                    <span>{pillar.evidence.length} evidence reference(s)</span>
                  </summary>
                  <div className="canonical-disclosure-body">
                    <div className="governance-record-list">
                      {pillar.evidence.map((item) => (
                        <div className="governance-record-card" key={item.label}>
                          <strong>{item.label}</strong>
                          <span>{item.source}</span>
                          <code>{item.revision}</code>
                        </div>
                      ))}
                    </div>
                    {pillar.blockers.length ? (
                      <ul>
                        {pillar.blockers.map((blocker) => (
                          <li key={blocker}>{blocker}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No pillar-specific blocker is recorded before final exact-revision evidence.</p>
                    )}
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>

        {audit.blockers.length ? (
          <section
            className="compass-acceptance-blockers"
            aria-labelledby="constitution-blockers-title"
          >
            <p className="section-kicker">Constitution blockers</p>
            <h2 id="constitution-blockers-title">
              Blueprint OS cannot declare itself compliant yet
            </h2>
            <ul>
              {audit.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
            <Link className="primary-button" href="/professional-review">
              Complete P9-019 human review
            </Link>
          </section>
        ) : (
          <section className="compass-acceptance-ready">
            <p className="section-kicker">Constitution state</p>
            <h2>All six pillars may collect final evidence</h2>
            <p>
              Human review is bound to the exact candidate, but no Constitutional
              gate is PASS merely because this self-audit is green enough to proceed.
            </p>
          </section>
        )}

        <section className="professional-review-boundary-card">
          <p className="section-kicker">Authority boundary</p>
          <h2>Self-audit is not self-approval.</h2>
          <p>{audit.boundaryNote}</p>
          <div className="professional-review-actions">
            <Link className="text-link" href="/compass/acceptance">
              Open P9-020 acceptance preflight
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
