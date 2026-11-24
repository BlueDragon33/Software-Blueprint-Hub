import type { GraphNonceClaim } from "./graph-consumer-proof.candidate.mjs";

/** Candidate SQL is fixed; no interpolation, no migration, no real DB provisioned. */
export const GRAPH_PROOF_NONCE_INSERT_CANDIDATE: string;
export type CandidateSqlResult = Readonly<{
  rowCount: number;
  rows: readonly Readonly<{ nonce: string }>[];
}>;
/**
 * Requires a trusted server-side SQL driver with a real UNIQUE
 * (issuer,key_id,nonce) database constraint; no in-memory fallback.
 * PostgreSQL concurrency/transaction acceptance remains NOT_RUN.
 */
export function consumeGraphProofNonceCandidate(
  claim: GraphNonceClaim,
  executeSql: (
    sql: string,
    params: readonly [string, string, string, string, number]
  ) => Promise<CandidateSqlResult>
): Promise<boolean>;
