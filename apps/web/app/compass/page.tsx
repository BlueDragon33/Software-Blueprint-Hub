import Link from "next/link";

import {
  getBlueprintCompassProjection,
  p9019ProfessionalReviewCandidate
} from "@blueprint-os/application";
import { ActionGroup, AppShell } from "@blueprint-os/ui";
import { CompassArchitectureMap } from "../_components/compass-architecture-map";
import { SystemCompass } from "../_components/system-compass";
import { resolveWebActor } from "../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../src/server/runtime";

export const dynamic = "force-dynamic";

async function loadCompassProjection() {
  const actor = await resolveWebActor();
  if (!actor) {
    return getBlueprintCompassProjection();
  }

  const runtime = getBlueprintServerRuntime();
  const canReview = await runtime.authority.can(
    actor,
    p9019ProfessionalReviewCandidate.projectId,
    "PROJECT_REVIEW"
  );
  if (!canReview) {
    return getBlueprintCompassProjection();
  }

  const decision = await runtime.professionalReview.currentDecision(actor);
  return getBlueprintCompassProjection(decision);
}

export default async function CompassPage() {
  const projection = await loadCompassProjection();

  return (
    <AppShell>
      <main className="registry-shell compass-page">
        <header className="registry-header">
          <div>
            <p className="eyebrow">Blueprint OS</p>
            <h1>System Compass</h1>
            <p className="lede">
              A truthful orientation surface for the dependency-driven 20-storey construction plan.
            </p>
          </div>
          <ActionGroup className="registry-header-actions">
            <span className="environment-badge">Development baseline</span>
            <Link className="secondary-button registry-action" href="/diagnostics">
              Incident diagnostics
            </Link>
          </ActionGroup>
        </header>
        <SystemCompass projection={projection} />
        <CompassArchitectureMap projection={projection} />
      </main>
    </AppShell>
  );
}
