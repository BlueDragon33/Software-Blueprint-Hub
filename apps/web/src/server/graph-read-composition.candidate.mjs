/**
 * C31 INTERNAL-ONLY proof + nonce + already authorized Hub PROJECT_READ graph.
 * This is an integration CANDIDATE, NOT an HTTP handler or grant.
 * Dependencies MUST be supplied by a trusted server caller: independently
 * approved pinned key registry, durable atomic PostgreSQL query, and the
 * existing authenticated Hub loadGraphIntelligence (not browser functions).
 */
import { verifyPinnedGraphConsumerProofCandidate } from "./graph-consumer-trust.candidate.mjs";
import { consumeGraphProofNonceCandidate } from "./graph-consumer-nonce.candidate.mjs";
import { inspectInternalProjectGraphCandidate } from "./graph-read-admission.candidate.mjs";

const PROJECT_ID = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,255}$/;

function deny() {
  return Object.freeze({
    ok: false, status: "UNVERIFIED", code: "EXTERNAL_GRAPH_NOT_ADMITTED",
    transportEnabled: false, canReadGraphExternally: false,
    canonicalMutationAllowed: false, gateMutationAllowed: false,
    releaseAuthority: false, agentDispatchAllowed: false,
  });
}

/**
 * All successful crypto and project checks still end with an INTERNAL
 * projection, never an externally exportable authorization.
 */
export async function inspectSignedInternalHubGraphCandidate({
  compactJws, projectId, nowSeconds, approvedPins, executeNonceSql,
  loadTrustedGraph, projectAudience,
} = {}) {
  if (typeof projectId !== "string" || !PROJECT_ID.test(projectId)
    || !/^[A-Za-z0-9:._-]+$/.test(projectId)
    || typeof loadTrustedGraph !== "function"
    || typeof executeNonceSql !== "function"
    || !(projectAudience instanceof Set)
    || projectAudience.size === 0 || projectAudience.size > 256
    || !projectAudience.has(projectId)) return deny();

  // Never invoke the actual Hub graph loader before a valid signature,
  // audience/project proof and a successful one-time nonce commit.
  const proof = await verifyPinnedGraphConsumerProofCandidate({
    compactJws, expectedProjectId: projectId, nowSeconds, approvedPins,
    consumeReplayNonce: claim => consumeGraphProofNonceCandidate(claim, executeNonceSql),
  });
  if (!proof.ok || proof.status !== "CRYPTO_PROOF_VALID_ONLY_NOT_AUTHORIZED"
    || proof.projectId !== projectId || proof.transportEnabled !== false
    || proof.canReadGraphExternally !== false) return deny();

  const graph = await inspectInternalProjectGraphCandidate(
    encodeURIComponent(projectId), loadTrustedGraph,
  );
  if (!graph.ok || graph.projectId !== projectId
    || graph.transportEnabled !== false
    || graph.canReadGraphExternally !== false
    || graph.canonicalMutationAllowed !== false
    || graph.gateMutationAllowed !== false
    || graph.releaseAuthority !== false
    || graph.agentDispatchAllowed !== false) return deny();

  // Never permit this shape-valid private result to be misread as a
  // response safe to serialize over HTTP.
  return Object.freeze({
    ok: true, status: "INTERNAL_COMPOSITION_VALIDATED_NOT_AUTHORIZED",
    projectId,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    graphFingerprint: graph.fingerprint,
    transportEnabled: false, canReadGraphExternally: false,
    canonicalMutationAllowed: false, gateMutationAllowed: false,
    releaseAuthority: false, agentDispatchAllowed: false,
  });
}
