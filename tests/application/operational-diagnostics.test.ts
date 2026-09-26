import { describe, expect, it } from "vitest";

import {
  createOperationalDiagnostic,
  summarizeIncident
} from "../../packages/application/src/operational-diagnostics";

describe("P9-008 operational diagnostics", () => {
  it("captures bounded context, operation, revision and correlation without release authority", () => {
    const diagnostic = createOperationalDiagnostic({
      occurredAt: "2026-09-26T18:45:00+07:00",
      severity: "error",
      category: "persistence",
      boundedContext: "project-registry",
      operation: "project.list",
      correlationId: "corr:registry-001",
      sourceRevision: "6293dbb04a6ba4137a57dd887bbe35ceaa585d9c",
      projectId: "project:blueprint-os",
      userSafeMessage: "Project registry is temporarily unavailable.",
      operatorSummary: "Canonical repository read failed.",
      recoveryGuidance: [
        "Retry the canonical repository read.",
        "Check PostgreSQL connectivity before considering recovery."
      ],
      metadata: { repository: "ProjectProfileRepository" }
    });

    expect(diagnostic).toMatchObject({
      severity: "error",
      category: "persistence",
      boundedContext: "project-registry",
      operation: "project.list",
      correlationId: "corr:registry-001",
      productionReleaseAuthority: false
    });
    expect(diagnostic.id).toMatch(/^diagnostic:/);
  });

  it("redacts structured secrets and token-like strings before diagnostics leave the boundary", () => {
    const diagnostic = createOperationalDiagnostic({
      occurredAt: "2026-09-26T18:46:00+07:00",
      severity: "critical",
      category: "integration",
      boundedContext: "provider-gateway",
      operation: "provider.call",
      correlationId: "corr:provider-001",
      sourceRevision: "6293dbb04a6ba4137a57dd887bbe35ceaa585d9c",
      userSafeMessage: "Provider call failed.",
      operatorSummary: "Upstream returned Bearer abc.def.secret",
      recoveryGuidance: ["Rotate token sk-super-secret-value-123 if exposure is suspected."],
      metadata: {
        authorization: "Bearer real-secret",
        apiKey: "secret-key",
        nested: {
          cookie: "session=secret",
          endpoint: "https://provider.example"
        }
      }
    });

    expect(diagnostic.secretRedactionApplied).toBe(true);
    expect(diagnostic.operatorSummary).not.toContain("abc.def.secret");
    expect(diagnostic.recoveryGuidance.join(" ")).not.toContain("super-secret");
    expect(diagnostic.metadata).toEqual({
      apiKey: "[REDACTED]",
      authorization: "[REDACTED]",
      nested: {
        cookie: "[REDACTED]",
        endpoint: "https://provider.example"
      }
    });
  });

  it("builds a correlation summary with highest severity and deduplicated recovery guidance", () => {
    const info = createOperationalDiagnostic({
      occurredAt: "2026-09-26T18:47:00+07:00",
      severity: "warning",
      category: "runtime",
      boundedContext: "web-shell",
      operation: "route.render",
      correlationId: "corr:shared",
      sourceRevision: "rev-a",
      userSafeMessage: "A route degraded safely.",
      operatorSummary: "Trusted runtime response was unavailable.",
      recoveryGuidance: ["Retry the route."]
    });

    const critical = createOperationalDiagnostic({
      occurredAt: "2026-09-26T18:47:01+07:00",
      severity: "critical",
      category: "persistence",
      boundedContext: "project-registry",
      operation: "project.read",
      correlationId: "corr:shared",
      sourceRevision: "rev-b",
      userSafeMessage: "Canonical state is unavailable.",
      operatorSummary: "Repository failed closed.",
      recoveryGuidance: ["Retry the route.", "Verify database health."]
    });

    const summary = summarizeIncident([critical, info], "corr:shared");

    expect(summary.highestSeverity).toBe("critical");
    expect(summary.sourceRevisions).toEqual(["rev-a", "rev-b"]);
    expect(summary.boundedContexts).toEqual(["project-registry", "web-shell"]);
    expect(summary.recoveryGuidance).toEqual([
      "Retry the route.",
      "Verify database health."
    ]);
    expect(summary.productionReleaseAuthority).toBe(false);
  });

  it("fails closed when correlation evidence is absent", () => {
    expect(() => summarizeIncident([], "corr:missing")).toThrow(
      /No diagnostics found/
    );
  });
});
