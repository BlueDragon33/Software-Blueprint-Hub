import Link from "next/link";

import { ActionGroup, AppShell, EmptyState, StatusChip } from "@blueprint-os/ui";

import { resolveWebActor } from "../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../src/server/runtime";
import { RetryCurrentView } from "./_components/retry-current-view";
import { SystemCompass } from "./_components/system-compass";

export const dynamic = "force-dynamic";

function SignedOutRegistry() {
  return (
    <AppShell>
      <main className="registry-shell">
        <header className="registry-header">
          <div>
            <p className="eyebrow">Blueprint OS</p>
            <h1>Projects</h1>
            <p className="lede">
              Your engineering control center starts with the projects you are
              actually authorized to read.
            </p>
          </div>
          <Link className="environment-badge" href="/compass">Phase 9 · Compass</Link>
        </header>

        <section className="registry-state" aria-labelledby="sign-in-title">
          <span className="registry-state-icon" aria-hidden="true">◇</span>
          <div>
            <h2 id="sign-in-title">Sign in to open your project registry.</h2>
            <p>
              Blueprint OS does not expose canonical project names or metadata
              before trusted identity is established.
            </p>
          </div>
          <a className="primary-button registry-action" href="/api/auth/signin">
            Sign in
          </a>
        </section>

        <section className="registry-secondary">
          <strong>Need reusable engineering guidance?</strong>
          <span>
            The Knowledge Library is read-only reusable knowledge, separate from project truth.
          </span>
          <Link className="secondary-button registry-action" href="/knowledge">
            Open Knowledge Library
          </Link>
        </section>

        <section className="registry-secondary">
          <strong>Need to explore the workflow first?</strong>
          <span>
            Preview mode remains read-only and cannot create project truth.
          </span>
          <Link className="secondary-button registry-action" href="/projects/new">
            Open guided preview
          </Link>
        </section>
      </main>
    </AppShell>
  );
}

export default async function HomePage() {
  const actor = await resolveWebActor();

  if (!actor) {
    return <SignedOutRegistry />;
  }

  let items;
  try {
    items = await getBlueprintServerRuntime().registry.list(actor);
  } catch {
    return (
      <AppShell>
        <main className="registry-shell">
          <header className="registry-header">
            <div>
              <p className="eyebrow">Blueprint OS</p>
              <h1>Projects</h1>
            </div>
            <span className="environment-badge">Canonical</span>
          </header>
          <section
            className="registry-state registry-state-error runtime-recovery-state"
            role="alert"
            aria-labelledby="registry-runtime-title"
          >
            <span className="registry-state-icon" aria-hidden="true">!</span>
            <div>
              <p className="section-kicker">Canonical runtime unavailable</p>
              <h2 id="registry-runtime-title">
                Project registry is temporarily unavailable.
              </h2>
              <p>
                Your account remains signed in. No project data was exposed or
                replaced by preview or cached state.
              </p>
            </div>
            <RetryCurrentView label="Retry project registry" />
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="registry-shell">
        <header className="registry-header">
          <div>
            <p className="eyebrow">Engineering Control Center</p>
            <h1>Projects</h1>
            <p className="lede">
              Open canonical engineering state, or start a new project through
              the guided Blueprint flow.
            </p>
          </div>
          <ActionGroup className="registry-header-actions">
            <span className="environment-badge">Canonical</span>
            <Link className="secondary-button registry-action" href="/compass">
              System Compass
            </Link>
            <Link className="secondary-button registry-action" href="/portfolio">
              Portfolio
            </Link>
            <Link className="secondary-button registry-action" href="/knowledge">
              Knowledge Library
            </Link>
            <Link className="primary-button registry-action" href="/projects/new">
              New project
            </Link>
          </ActionGroup>
        </header>

        <SystemCompass compact />

        {items.length === 0 ? (
          <EmptyState
            className="registry-state"
            icon="＋"
            title="No readable projects yet."
            description="Create the first canonical project, or ask a project Owner to grant your account a role."
            action={
              <Link className="primary-button registry-action" href="/projects/new">
                Create project
              </Link>
            }
          />
        ) : (
          <section aria-labelledby="project-list-title">
            <div className="registry-section-heading">
              <div>
                <p className="section-kicker">Canonical registry</p>
                <h2 id="project-list-title">
                  {items.length} {items.length === 1 ? "project" : "projects"}
                </h2>
              </div>
              <StatusChip>Authority filtered</StatusChip>
            </div>

            <div className="project-grid">
              {items.map((item) => (
                <Link
                  className="project-card"
                  href={"/projects/" + encodeURIComponent(item.projectId)}
                  key={item.projectId}
                >
                  <div className="project-card-topline">
                    <span className="project-level">{item.blueprintLevel}</span>
                    <StatusChip>
                      {item.access === "SYSTEM_OWNER" ? "System Owner" : item.access}
                    </StatusChip>
                  </div>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.projectType}</p>
                  </div>
                  <dl className="project-meta">
                    <div>
                      <dt>Record</dt>
                      <dd>v{item.recordVersion}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{new Date(item.updatedAt).toLocaleDateString("en-GB")}</dd>
                    </div>
                  </dl>
                  <span className="project-open">
                    Open canonical workspace <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
