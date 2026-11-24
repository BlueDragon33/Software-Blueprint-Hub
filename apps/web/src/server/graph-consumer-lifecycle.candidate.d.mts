import type { CandidatePinnedPublicKey } from "./graph-consumer-trust.candidate.mjs";

/** INTERNAL candidate; source must be a reviewed server-side registry, never HTTP input. */
export type GraphConsumerLifecycleRecordCandidate = Readonly<{
  state: "active" | "overlap" | "retired" | "revoked";
  publicJwk: CandidatePinnedPublicKey["publicJwk"];
  spkiSha256: string;
  projectIds: readonly string[];
  validFromSeconds: number;
  validUntilSeconds: number;
  revokedAtSeconds: number | null;
  overlapFromSeconds: number | null;
  overlapUntilSeconds: number | null;
}>;
export type GraphLifecycleDenied = Readonly<{
  ok: false;
  status: "UNVERIFIED";
  code: "CONSUMER_KEY_LIFECYCLE_NOT_ADMITTED";
  transportEnabled: false;
  canReadGraphExternally: false;
}>;
export type GraphLifecycleInternalPinsOnly = Readonly<{
  ok: true;
  status: "INTERNAL_PIN_SELECTION_ONLY_NOT_AUTHORIZED";
  pins: ReadonlyMap<string, CandidatePinnedPublicKey>;
  transportEnabled: false;
  canReadGraphExternally: false;
}>;
/** This candidate does NOT validate human approval, registry signatures, or audit history. */
export function selectGraphConsumerLifecyclePinsCandidate(input?: {
  trustedLifecycle?: ReadonlyMap<string, GraphConsumerLifecycleRecordCandidate>;
  projectId?: string;
  nowSeconds?: number;
}): GraphLifecycleDenied | GraphLifecycleInternalPinsOnly;
