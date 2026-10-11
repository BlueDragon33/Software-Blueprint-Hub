import Link from "next/link";

import { ActionGroup, AppShell } from "@blueprint-os/ui";
import { CompassArchitectureMap } from "../_components/compass-architecture-map";
import { SystemCompass } from "../_components/system-compass";
import { loadCompassProjection } from "../../src/server/compass-projection";

export const dynamic = "force-dynamic";

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
