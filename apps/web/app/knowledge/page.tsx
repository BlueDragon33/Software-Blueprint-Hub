import Link from "next/link";

import { AppShell, EmptyState, SectionHeading, StatusChip } from "@blueprint-os/ui";

import { getBlueprintServerRuntime } from "../../src/server/runtime";
import { RetryCurrentView } from "../_components/retry-current-view";

export const dynamic = "force-dynamic";

function kindLabel(kind: string): string {
  return kind.replaceAll("-", " ");
}

export default function KnowledgeLibraryPage() {
  let sections;

  try {
    sections = getBlueprintServerRuntime().knowledge.list();
  } catch {
    return (
      <AppShell>
        <main className="knowledge-shell">
          <div className="knowledge-breadcrumbs">
            <Link className="text-link" href="/">Projects</Link>
            <span aria-hidden="true">/</span>
            <span>Knowledge Library</span>
          </div>

          <section
            className="registry-state registry-state-error runtime-recovery-state"
            role="alert"
            aria-labelledby="knowledge-runtime-title"
          >
            <span className="registry-state-icon" aria-hidden="true">!</span>
            <div>
              <p className="section-kicker">Canonical runtime unavailable</p>
              <h1 id="knowledge-runtime-title">
                Knowledge Library could not be loaded.
              </h1>
              <p>
                Reusable definitions were not replaced by cached or project
                state. Retry the same canonical read.
              </p>
            </div>
            <RetryCurrentView label="Retry Knowledge Library" />
          </section>
        </main>
      </AppShell>
    );
  }

  const populated = sections.reduce(
    (total, section) => total + section.items.length,
    0
  );

  return (
    <AppShell>
      <main className="knowledge-shell">
        <div className="knowledge-breadcrumbs">
          <Link className="text-link" href="/">Projects</Link>
          <span aria-hidden="true">/</span>
          <span>Knowledge Library</span>
        </div>

        <header className="knowledge-header">
          <div>
            <p className="eyebrow">Reusable engineering knowledge</p>
            <h1>Knowledge Library</h1>
            <p className="lede">
              Version-controlled constitutions, templates and reference
              contracts. Reusable definitions are never project completion
              state.
            </p>
          </div>
          <div className="knowledge-header-meta">
            <StatusChip>Read-only catalog</StatusChip>
            <strong>{populated} published items</strong>
          </div>
        </header>

        <section className="knowledge-principle" aria-label="Knowledge authority rule">
          <div>
            <p className="section-kicker">Authority rule</p>
            <h2>Definitions guide projects; they do not claim projects are done.</h2>
          </div>
          <p>
            Constitution and template entries are reusable inputs to Blueprint
            resolution. They carry source/version provenance only—not readiness,
            Quality Gate PASS, or project completion status.
          </p>
        </section>

        <nav className="knowledge-section-nav" aria-label="Knowledge categories">
          {sections.map((section) => (
            <a href={"#" + section.kind} key={section.kind}>
              <strong>{section.label}</strong>
              <span>{section.items.length}</span>
            </a>
          ))}
        </nav>

        <div className="knowledge-sections">
          {sections.map((section) => (
            <section
              className="knowledge-section"
              id={section.kind}
              key={section.kind}
              aria-labelledby={section.kind + "-heading"}
            >
              <SectionHeading
                className="knowledge-section-heading"
                kicker={kindLabel(section.kind)}
                title={section.label}
                titleId={section.kind + "-heading"}
                description={section.description}
                aside={<StatusChip>{section.items.length} published</StatusChip>}
              />

              {section.items.length === 0 ? (
                <EmptyState
                  className="knowledge-empty"
                  title={<>No canonical {section.label} published yet.</>}
                  description="Blueprint OS leaves this category empty instead of manufacturing reusable knowledge that has not been reviewed."
                />
              ) : (
                <div className="knowledge-grid">
                  {section.items.map((item) => (
                    <article className="knowledge-card" key={item.id}>
                      <div className="knowledge-card-heading">
                        <div>
                          <span className="knowledge-kind">
                            {kindLabel(item.kind)}
                          </span>
                          <h3>{item.title}</h3>
                        </div>
                        <StatusChip>v{item.version}</StatusChip>
                      </div>

                      <p>{item.summary}</p>

                      <details className="canonical-disclosure knowledge-disclosure">
                        <summary>
                          Provenance & tags
                          <span>{item.authorityLayer ?? "reference"}</span>
                        </summary>

                        <div className="canonical-disclosure-body">
                          <dl className="knowledge-meta">
                            <div>
                              <dt>Status</dt>
                              <dd>{item.status.replaceAll("-", " ")}</dd>
                            </div>
                            <div>
                              <dt>Authority</dt>
                              <dd>{item.authorityLayer ?? "reference"}</dd>
                            </div>
                            <div className="knowledge-meta-span">
                              <dt>Source</dt>
                              <dd>{item.sourcePath}</dd>
                            </div>
                          </dl>

                          <div className="knowledge-tags">
                            {item.tags.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </details>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <footer className="knowledge-footer">
          <Link className="secondary-button registry-action" href="/">
            Back to projects
          </Link>
          <Link className="primary-button registry-action" href="/projects/new">
            Use knowledge in guided setup
          </Link>
        </footer>
      </main>
    </AppShell>
  );
}
