import {
  p9019ProfessionalReviewCandidate
} from "@blueprint-os/application";
import { AppShell, StatusChip } from "@blueprint-os/ui";
import Link from "next/link";

import { resolveWebActor } from "../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../src/server/runtime";
import {
  ProfessionalReviewDecisionPanel,
  type ExistingProfessionalReviewDecision
} from "./professional-review-decision-panel";

export const dynamic = "force-dynamic";

export default async function ProfessionalReviewPage() {
  const actor = await resolveWebActor();

  if (!actor) {
    return (
      <AppShell>
        <main className="professional-review-page">
          <Link className="text-link" href="/compass">
            ← System Compass
          </Link>
          <section className="professional-review-state">
            <p className="section-kicker">P9-019 · Human professional review</p>
            <h1>Sign in to review the exact candidate.</h1>
            <p>
              Automated evidence is visible only as review input. A human
              decision requires an authenticated reviewer.
            </p>
            <a className="primary-button" href="/api/auth/signin">
              Sign in
            </a>
          </section>
        </main>
      </AppShell>
    );
  }

  let existingDecision: ExistingProfessionalReviewDecision | null = null;
  try {
    const stored =
      await getBlueprintServerRuntime().professionalReview.currentDecision(actor);
    existingDecision = stored
      ? {
          decision: stored.decision,
          decidedAt: stored.decidedAt,
          note: stored.note,
          acknowledgedFindingIds: stored.acknowledgedFindingIds,
          humanSignoff: stored.humanSignoff,
          p9020TransitionAllowed: stored.p9020TransitionAllowed,
          productionReleaseAuthority: false,
          blockers: stored.blockers
        }
      : null;
  } catch {
    return (
      <AppShell>
        <main className="professional-review-page">
          <Link className="text-link" href="/compass">
            ← System Compass
          </Link>
          <section className="professional-review-state" role="alert">
            <p className="section-kicker">Authority protected</p>
            <h1>PROJECT_REVIEW authority is required.</h1>
            <p>
              Blueprint OS did not expose a decision control to this account.
            </p>
          </section>
        </main>
      </AppShell>
    );
  }

  const candidate = p9019ProfessionalReviewCandidate;
  const releaseGateUrl =
    "https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/" +
    candidate.evidenceArtifact.workflowRunId;
  const artifactUrl =
    releaseGateUrl + "/artifacts/" + candidate.evidenceArtifact.artifactId;

  return (
    <AppShell>
      <main className="professional-review-page">
        <div className="professional-review-breadcrumbs">
          <Link className="text-link" href="/compass">
            System Compass
          </Link>
          <span aria-hidden="true">/</span>
          <span>P9-019 Review</span>
        </div>

        <header className="professional-review-header">
          <div>
            <p className="eyebrow">Blueprint OS · Storey 20</p>
            <h1>Human Professional Review</h1>
            <p className="lede">
              Review exact Release Gate evidence and the tracked UX findings
              before deciding whether P9-020 may begin.
            </p>
          </div>
          <div className="professional-review-statuses">
            <StatusChip tone={existingDecision?.humanSignoff ? "success" : "warning"}>
              {existingDecision?.humanSignoff
                ? "Human sign-off recorded"
                : "Human sign-off required"}
            </StatusChip>
            <StatusChip tone="warning">Production not authorized</StatusChip>
          </div>
        </header>

        <section className="professional-review-evidence">
          <div>
            <span>Reviewed revision</span>
            <code>{candidate.reviewedRevision}</code>
          </div>
          <div>
            <span>Release Gate run</span>
            <strong>{candidate.evidenceArtifact.workflowRunId}</strong>
          </div>
          <div>
            <span>Screenshot artifact</span>
            <strong>{candidate.evidenceArtifact.artifactId}</strong>
          </div>
          <div>
            <span>Evidence digest</span>
            <code>{candidate.evidenceArtifact.digest}</code>
          </div>
          <div className="professional-review-evidence-actions">
            <a
              className="secondary-button"
              href={releaseGateUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open Release Gate run
            </a>
            <a
              className="secondary-button"
              href={artifactUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open screenshot artifact
            </a>
          </div>
        </section>

        <section
          className="professional-review-scope"
          aria-labelledby="professional-review-scope-title"
        >
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Reviewed scope</p>
              <h2 id="professional-review-scope-title">
                What the evidence actually covers
              </h2>
              <p>
                Use this scope together with the exact run and screenshots
                before recording a human decision.
              </p>
            </div>
          </div>

          <div className="professional-review-scope-grid">
            <div>
              <strong>Viewports</strong>
              <ul>
                {candidate.reviewedViewports.map((viewport) => (
                  <li key={viewport}>{viewport}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Product surfaces</strong>
              <ul>
                {candidate.reviewedSurfaces.map((surface) => (
                  <li key={surface}>{surface}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="professional-review-findings" aria-labelledby="professional-review-findings-title">
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Tracked findings</p>
              <h2 id="professional-review-findings-title">
                No open P0/P1/P2 finding is recorded
              </h2>
              <p>
                The two prior P2 UX observations were remediated before this
                refreshed review candidate. Human sign-off is still required
                against the exact evidence above.
              </p>
            </div>
            <StatusChip tone="success">No open findings</StatusChip>
          </div>

          {candidate.findings.length ? (
            <div className="professional-review-finding-list">
              {candidate.findings.map((finding) => (
                <article key={finding.id}>
                  <div>
                    <StatusChip tone="info">{finding.severity}</StatusChip>
                    <span>{finding.surface}</span>
                  </div>
                  <h3>{finding.id}</h3>
                  <p>{finding.observation}</p>
                  <small>{finding.followUp}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="workspace-empty-inline professional-review-no-findings">
              No tracked finding remains open in this candidate.
            </div>
          )}
        </section>

        <ProfessionalReviewDecisionPanel
          candidate={candidate}
          existingDecision={existingDecision}
        />

        <section className="professional-review-boundary-card">
          <p className="section-kicker">Authority boundary</p>
          <h2>Review is not release authority.</h2>
          <p>{candidate.boundaryNote}</p>
          <p>
            P9-020 and Production remain separate gates even after an approval.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
