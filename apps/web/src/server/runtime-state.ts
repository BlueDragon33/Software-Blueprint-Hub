export type CanonicalReadFailure = "forbidden" | "unavailable";

function errorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const value = (error as { readonly code?: unknown }).code;
  return typeof value === "string" ? value : null;
}

export function classifyCanonicalReadFailure(
  error: unknown
): CanonicalReadFailure {
  if (errorCode(error) === "AUTHORIZATION_DENIED") return "forbidden";
  // Fixed categories only: no exception text, SQL, IDs, records or secrets.
  const message = error instanceof Error ? error.message : "";
  const category = error instanceof EvalError || /code generation from strings|eval is not allowed|dynamic code evaluation|unsafe-eval/i.test(message)
    ? "DYNAMIC_CODE_GENERATION"
    : /^Invalid ProjectProfile|^Invalid (WorkPackage|QualityGate|GateEvidence|Risk|ArchitectureDecision|TechnicalDebt|ReleaseRecord|LessonLearned)/.test(message)
      ? "CONTRACT_VALIDATION"
      : /Persistent .*metadata drift/.test(message) ? "METADATA_DRIFT"
      : /D1_ERROR|D1 read unavailable|Invalid document column|Invalid row|Nonunique result/i.test(message) ? "D1_READ"
      : /Canonical Cloudflare D1 binding unavailable/.test(message) ? "D1_BINDING"
      : error instanceof SyntaxError ? "SYNTAX"
      : error instanceof TypeError ? "TYPE"
      : "OTHER";
  console.error("BLUEPRINT_CANONICAL_READ_FAILURE: " + category);
  return "unavailable";
}
