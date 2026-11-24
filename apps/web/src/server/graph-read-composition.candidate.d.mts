import type { CandidatePinnedPublicKey } from "./graph-consumer-trust.candidate.mjs";
import type { CandidateSqlResult } from "./graph-consumer-nonce.candidate.mjs";
import type { TrustedHubGraphCandidateLoad } from "./graph-read-admission.candidate.mjs";

export type GraphCompositionDenied = Readonly<{
  ok: false;
  status: "UNVERIFIED";
  code: "EXTERNAL_GRAPH_NOT_ADMITTED";
  transportEnabled: false;
  canReadGraphExternally: false;
  canonicalMutationAllowed: false;
  gateMutationAllowed: false;
  releaseAuthority: false;
  agentDispatchAllowed: false;
}>;
export type GraphCompositionInternalOnly = Readonly<{
  ok: true;
  status: "INTERNAL_COMPOSITION_VALIDATED_NOT_AUTHORIZED";
  projectId: string;
  nodeCount: number;
  edgeCount: number;
  graphFingerprint: string;
  transportEnabled: false;
  canReadGraphExternally: false;
  canonicalMutationAllowed: false;
  gateMutationAllowed: false;
  releaseAuthority: false;
  agentDispatchAllowed: false;
}>;
/**
 * C31 INTERNAL ONLY. Inputs are test/integration dependencies, never HTTP body
 * parameters or authorization grants. Production trust/DB/actor are NOT set.
 */
export function inspectSignedInternalHubGraphCandidate(input?: {
  compactJws?: string;
  projectId?: string;
  nowSeconds?: number;
  approvedPins?: ReadonlyMap<string, CandidatePinnedPublicKey>;
  executeNonceSql?: (
    query: string, params: readonly [string, string, string, string, number]
  ) => Promise<CandidateSqlResult>;
  loadTrustedGraph?: (encodedId: string) => Promise<TrustedHubGraphCandidateLoad>;
  projectAudience?: ReadonlySet<string>;
}): Promise<GraphCompositionDenied | GraphCompositionInternalOnly>;
