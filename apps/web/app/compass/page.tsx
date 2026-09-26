import Link from "next/link";

import { ActionGroup, AppShell } from "@blueprint-os/ui";
import { SystemCompass } from "../_components/system-compass";
import { CompassArchitectureMap } from "../_components/compass-architecture-map";

export const dynamic = "force-static";

export default function CompassPage() {
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
        <SystemCompass />
        <CompassArchitectureMap />
      </main>
    </AppShell>
  );
}
