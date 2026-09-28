import { AppShell, StatusChip } from "@blueprint-os/ui";
import Link from "next/link";

import { getHumanReviewRuntimeReadiness } from "../../../src/server/human-review-readiness";

export const dynamic = "force-dynamic";

export default async function ProfessionalReviewReadinessPage() {
  const readiness = await getHumanReviewRuntimeReadiness();

  return (
    <AppShell>
      <main className="professional-review-page">
        <div className="professional-review-breadcrumbs">
          <Link className="text-link" href="/professional-review">
            P9-019 Review
          </Link>
          <span aria-hidden="true">/</span>
          <span>Runtime readiness</span>
        </div>

        <header className="professional-review-header">
          <div>
            <p className="eyebrow">P9-019 · Human review runtime</p>
            <h1>Review Runtime Readiness</h1>
            <p className="lede">
              Verify the minimum authenticated and persistent runtime required
              for a real human decision before entering the review flow.
            </p>
          </div>
          <div className="professional-review-statuses">
            <StatusChip tone={readiness.ready ? "success" : "warning"}>
              {readiness.ready ? "Preflight ready" : "Preflight blocked"}
            </StatusChip>
            <StatusChip tone="warning">Production not authorized</StatusChip>
          </div>
        </header>

        <section className="professional-review-findings">
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Safe diagnostics</p>
              <h2>
                {readiness.ready
                  ? "P9-019 runtime prerequisites are present."
                  : "One or more P9-019 runtime prerequisites are missing."}
              </h2>
              <p>
                This page reports presence/connectivity only. Secret values,
                OAuth credentials and database connection strings are never
                rendered.
              </p>
            </div>
          </div>

          <div className="professional-review-finding-list">
            {readiness.checks.map((item) => (
              <article key={item.id}>
                <div>
                  <StatusChip
                    tone={
                      item.state === "ready"
                        ? "success"
                        : item.state === "warning"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {item.state === "ready"
                      ? "Ready"
                      : item.state === "warning"
                        ? "Review"
                        : "Blocked"}
                  </StatusChip>
                </div>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="professional-review-boundary-card">
          <p className="section-kicker">Next action</p>
          <h2>
            {readiness.ready
              ? "Continue to System Owner setup."
              : "Complete the blocked runtime prerequisites first."}
          </h2>
          <p>
            Readiness does not create authority, approve P9-019, unlock P9-020,
            or authorize Production.
          </p>
          <div className="professional-review-actions">
            {readiness.ready ? (
              <Link className="primary-button" href="/setup/owner">
                Open System Owner setup
              </Link>
            ) : (
              <a
                className="secondary-button"
                href="https://github.com/BlueDragon33/Software-Blueprint-Hub/blob/main/docs/P9-019-HUMAN-REVIEW-RUNBOOK.md"
                target="_blank"
                rel="noreferrer"
              >
                Follow the P9-019 runbook
              </a>
            )}
            <Link className="secondary-button" href="/professional-review">
              Back to P9-019 review
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
