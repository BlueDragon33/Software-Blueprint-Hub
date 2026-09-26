"use client";

import { AppShell } from "@blueprint-os/ui";

export default function GlobalErrorBoundary({
  error,
  reset
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <AppShell>
      <main className="registry-shell">
        <section
          className="registry-state registry-state-error runtime-recovery-state"
          role="alert"
          aria-labelledby="runtime-error-title"
        >
          <span className="registry-state-icon" aria-hidden="true">!</span>
          <div>
            <p className="section-kicker">Canonical runtime unavailable</p>
            <h1 id="runtime-error-title">This view could not load trusted state.</h1>
            <p>
              Blueprint OS did not replace canonical data with preview or cached
              state. Retry the same route when the trusted runtime is available.
            </p>
            {error.digest ? (
              <p className="runtime-incident-reference">
                Incident reference: <code>{error.digest}</code>
              </p>
            ) : null}
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => reset()}
          >
            Retry this view
          </button>
        </section>
      </main>
    </AppShell>
  );
}
