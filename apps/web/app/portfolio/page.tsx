import Link from "next/link";

import { buildProjectPortfolioProjection } from "@blueprint-os/application";
import { ActionGroup, AppShell, EmptyState, StatusChip } from "@blueprint-os/ui";

import { resolveWebActor } from "../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../src/server/runtime";
import { RetryCurrentView } from "../_components/retry-current-view";

export const dynamic = "force-dynamic";

function Distribution({
  title,
  items
}: {
  readonly title: string;
  readonly items: readonly { readonly key: string; readonly count: number }[];
}) {
  return (
    <section className="portfolio-distribution" aria-label={title}>
      <p className="section-kicker">{title}</p>
      <div className="portfolio-distribution-list">
        {items.map((item) => (
          <div key={item.key}>
            <span>{item.key}</span>
            <strong>{item.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function SignedOutPortfolio() {
  return (
    <AppShell>
      <main className="registry-shell portfolio-page">
        <header className="registry-header">
          <div>
            <p className="eyebrow">Ecosystem Portfolio</p>
            <h1>Portfolio</h1>
            <p className="lede">
              Cross-project visibility begins only after trusted identity is established.
            </p>
          </div>
          <Link className="secondary-button registry-action" href="/">
            Projects
          </Link>
        </header>

        <section className="registry-state" aria-labelledby="portfolio-sign-in-title">
          <span className="registry-state-icon" aria-hidden="true">◇</span>
          <div>
            <h2 id="portfolio-sign-in-title">Sign in to open your authority-filtered portfolio.</h2>
            <p>
              Blueprint OS does not expose canonical project names, roles or portfolio metadata before authentication.
            </p>
          </div>
          <a className="primary-button registry-action" href="/api/auth/signin">
            Sign in
          </a>
        </section>
      </main>
    </AppShell>
  );
}

export default async function PortfolioPage() {
  const actor = await resolveWebActor();
  if (!actor) return <SignedOutPortfolio />;

  let projection;
  try {
    const items = await getBlueprintServerRuntime().registry.list(actor);
    projection = buildProjectPortfolioProjection(items);
  } catch {
    return (
      <AppShell>
        <main className="registry-shell portfolio-page">
          <header className="registry-header">
            <div>
              <p className="eyebrow">Ecosystem Portfolio</p>
              <h1>Portfolio</h1>
            </div>
            <span className="environment-badge">Authority filtered</span>
          </header>
          <section
            className="registry-state registry-state-error runtime-recovery-state"
            role="alert"
            aria-labelledby="portfolio-runtime-title"
          >
            <span className="registry-state-icon" aria-hidden="true">!</span>
            <div>
              <p className="section-kicker">Portfolio unavailable</p>
              <h2 id="portfolio-runtime-title">Authority-filtered registry could not be projected.</h2>
              <p>No project data was replaced by cached, preview or cross-project state.</p>
            </div>
            <RetryCurrentView label="Retry portfolio" />
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="registry-shell portfolio-page">
        <header className="registry-header">
          <div>
            <p className="eyebrow">Ecosystem Portfolio</p>
            <h1>Portfolio</h1>
            <p className="lede">
              One read-only view across projects you are already authorized to read,
              without merging readiness, Quality Gates, business data or release authority.
            </p>
          </div>
          <ActionGroup className="registry-header-actions">
            <StatusChip>Authority filtered</StatusChip>
            <Link className="secondary-button registry-action" href="/">
              Projects
            </Link>
            <Link className="secondary-button registry-action" href="/compass">
              System Compass
            </Link>
          </ActionGroup>
        </header>

        <section className="portfolio-boundary" aria-label="Portfolio authority boundary">
          <div>
            <p className="section-kicker">Projection boundary</p>
            <strong>Orientation only — every project keeps its own authority.</strong>
          </div>
          <p>{projection.boundaryNote}</p>
        </section>

        <section className="portfolio-metrics" aria-label="Portfolio summary">
          <article>
            <span>Readable projects</span>
            <strong>{projection.totalReadableProjects}</strong>
          </article>
          <article>
            <span>Blueprint levels</span>
            <strong>{projection.byBlueprintLevel.length}</strong>
          </article>
          <article>
            <span>Project types</span>
            <strong>{projection.byProjectType.length}</strong>
          </article>
          <article>
            <span>Latest registry update</span>
            <strong>
              {projection.latestRegistryUpdate
                ? new Date(projection.latestRegistryUpdate).toLocaleDateString("en-GB")
                : "—"}
            </strong>
          </article>
        </section>

        {projection.totalReadableProjects === 0 ? (
          <EmptyState
            className="registry-state"
            icon="＋"
            title="No readable projects yet."
            description="The Portfolio stays empty until the canonical Project Registry grants this actor readable project scope."
            action={
              <Link className="primary-button registry-action" href="/projects/new">
                Create project
              </Link>
            }
          />
        ) : (
          <>
            <section className="portfolio-distributions" aria-label="Portfolio distributions">
              <Distribution title="Blueprint depth" items={projection.byBlueprintLevel} />
              <Distribution title="Project types" items={projection.byProjectType} />
              <Distribution title="Access boundary" items={projection.byAccess} />
            </section>

            <section aria-labelledby="portfolio-projects-title">
              <div className="registry-section-heading">
                <div>
                  <p className="section-kicker">Readable registry</p>
                  <h2 id="portfolio-projects-title">Project isolation map</h2>
                </div>
                <StatusChip>No combined readiness</StatusChip>
              </div>

              <div className="portfolio-project-list">
                {projection.projects.map((project) => (
                  <Link
                    className="portfolio-project-row"
                    href={"/projects/" + encodeURIComponent(project.projectId)}
                    key={project.projectId}
                  >
                    <div className="portfolio-project-primary">
                      <span className="project-level">{project.blueprintLevel}</span>
                      <div>
                        <strong>{project.name}</strong>
                        <small>{project.projectType}</small>
                      </div>
                    </div>
                    <dl>
                      <div>
                        <dt>Access</dt>
                        <dd>{project.access === "SYSTEM_OWNER" ? "System Owner" : project.access}</dd>
                      </div>
                      <div>
                        <dt>Record</dt>
                        <dd>v{project.recordVersion}</dd>
                      </div>
                      <div>
                        <dt>Updated</dt>
                        <dd>{new Date(project.updatedAt).toLocaleDateString("en-GB")}</dd>
                      </div>
                    </dl>
                    <span className="project-open">Open canonical workspace →</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}
