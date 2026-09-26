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
  return errorCode(error) === "AUTHORIZATION_DENIED"
    ? "forbidden"
    : "unavailable";
}
