import { AppShell, StatusChip } from "@blueprint-os/ui";
import Link from "next/link";

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
            <a className="primary-button" href="/api/auth/signin">
              Sign in
            </a>
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
        ) : (
          <OwnerBootstrapPanel />
        )}
      </main>
    </AppShell>
  );
}
