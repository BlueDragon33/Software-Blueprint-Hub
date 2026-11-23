/**
 * C30 INTERNAL-ONLY PostgreSQL atomic replay consume candidate.
 * Requires an approved, provisioned durable schema with UNIQUE
 * (issuer, key_id, nonce). No DB, migrations or role are deployed here.
 * A caller-injected executeSql MUST be a trusted parameterized database client.
 */
const ISSUER = "BlueDragon33/Application-Management";
const KEY_ID = /^[A-Za-z0-9_-]{6,80}$/;
const NONCE = /^[A-Za-z0-9_-]{22,64}$/;
const PROJECT = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,255}$/;

// This fixed, parameterized INSERT relies on a real DB uniqueness constraint.
// A single INSERT ... ON CONFLICT ... RETURNING is the concurrency CAS point.
export const GRAPH_PROOF_NONCE_INSERT_CANDIDATE = `INSERT INTO blueprint_graph_proof_nonces
  (issuer, key_id, nonce, project_id, expires_at)
  VALUES ($1, $2, $3, $4, to_timestamp($5))
  ON CONFLICT (issuer, key_id, nonce) DO NOTHING
  RETURNING nonce`;

/** No in-memory fallback. A 0-row or malformed query reply fails closed. */
export async function consumeGraphProofNonceCandidate(claim, executeSql) {
  if (!claim || typeof claim !== "object" || Array.isArray(claim)
    || claim.issuer !== ISSUER
    || typeof claim.keyId !== "string" || !KEY_ID.test(claim.keyId)
    || typeof claim.nonce !== "string" || !NONCE.test(claim.nonce)
    || typeof claim.projectId !== "string" || !PROJECT.test(claim.projectId)
    || !Number.isSafeInteger(claim.expiresAtSeconds) || claim.expiresAtSeconds <= 0
    || typeof executeSql !== "function") return false;
  try {
    const result = await executeSql(GRAPH_PROOF_NONCE_INSERT_CANDIDATE, [
      claim.issuer, claim.keyId, claim.nonce, claim.projectId, claim.expiresAtSeconds,
    ]);
    return result?.rowCount === 1 && Array.isArray(result.rows)
      && result.rows.length === 1 && result.rows[0]?.nonce === claim.nonce;
  } catch { return false; }
}
