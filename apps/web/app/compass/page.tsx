import { AppShell } from "@blueprint-os/ui";
import { SystemCompass } from "../_components/system-compass";

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
          <span className="environment-badge">Development baseline</span>
        </header>
        <SystemCompass />
      </main>
    </AppShell>
  );
}
