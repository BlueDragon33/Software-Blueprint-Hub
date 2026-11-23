/**
 * C30 INTERNAL-ONLY: verify a P-256 public key against an explicit SPKI SHA-256
 * pin before allowing the already non-authorizing C29 signature check.
 *
 * The caller-injected Map is NOT provisioned by this module: no root of trust,
 * approved application identity, HTTP transport, or Graph grant is created.
 */
import { createHash, createPublicKey, timingSafeEqual } from "node:crypto";
import { verifyGraphConsumerProofCandidate } from "./graph-consumer-proof.candidate.mjs";

const KID = /^[A-Za-z0-9_-]{6,80}$/;
const PIN = /^sha256:([a-f0-9]{64})$/;

function denied() {
  return Object.freeze({
    ok: false, status: "UNVERIFIED", code: "CONSUMER_IDENTITY_NOT_ADMITTED",
    canReadGraphExternally: false, transportEnabled: false,
    canonicalMutationAllowed: false, gateMutationAllowed: false,
    releaseAuthority: false, agentDispatchAllowed: false,
  });
}

/**
 * approvedPins: Map<kid, { publicJwk: public EC P-256 JWK, spkiSha256: sha256:<hex> }>
 * This is a trusted-server configuration INPUT and is deliberately absent from
 * this candidate. Keep pins from a separately approved and reviewed authority.
 */
export async function verifyPinnedGraphConsumerProofCandidate({
  compactJws, expectedProjectId, approvedPins, consumeReplayNonce, nowSeconds,
} = {}) {
  if (typeof compactJws !== "string" || compactJws.length > 4096
    || !(approvedPins instanceof Map) || approvedPins.size < 1 || approvedPins.size > 3) return denied();

  let kid;
  try {
    const parts = compactJws.split(".");
    if (parts.length !== 3 || !/^[A-Za-z0-9_-]{1,1024}$/.test(parts[0])) return denied();
    const json = Buffer.from(parts[0], "base64url");
    if (json.toString("base64url") !== parts[0]) return denied();
    const header = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(json));
    kid = header?.kid;
  } catch { return denied(); }
  if (typeof kid !== "string" || !KID.test(kid) || !approvedPins.has(kid)) return denied();

  const entry = approvedPins.get(kid);
  if (!entry || typeof entry !== "object" || Array.isArray(entry)
    || Object.keys(entry).length !== 2 || !Object.hasOwn(entry, "publicJwk")
    || !Object.hasOwn(entry, "spkiSha256")
    || typeof entry.spkiSha256 !== "string" || !PIN.test(entry.spkiSha256)) return denied();
  const jwk = entry.publicJwk;
  if (!jwk || typeof jwk !== "object" || Array.isArray(jwk)
    || Object.keys(jwk).length !== 4 || jwk.kty !== "EC" || jwk.crv !== "P-256"
    || typeof jwk.x !== "string" || typeof jwk.y !== "string") return denied();
  try {
    const trustedKey = createPublicKey({ key: jwk, format: "jwk" });
    if (trustedKey.asymmetricKeyType !== "ec"
      || trustedKey.asymmetricKeyDetails?.namedCurve !== "prime256v1") return denied();
    const actual = createHash("sha256").update(trustedKey.export({ format: "der", type: "spki" })).digest();
    const expected = Buffer.from(entry.spkiSha256.slice(7), "hex");
    if (expected.length !== 32 || !timingSafeEqual(actual, expected)) return denied();
  } catch { return denied(); }

  // The C29 verifier independently verifies actual ES256 signature, strict
  // issuer/audience/scope/project, expiry and atomic nonce hook. Even success
  // returns CRYPTO_PROOF_VALID_ONLY_NOT_AUTHORIZED and no transport rights.
  return verifyGraphConsumerProofCandidate({
    compactJws, expectedProjectId, trustedPublicKeys: new Map([[kid, jwk]]),
    consumeReplayNonce, nowSeconds,
  });
}
