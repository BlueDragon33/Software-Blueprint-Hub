import { AppShell, StatusChip } from "@blueprint-os/ui";
import Link from "next/link";

import { evaluateOwnerBootstrapAuthorization } from "../../../src/auth/owner-bootstrap-policy";
import {
  resolveWebActor,
  resolveWebIdentity
} from "../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../src/server/runtime";
import { OwnerBootstrapPanel } from "./owner-bootstrap-panel";

export const dynamic = "force-dynamic";

export default async function OwnerSetupPage() {
  const identity = await resolveWebIdentity();

  if (!identity) {
    return (
      <AppShell>
        <main className="professional-review-page">
          <Link className="text-link" href="/professional-review">
            ← P9-019 professional review
          </Link>
          <section className="professional-review-state">
            <p className="section-kicker">Blueprint OS authority setup</p>
            <h1>Sign in before initializing the System Owner.</h1>
            <p>
              Identity comes from Auth.js. Blueprint OS stores authority
              separately and never infers Owner status from OAuth claims.
            </p>
            <div className="professional-review-actions">
              <a className="primary-button" href="/api/auth/signin">
                Sign in
              </a>
              <Link className="secondary-button" href="/professional-review/readiness">
                Check runtime readiness
              </Link>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }

  const actor = await resolveWebActor();
  const isOwner =
    actor !== null &&
    (await getBlueprintServerRuntime().authority.canExerciseConstitutionalAuthority(
      actor
    ));
  const bootstrapAuthorization =
    evaluateOwnerBootstrapAuthorization(identity);

  return (
    <AppShell>
      <main className="professional-review-page">
        <div className="professional-review-breadcrumbs">
          <Link className="text-link" href="/professional-review">
            P9-019 Review
          </Link>
          <span aria-hidden="true">/</span>
          <span>Owner Setup</span>
        </div>

        <header className="professional-review-header">
          <div>
            <p className="eyebrow">ADR-0003 · Authentication & authority</p>
            <h1>System Owner Setup</h1>
            <p className="lede">
              Complete the explicit one-time authority bootstrap required
              before a real account can exercise protected review actions.
            </p>
          </div>
          <div className="professional-review-statuses">
            <StatusChip tone={isOwner ? "success" : "warning"}>
              {isOwner ? "System Owner active" : "Owner setup required or unavailable"}
            </StatusChip>
            <StatusChip tone="warning">Production not authorized</StatusChip>
          </div>
        </header>

        {isOwner ? (
          <section className="professional-review-decision professional-review-decision-recorded">
            <div>
              <p className="section-kicker">Authority ready</p>
              <h2>This authenticated account is the System Owner.</h2>
              <p>
                PROJECT_REVIEW authority is available through the canonical
                authority service. P9-019 still requires an explicit review
                decision against the exact current candidate.
              </p>
            </div>
            <Link className="primary-button" href="/professional-review">
              Open P9-019 professional review
            </Link>
            <p className="professional-review-boundary">
              System Owner status does not authorize Production deployment.
            </p>
          </section>
        ) : !bootstrapAuthorization.configured ? (
          <section
            className="professional-review-decision"
            aria-labelledby="owner-bootstrap-disabled-title"
          >
            <div>
              <p className="section-kicker">Fail-closed configuration</p>
              <h2 id="owner-bootstrap-disabled-title">
                Owner bootstrap identity is not configured.
              </h2>
              <p>
                Configure BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER and
                BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT in the server environment
                before exposing this setup path.
              </p>
            </div>
            <div className="professional-review-actions">
              <Link className="secondary-button" href="/professional-review/readiness">
                Check runtime readiness
              </Link>
            </div>
            <p className="professional-review-boundary">
              No authenticated account can claim System Owner while bootstrap
              identity configuration is absent.
            </p>
          </section>
        ) : !bootstrapAuthorization.allowed ? (
          <section
            className="professional-review-decision"
            aria-labelledby="owner-bootstrap-denied-title"
          >
            <div>
              <p className="section-kicker">Bootstrap identity protected</p>
              <h2 id="owner-bootstrap-denied-title">
                This account is not authorized to initialize System Owner.
              </h2>
              <p>
                Sign in with the deployment-configured bootstrap identity. OAuth
                claims do not create Blueprint OS authority by themselves.
              </p>
            </div>
            <div className="professional-review-actions">
              <Link className="secondary-button" href="/professional-review/readiness">
                Check runtime readiness
              </Link>
            </div>
            <p className="professional-review-boundary">
              The setup route grants no authority to unconfigured identities.
            </p>
          </section>
        ) : (
          <OwnerBootstrapPanel />
        )}
      </main>
    </AppShell>
  );
}
