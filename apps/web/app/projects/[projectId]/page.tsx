import Link from "next/link";

import { AppShell } from "@blueprint-os/ui";

import { resolveWebActor } from "../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../src/server/runtime";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  readonly params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId: encodedProjectId } = await params;
  const projectId = decodeURIComponent(encodedProjectId);
  const actor = await resolveWebActor();

  if (!actor) {
    return (
      <AppShell>
        <main className="registry-shell">
          <Link className="text-link" href="/">← Projects</Link>
          <section className="registry-state">
            <div>
              <h1>Sign in to open this canonical project.</h1>
              <p>Project metadata is protected by Blueprint-owned authority.</p>
            </div>
            <a className="primary-button registry-action" href="/api/auth/signin">
              Sign in
            </a>
          </section>
        </main>
      </AppShell>
    );
  }

  try {
    const result = await getBlueprintServerRuntime().profiles.read(actor, projectId);

    if (!result) {
      return (
        <AppShell>
          <main className="registry-shell">
            <Link className="text-link" href="/">← Projects</Link>
            <section className="registry-state">
              <div>
                <h1>Project not found.</h1>
                <p>No canonical Project Profile exists for this identifier.</p>
              </div>
            </section>
          </main>
        </AppShell>
      );
    }

    return (
      <AppShell>
        <main className="registry-shell">
          <div className="project-breadcrumbs">
            <Link className="text-link" href="/">Projects</Link>
            <span aria-hidden="true">/</span>
            <span>{result.profile.name}</span>
          </div>

          <header className="project-overview-header">
            <div>
              <p className="eyebrow">Canonical project</p>
              <h1>{result.profile.name}</h1>
              <p className="lede">
                {result.profile.projectType} · {result.profile.projectId}
              </p>
            </div>
            <span className="project-level project-level-large">
              {result.profile.blueprintLevel}
            </span>
          </header>

          <section className="summary-grid" aria-label="Project blueprint summary">
            <article className="metric-card">
              <span>Profile version</span>
              <strong>{result.profile.meta.recordVersion}</strong>
              <small>{result.profile.meta.updatedAt}</small>
            </article>
            <article className="metric-card">
              <span>Required modules</span>
              <strong>{result.blueprint.requiredModules.length}</strong>
              <small>Resolved from exact templates</small>
            </article>
            <article className="metric-card">
              <span>Quality gates</span>
              <strong>{result.blueprint.requiredGates.length}</strong>
              <small>Evidence required before PASS</small>
            </article>
          </section>

          <section className="canonical-summary">
            <div className="registry-section-heading">
              <div>
                <p className="section-kicker">Resolved blueprint</p>
                <h2>Engineering requirements</h2>
              </div>
              <span className="status-chip status-chip-success">
                Canonical
              </span>
            </div>
            <div className="requirement-list">
              {result.blueprint.requiredModules.slice(0, 12).map((id) => (
                <div className="requirement-row" key={id}>
                  <div>
                    <strong>{id.split(":").slice(1).join(" · ").replaceAll("-", " ")}</strong>
                    <span>{id}</span>
                  </div>
                  <span className="status-chip status-chip-neutral">Required</span>
                </div>
              ))}
            </div>
          </section>

          <div className="project-page-actions">
            <Link className="secondary-button registry-action" href="/">
              Back to projects
            </Link>
            <Link className="primary-button registry-action" href="/projects/new">
              Start another project
            </Link>
          </div>
        </main>
      </AppShell>
    );
  } catch {
    return (
      <AppShell>
        <main className="registry-shell">
          <Link className="text-link" href="/">← Projects</Link>
          <section className="registry-state registry-state-error" role="alert">
            <div>
              <h1>Project cannot be opened.</h1>
              <p>
                The project may be outside your authority scope or the trusted
                runtime may be unavailable.
              </p>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }
}
