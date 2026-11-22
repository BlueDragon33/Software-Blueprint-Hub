/** DRAFT, internal-only cryptographic proof. NEVER authorizes Graph transport. */
export type GraphConsumerProofDenied = Readonly<{
  ok: false;
  status: "UNVERIFIED";
  code: "CONSUMER_IDENTITY_NOT_ADMITTED";
  canReadGraphExternally: false;
  transportEnabled: false;
  canonicalMutationAllowed: false;
  gateMutationAllowed: false;
  releaseAuthority: false;
  agentDispatchAllowed: false;
}>;
export type GraphConsumerProofValidatedOnly = Readonly<{
  ok: true;
  status: "CRYPTO_PROOF_VALID_ONLY_NOT_AUTHORIZED";
  projectId: string;
  issuer: "BlueDragon33/Application-Management";
  canReadGraphExternally: false;
  transportEnabled: false;
  canonicalMutationAllowed: false;
  gateMutationAllowed: false;
  releaseAuthority: false;
  agentDispatchAllowed: false;
}>;
export type GraphNonceClaim = Readonly<{
  issuer: "BlueDragon33/Application-Management";
  keyId: string;
  nonce: string;
  projectId: string;
  expiresAtSeconds: number;
}>;
/**
 * Keys MUST be independently provisioned and pinned server-side; replay
 * hook MUST atomically consume a nonce in durable storage. Neither exists
 * in this C29 candidate and no HTTP route imports it.
 */
export function verifyGraphConsumerProofCandidate(input?: {
  compactJws?: string;
  expectedProjectId?: string;
  trustedPublicKeys?: ReadonlyMap<string, unknown>;
  consumeReplayNonce?: (claim: GraphNonceClaim) => Promise<boolean>;
  nowSeconds?: number;
}): Promise<GraphConsumerProofDenied | GraphConsumerProofValidatedOnly>;
