/**
 * Origin guard for a state-changing Blueprint OS Server Action.
 *
 * No caller can mint a session, alter the expected Host or use cross-origin
 * browser requests to approve a canonical preflight. This guard supplements
 * the built-in Next.js Server Action origin check. It does NOT authenticate.
 */
export interface ContinuousMutationOriginHeaders {
  readonly origin: string | null;
  readonly host: string | null;
  readonly fetchSite: string | null;
}
export function assertContinuousMutationOrigin(
  headers: ContinuousMutationOriginHeaders,
  allowLoopbackHttp: boolean
): void {
  if (!headers.origin || !headers.host ||
      headers.origin.includes(",") || headers.host.includes(",") ||
      headers.fetchSite==="cross-site") {
    throw new Error("CONTINUOUS_CSRF_ORIGIN_REQUIRED");
  }
  let origin: URL;
  try { origin=new URL(headers.origin); }
  catch { throw new Error("CONTINUOUS_CSRF_ORIGIN_INVALID"); }
  if (origin.username || origin.password || origin.pathname!=="/" ||
      origin.search || origin.hash || origin.host!==headers.host.toLowerCase()) {
    throw new Error("CONTINUOUS_CSRF_ORIGIN_MISMATCH");
  }
  const host=origin.hostname;
  const loopback=host==="localhost" || host==="127.0.0.1" ||
    host==="[::1]" || host==="::1";
  if (origin.protocol!=="https:" &&
      !(allowLoopbackHttp && loopback && origin.protocol==="http:")) {
    throw new Error("CONTINUOUS_CSRF_UNSAFE_SCHEME");
  }
}
