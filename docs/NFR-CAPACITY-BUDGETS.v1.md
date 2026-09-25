# Blueprint OS — NFR & Capacity Budgets v1

Status: **B0 design baseline**

These are engineering targets for the first production-capable vertical slice. If implementation evidence shows a target is inappropriate, change it explicitly through review/ADR rather than silently ignoring it.

## Capacity envelope

V1 must remain usable with at least:

- 500 registered projects;
- 100 active project-type/domain templates;
- 1,000 resolved blueprint modules/gates in one large project;
- 100,000 WorkPackage/GateEvidence/Decision records across the installation;
- 10,000 records in one project history.

These are not marketing scale claims. They are the minimum dataset sizes used for performance/regression fixtures.

## Resolver performance

On the supported Node.js LTS runtime and CI reference hardware:

- normal Project Profile resolution: p95 <= 250 ms;
- stress fixture with 100 templates / 1,000 resulting requirements: p95 <= 1,000 ms;
- identical canonical inputs must produce identical normalized output/fingerprint.

Resolver performance may not be improved by skipping validation, provenance or conflict detection.

## API/application service budgets

For ordinary indexed operations excluding public-network latency:

- fetch Project Overview: p95 <= 300 ms;
- save Project Profile without conflict: p95 <= 500 ms;
- create WorkPackage: p95 <= 500 ms;
- evaluate ordinary Quality Gate: p95 <= 300 ms;
- generate non-AI execution prompt projection from local structured state: p95 <= 1,000 ms.

External AI/provider latency is measured separately and cannot be disguised inside these budgets.

## Web UX budgets

For the critical V1 journey:

- primary interaction acknowledgment <= 100 ms where no network round trip is required;
- visible pending/loading state <= 200 ms after a network-backed action starts;
- no interaction should appear frozen while waiting for resolution/persistence;
- large tables/lists must paginate or virtualize before DOM volume degrades the critical journey.

Real browser measurements are recorded during A1/A2. Human UX review can fail a flow even when timing budgets pass.

## Reliability and integrity

- no unresolved P0/P1 at release;
- canonical writes are schema validated;
- stale recordVersion write is rejected, never silently overwritten;
- retryable mutation is idempotent or protected by an explicit conflict/idempotency mechanism;
- no partial canonical state remains after a failed transaction;
- migration from the previous supported schema has automated evidence.

## Availability and recovery

V1 has no artificial enterprise uptime promise before production evidence exists.

Required instead:

- health/readiness endpoint or equivalent deployment check;
- documented backup mechanism before production canonical data;
- restore procedure;
- at least one successful restore test before Product Ready;
- release revision visible in operational diagnostics.

## Security

- authenticated identity required for persistent protected mutations;
- authorization enforced server-side/application-service-side;
- secrets absent from canonical Blueprint records and ordinary logs;
- security-relevant role/owner changes auditable;
- dependency/security scan findings triaged before release.

## Accessibility

Critical V1 journeys target WCAG 2.2 AA behavior including:

- keyboard completion;
- visible focus;
- programmatic labels;
- sufficient contrast;
- reduced-motion support where motion exists;
- dialog focus management and restoration;
- status not communicated by color alone.

## Browser support

Foundation/A1 critical E2E baseline:

- current supported Chromium;
- current supported Firefox;
- current supported WebKit;
- one desktop viewport;
- one representative mobile viewport.

Browser versions are recorded by CI evidence instead of hard-coded permanently in the constitution.

## Maintainability

- Universal Core contains no Bauman-specific nouns or provider-specific deployment policy.
- Project-type differences enter through versioned templates/contracts rather than scattered name checks.
- domain/core packages do not import Next.js or persistence adapter implementation.
- every breaking canonical schema change requires compatibility analysis + migration path.

## Observability

Every production error report for a protected/application operation should be traceable to:

- release revision;
- operation/request correlation ID;
- bounded context;
- error category;
- actor/project reference where safe;
- without logging credentials or sensitive provider tokens.

## Gate rule

Missing measurement is **not** a PASS.

For a target not yet measurable at B0, B0 approves the target definition; A1/A2 must provide actual measurement evidence.
