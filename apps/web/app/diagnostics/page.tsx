import Link from "next/link";

import {
  createOperationalDiagnostic,
  summarizeIncident
} from "@blueprint-os/application";
import {
  ActionGroup,
  AppShell,
  MetricCard,
  SectionHeading,
  StatusChip,
  Surface
} from "@blueprint-os/ui";

export const dynamic = "force-static";

const sample = createOperationalDiagnostic({
  occurredAt: "2026-09-26T18:46:00+07:00",
  severity: "error",
  category: "integration",
  boundedContext: "provider-gateway",
  operation: "provider.call",
  correlationId: "corr:diagnostics-preview",
  sourceRevision: "development-baseline",
  userSafeMessage: "A provider operation failed safely.",
  operatorSummary: "Upstream request failed with Bearer sample-secret-token.",
  recoveryGuidance: [
    "Retry only after checking the provider health signal.",
    "Escalate with the correlation ID and exact source revision."
  ],
  metadata: {
    authorization: "Bearer sample-secret-token",
    provider: "example-provider",
    retryable: true
  }
});

const summary = summarizeIncident([sample], sample.correlationId);

export default function DiagnosticsPage() {
  return (
    <AppShell>
      <main className="registry-shell diagnostics-page">
        <header className="registry-header">
          <div>
            <p className="eyebrow">Operational resilience</p>
            <h1>Incident Diagnostics</h1>
            <p className="lede">
              Correlate failures by exact revision, operation and bounded context
              without leaking credentials or manufacturing Production authority.
            </p>
          </div>
          <ActionGroup className="registry-header-actions">
            <StatusChip tone="warning">Development baseline</StatusChip>
            <Link className="secondary-button registry-action" href="/compass">
              System Compass
            </Link>
          </ActionGroup>
        </header>

        <section className="diagnostics-metrics" aria-label="Diagnostic contract summary">
          <MetricCard label="Correlation" value="Required" detail="One ID follows an operation across contexts." />
          <MetricCard label="Secret handling" value="Redacted" detail="Sensitive keys and token-like strings are removed." />
          <MetricCard label="Release authority" value="None" detail="Diagnostics explain incidents; they never authorize Production." />
        </section>

        <Surface className="diagnostics-surface" labelledBy="diagnostic-preview-title">
          <SectionHeading
            kicker="Safe diagnostic preview"
            title="What an operator may inspect"
            titleId="diagnostic-preview-title"
            description="This checked-in example deliberately includes a token-like value. The diagnostic boundary redacts it before projection."
            aside={<StatusChip tone="danger">{sample.severity}</StatusChip>}
          />
          <dl className="diagnostics-detail-grid">
            <div><dt>Correlation ID</dt><dd>{sample.correlationId}</dd></div>
            <div><dt>Bounded context</dt><dd>{sample.boundedContext}</dd></div>
            <div><dt>Operation</dt><dd>{sample.operation}</dd></div>
            <div><dt>Category</dt><dd>{sample.category}</dd></div>
            <div><dt>Source revision</dt><dd>{sample.sourceRevision}</dd></div>
            <div><dt>Secret redaction</dt><dd>{sample.secretRedactionApplied ? "Applied" : "Not required"}</dd></div>
          </dl>
          <div className="diagnostics-message">
            <strong>Operator summary</strong>
            <p>{sample.operatorSummary}</p>
          </div>
          <pre className="diagnostics-code" aria-label="Sanitized diagnostic metadata">
            {JSON.stringify(sample.metadata, null, 2)}
          </pre>
        </Surface>

        <Surface className="diagnostics-surface" labelledBy="incident-summary-title">
          <SectionHeading
            kicker="Correlation summary"
            title="Recovery guidance stays attached to evidence"
            titleId="incident-summary-title"
            description="Multiple diagnostics with the same correlation ID can be summarized without hiding the source revisions or contexts involved."
            aside={<StatusChip tone="info">{summary.highestSeverity}</StatusChip>}
          />
          <ul className="diagnostics-guidance">
            {summary.recoveryGuidance.map((step) => <li key={step}>{step}</li>)}
          </ul>
        </Surface>
      </main>
    </AppShell>
  );
}
