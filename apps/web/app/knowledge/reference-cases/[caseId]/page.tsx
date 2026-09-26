import Link from "next/link";
import { notFound } from "next/navigation";

import type { KnowledgeLibraryItem } from "@blueprint-os/application";
import { AppShell, StatusChip } from "@blueprint-os/ui";

import { findReferenceCaseProjection } from "../../../../src/knowledge/reference-case-projections";
import { getBlueprintServerRuntime } from "../../../../src/server/runtime";
import { RetryCurrentView } from "../../../_components/retry-current-view";

export const dynamic = "force-dynamic";

interface ReferenceCasePageProps {
  readonly params: Promise<{ caseId: string }>;
}

export default async function ReferenceCasePage({
  params
}: ReferenceCasePageProps) {
  const { caseId } = await params;
  const projection = findReferenceCaseProjection(caseId);

  if (!projection) {
    notFound();
  }

  let item: KnowledgeLibraryItem | null;

  try {
    item = getBlueprintServerRuntime().knowledge.find(
      `knowledge:reference-case:${caseId}`
    );
  } catch {
    return (
      <AppShell>
        <main className="knowledge-shell reference-case-shell">
          <div className="knowledge-breadcrumbs">
            <Link className="text-link" href="/">
              Projects
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="text-link" href="/knowledge">
              Knowledge Library
            </Link>
            <span aria-hidden="true">/</span>
            <span>Reference Case</span>
          </div>

          <section
            className="registry-state registry-state-error runtime-recovery-state"
            role="alert"
            aria-labelledby="reference-case-runtime-title"
          >
            <span className="registry-state-icon" aria-hidden="true">
              !
            </span>
            <div>
              <p className="section-kicker">Reference runtime unavailable</p>
              <h1 id="reference-case-runtime-title">
                Reference Case could not be loaded.
              </h1>
              <p>
                The view was not replaced with project state or cached completion
                data. Retry the same read-only Knowledge source.
              </p>
            </div>
            <RetryCurrentView label="Retry Reference Case" />
          </section>
        </main>
      </AppShell>
    );
  }

  if (!item || item.kind !== "reference-case") {
    notFound();
  }

  return (
    <AppShell>
      <main className="knowledge-shell reference-case-shell">
        <nav className="knowledge-breadcrumbs" aria-label="Breadcrumb">
          <Link className="text-link" href="/">
            Projects
          </Link>
          <span aria-hidden="true">/</span>
          <Link className="text-link" href="/knowledge">
            Knowledge Library
          </Link>
          <span aria-hidden="true">/</span>
          <span>{item.title}</span>
        </nav>

        <header className="reference-case-hero">
          <div>
            <p className="eyebrow">Reference Case · frozen source snapshot</p>
            <h1>{item.title}</h1>
            <p className="lede">{item.summary}</p>
          </div>
          <div className="reference-case-hero-meta" aria-label="Reference identity">
            <StatusChip tone="info">Reference only</StatusChip>
            <span>v{item.version}</span>
          </div>
        </header>

        <section
          className="reference-case-authority"
          aria-labelledby="reference-authority-title"
        >
          <div>
            <p className="section-kicker">Authority boundary</p>
            <h2 id="reference-authority-title">
              Source evidence first. No project-state claims.
            </h2>
          </div>
          <p>{projection.authorityNote}</p>
        </section>

        <section
          className="reference-case-section reference-case-provenance"
          aria-labelledby="reference-provenance-title"
        >
          <div className="reference-case-section-heading">
            <div>
              <p className="section-kicker">Visible provenance</p>
              <h2 id="reference-provenance-title">Exact imported source</h2>
            </div>
            <StatusChip>Frozen snapshot</StatusChip>
          </div>

          <dl className="reference-case-provenance-grid">
            <div className="reference-case-provenance-wide">
              <dt>Source repository</dt>
              <dd>{projection.source.repository}</dd>
            </div>
            <div>
              <dt>Architecture branch</dt>
              <dd>{projection.source.branch}</dd>
            </div>
            <div>
              <dt>Source pull request</dt>
              <dd>{projection.source.pullRequest}</dd>
            </div>
            <div className="reference-case-provenance-wide">
              <dt>Imported architecture revision</dt>
              <dd>{projection.source.importedRevision}</dd>
            </div>
            <div className="reference-case-provenance-wide">
              <dt>Dossier manifest baseline</dt>
              <dd>{projection.source.manifestRevision}</dd>
            </div>
            <div>
              <dt>Imported at</dt>
              <dd>{projection.source.importedAt}</dd>
            </div>
            <div>
              <dt>Classified source artifacts</dt>
              <dd>{projection.source.artifactCount}</dd>
            </div>
            <div>
              <dt>Semantic mappings</dt>
              <dd>{projection.source.conceptMappingCount}</dd>
            </div>
            <div className="reference-case-provenance-wide">
              <dt>Machine-readable import manifest</dt>
              <dd>{projection.source.manifestPath}</dd>
            </div>
            <div className="reference-case-provenance-wide">
              <dt>Local reference document</dt>
              <dd>{item.sourcePath}</dd>
            </div>
          </dl>

          <p className="reference-case-snapshot-note">{projection.snapshotNote}</p>
        </section>

        <section
          className="reference-case-section"
          aria-labelledby="reference-summary-title"
        >
          <div className="reference-case-section-heading">
            <div>
              <p className="section-kicker">P8 mapping summary</p>
              <h2 id="reference-summary-title">
                Keep universal engineering laws separate from Bauman domain truth.
              </h2>
            </div>
          </div>

          <div className="reference-case-classification-grid">
            <article>
              <span>Already supported</span>
              <strong>Existing Blueprint concepts</strong>
              <p>
                Identity, versioning, authority, migration and release discipline
                already fit the universal engineering model.
              </p>
            </article>
            <article>
              <span>Pattern candidates</span>
              <strong>Reusable, but not Core</strong>
              <p>
                Registry, Strangler migration, extension sandbox and projection
                patterns need review before publication.
              </p>
            </article>
            <article>
              <span>Project-specific</span>
              <strong>Stay inside Bauman</strong>
              <p>
                Learning, mastery, runtime roles, Device Gate and academic gate
                meanings remain project-owned.
              </p>
            </article>
            <article>
              <span>Product gaps</span>
              <strong>Tooling and UX work</strong>
              <p>
                Import provenance, aliases, drift and case inspection are product
                work—not proof of missing Universal Core entities.
              </p>
            </article>
          </div>
        </section>

        <details className="canonical-disclosure reference-case-disclosure">
          <summary>
            Concept classification
            <span>Mapping detail · read-only</span>
          </summary>
          <div className="canonical-disclosure-body reference-case-disclosure-body">
            <div className="reference-case-detail-grid">
              <section>
                <h3>Already supported</h3>
                <ul>
                  {projection.classifications.supported.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Reusable Pattern candidates</h3>
                <ul>
                  {projection.classifications.patterns.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Bauman-specific extensions</h3>
                <ul>
                  {projection.classifications.projectSpecific.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Blueprint product gaps</h3>
                <ul>
                  {projection.classifications.productGaps.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </details>

        <details className="canonical-disclosure reference-case-disclosure">
          <summary>
            Semantic collision guards
            <span>{projection.guards.length} boundaries</span>
          </summary>
          <div className="canonical-disclosure-body">
            <div className="reference-case-guard-list">
              {projection.guards.map((guard) => (
                <article key={guard.label}>
                  <strong>{guard.label}</strong>
                  <p>{guard.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </details>

        <details className="canonical-disclosure reference-case-disclosure">
          <summary>
            Gap & universality analysis
            <span>{projection.gaps.length} tracked product gaps</span>
          </summary>
          <div className="canonical-disclosure-body">
            <div className="reference-case-gap-list">
              {projection.gaps.map((gap) => (
                <article key={gap.id}>
                  <div className="reference-case-gap-heading">
                    <span>{gap.id}</span>
                    <div>
                      <strong>{gap.label}</strong>
                      <small>{gap.classification}</small>
                    </div>
                  </div>
                  <p>{gap.decision}</p>
                  <span className="reference-case-gap-owner">
                    Owner: {gap.owner}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </details>

        <section
          className="reference-case-conclusion"
          aria-labelledby="reference-conclusion-title"
        >
          <div>
            <p className="section-kicker">P8-003 conclusion</p>
            <h2 id="reference-conclusion-title">Universal Core remains stable.</h2>
          </div>
          <p>{projection.conclusion}</p>
        </section>

        <footer className="knowledge-footer">
          <Link className="secondary-button registry-action" href="/knowledge">
            Back to Knowledge Library
          </Link>
          <Link className="primary-button registry-action" href="/projects/new">
            Start a project blueprint
          </Link>
        </footer>
      </main>
    </AppShell>
  );
}
