import { createHash } from "node:crypto";

export type DiagnosticSeverity = "info" | "warning" | "error" | "critical";
export type DiagnosticCategory =
  | "validation"
  | "authorization"
  | "persistence"
  | "integration"
  | "runtime"
  | "release";

export interface OperationalDiagnosticInput {
  readonly occurredAt: string;
  readonly severity: DiagnosticSeverity;
  readonly category: DiagnosticCategory;
  readonly boundedContext: string;
  readonly operation: string;
  readonly correlationId: string;
  readonly sourceRevision: string;
  readonly userSafeMessage: string;
  readonly operatorSummary: string;
  readonly recoveryGuidance: readonly string[];
  readonly projectId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface OperationalDiagnosticRecord {
  readonly id: string;
  readonly occurredAt: string;
  readonly severity: DiagnosticSeverity;
  readonly category: DiagnosticCategory;
  readonly boundedContext: string;
  readonly operation: string;
  readonly correlationId: string;
  readonly sourceRevision: string;
  readonly userSafeMessage: string;
  readonly operatorSummary: string;
  readonly recoveryGuidance: readonly string[];
  readonly projectId?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly secretRedactionApplied: boolean;
  readonly productionReleaseAuthority: false;
}

export interface IncidentDiagnosticSummary {
  readonly kind: "incident-diagnostic-summary";
  readonly correlationId: string;
  readonly highestSeverity: DiagnosticSeverity;
  readonly sourceRevisions: readonly string[];
  readonly boundedContexts: readonly string[];
  readonly categories: readonly DiagnosticCategory[];
  readonly diagnosticIds: readonly string[];
  readonly recoveryGuidance: readonly string[];
  readonly productionReleaseAuthority: false;
}

const REDACTED = "[REDACTED]";
const sensitiveKey =
  /(password|passwd|secret|token|authorization|cookie|api[-_]?key|session|credential|private[-_]?key|client[-_]?secret)/i;

const severityRank: Readonly<Record<DiagnosticSeverity, number>> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3
};

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function redactString(value: string): { value: string; changed: boolean } {
  let result = value;
  const replacements: readonly RegExp[] = [
    /Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi,
    /Basic\s+[A-Za-z0-9+/=]+/gi,
    /gh[pousr]_[A-Za-z0-9_]+/g,
    /sk-[A-Za-z0-9_-]{12,}/g,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
  ];

  for (const pattern of replacements) {
    result = result.replace(pattern, REDACTED);
  }

  return { value: result, changed: result !== value };
}

function sanitizeValue(value: unknown): {
  readonly value: unknown;
  readonly changed: boolean;
} {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    let changed = false;
    const sanitized = value.map((item) => {
      const result = sanitizeValue(item);
      changed ||= result.changed;
      return result.value;
    });
    return { value: sanitized, changed };
  }

  if (value && typeof value === "object") {
    let changed = false;
    const entries = Object.entries(value as Readonly<Record<string, unknown>>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => {
        if (sensitiveKey.test(key)) {
          changed = true;
          return [key, REDACTED] as const;
        }
        const result = sanitizeValue(child);
        changed ||= result.changed;
        return [key, result.value] as const;
      });

    return {
      value: Object.fromEntries(entries),
      changed
    };
  }

  return { value, changed: false };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stableValue(child)])
    );
  }
  return value;
}

function hash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function sanitizeRequiredString(value: string, label: string): {
  readonly value: string;
  readonly changed: boolean;
} {
  const normalized = required(value, label);
  return redactString(normalized);
}

export function createOperationalDiagnostic(
  input: OperationalDiagnosticInput
): OperationalDiagnosticRecord {
  const userSafeMessage = sanitizeRequiredString(
    input.userSafeMessage,
    "userSafeMessage"
  );
  const operatorSummary = sanitizeRequiredString(
    input.operatorSummary,
    "operatorSummary"
  );
  const recovery = input.recoveryGuidance
    .map((item) => sanitizeRequiredString(item, "recoveryGuidance"))
    .map((item) => item.value);

  if (!recovery.length) {
    throw new TypeError("At least one recovery guidance step is required");
  }

  const metadataResult = sanitizeValue(input.metadata ?? {});
  const metadata = Object.freeze(
    metadataResult.value as Readonly<Record<string, unknown>>
  );

  const identity = {
    occurredAt: required(input.occurredAt, "occurredAt"),
    severity: input.severity,
    category: input.category,
    boundedContext: required(input.boundedContext, "boundedContext"),
    operation: required(input.operation, "operation"),
    correlationId: required(input.correlationId, "correlationId"),
    sourceRevision: required(input.sourceRevision, "sourceRevision"),
    projectId: input.projectId?.trim() || null,
    userSafeMessage: userSafeMessage.value,
    operatorSummary: operatorSummary.value,
    metadata
  };

  return Object.freeze({
    id: `diagnostic:${hash(identity).slice(0, 32)}`,
    occurredAt: identity.occurredAt,
    severity: input.severity,
    category: input.category,
    boundedContext: identity.boundedContext,
    operation: identity.operation,
    correlationId: identity.correlationId,
    sourceRevision: identity.sourceRevision,
    userSafeMessage: userSafeMessage.value,
    operatorSummary: operatorSummary.value,
    recoveryGuidance: Object.freeze(recovery),
    ...(identity.projectId ? { projectId: identity.projectId } : {}),
    metadata,
    secretRedactionApplied:
      userSafeMessage.changed ||
      operatorSummary.changed ||
      metadataResult.changed ||
      recovery.some((item, index) => item !== input.recoveryGuidance[index]?.trim()),
    productionReleaseAuthority: false
  });
}

export function summarizeIncident(
  diagnostics: readonly OperationalDiagnosticRecord[],
  correlationId: string
): IncidentDiagnosticSummary {
  const normalizedCorrelationId = required(correlationId, "correlationId");
  const matching = diagnostics
    .filter((item) => item.correlationId === normalizedCorrelationId)
    .sort(
      (a, b) =>
        a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id)
    );

  if (!matching.length) {
    throw new TypeError(
      `No diagnostics found for correlationId ${normalizedCorrelationId}`
    );
  }

  const highestSeverity = matching.reduce<DiagnosticSeverity>(
    (current, item) =>
      severityRank[item.severity] > severityRank[current]
        ? item.severity
        : current,
    "info"
  );

  return Object.freeze({
    kind: "incident-diagnostic-summary",
    correlationId: normalizedCorrelationId,
    highestSeverity,
    sourceRevisions: Object.freeze(
      [...new Set(matching.map((item) => item.sourceRevision))].sort()
    ),
    boundedContexts: Object.freeze(
      [...new Set(matching.map((item) => item.boundedContext))].sort()
    ),
    categories: Object.freeze(
      [...new Set(matching.map((item) => item.category))].sort()
    ),
    diagnosticIds: Object.freeze(matching.map((item) => item.id)),
    recoveryGuidance: Object.freeze(
      [...new Set(matching.flatMap((item) => item.recoveryGuidance))]
    ),
    productionReleaseAuthority: false
  });
}
