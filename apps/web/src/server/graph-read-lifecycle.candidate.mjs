/**
 * C32 private adapter: candidate lifecycle pin selection BEFORE C31's existing
 * signed proof -> one-time nonce -> Hub PROJECT_READ pipeline.
 * No HTTP route or keys/DB are registered by this module.
 */
import { selectGraphConsumerLifecyclePinsCandidate } from "./graph-consumer-lifecycle.candidate.mjs";
import { inspectSignedInternalHubGraphCandidate } from "./graph-read-composition.candidate.mjs";

function deny() {
  return Object.freeze({
    ok: false, status: "UNVERIFIED", code: "EXTERNAL_GRAPH_NOT_ADMITTED",
    transportEnabled: false, canReadGraphExternally: false,
    canonicalMutationAllowed: false, gateMutationAllowed: false,
    releaseAuthority: false, agentDispatchAllowed: false,
  });
}

export async function inspectLifecycleBoundHubGraphCandidate({
  trustedLifecycle, compactJws, projectId, nowSeconds,
  executeNonceSql, loadTrustedGraph, projectAudience,
} = {}) {
  const selected = selectGraphConsumerLifecyclePinsCandidate({
    trustedLifecycle, projectId, nowSeconds,
  });
  if (!selected.ok || selected.transportEnabled !== false
    || selected.canReadGraphExternally !== false) return deny();
  const result = await inspectSignedInternalHubGraphCandidate({
    approvedPins: selected.pins, compactJws, projectId, nowSeconds,
    executeNonceSql, loadTrustedGraph, projectAudience,
  });
  // The C31 internal result must NEVER be treated as an external Graph grant.
  if (!result.ok || result.status !== "INTERNAL_COMPOSITION_VALIDATED_NOT_AUTHORIZED"
    || result.transportEnabled !== false || result.canReadGraphExternally !== false
    || result.releaseAuthority !== false || result.agentDispatchAllowed !== false)
    return deny();
  return result;
}
