import type { GraphConsumerProofDenied, GraphConsumerProofValidatedOnly, GraphNonceClaim } from "./graph-consumer-proof.candidate.mjs";

/**
 * C30 internal candidate. These pins are caller-supplied server inputs;
 * no Production trust anchors are provisioned by the implementation.
 */
export type CandidatePinnedPublicKey = Readonly<{
  publicJwk: Readonly<{ kty: "EC"; crv: "P-256"; x: string; y: string }>;
  spkiSha256: string;
}>;
export function verifyPinnedGraphConsumerProofCandidate(input?: {
  compactJws?: string;
  expectedProjectId?: string;
  approvedPins?: ReadonlyMap<string, CandidatePinnedPublicKey>;
  consumeReplayNonce?: (claim: GraphNonceClaim) => Promise<boolean>;
  nowSeconds?: number;
}): Promise<GraphConsumerProofDenied | GraphConsumerProofValidatedOnly>;
