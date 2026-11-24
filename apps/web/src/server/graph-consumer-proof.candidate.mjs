/**
 * C29 - P-256 signed App->Hub proof candidate, INTERNAL ONLY.
 *
 * No trust anchors, identity keys, nonce database, HTTP route, or release
 * authority are configured here. A signature proves possession of a key from
 * a CALLER-PROVIDED trusted server registry; it does not prove that such a
 * registry has been provisioned/approved in any deployed environment.
 *
 * Replay callbacks MUST be atomic/durable at integration time. An in-memory
 * Set suffices for unit tests ONLY. Never use this as an external auth grant.
 */
import { createPublicKey, verify } from "node:crypto";

const ISSUER = "BlueDragon33/Application-Management";
const AUDIENCE = "BlueDragon33/Software-Blueprint-Hub";
const HEADER_KEYS = ["alg", "typ", "kid"];
const CLAIM_KEYS = [
  "iss", "sub", "aud", "scope", "projectId", "resource", "method",
  "iat", "nbf", "exp", "jti",
];
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const KID = /^[A-Za-z0-9_-]{6,80}$/;
const NONCE = /^[A-Za-z0-9_-]{22,64}$/;
const PROJECT_ID = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,255}$/;
const MAX_TOKEN = 4096;
const MAX_LIFETIME_SECONDS = 60;
const CLOCK_SKEW_SECONDS = 5;

function denied() {
  return Object.freeze({
    ok: false, status: "UNVERIFIED", code: "CONSUMER_IDENTITY_NOT_ADMITTED",
    canReadGraphExternally: false, transportEnabled: false,
    canonicalMutationAllowed: false, gateMutationAllowed: false,
    releaseAuthority: false, agentDispatchAllowed: false,
  });
}
function canonicalDecode(part, maxChars) {
  if (typeof part !== "string" || !part || part.length > maxChars
      || !BASE64URL.test(part)) return null;
  try {
    const bytes = Buffer.from(part, "base64url");
    if (!bytes.length || bytes.toString("base64url") !== part) return null;
    const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const parsed = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object"
        || JSON.stringify(parsed) !== value) return null;
    return parsed;
  } catch { return null; }
}
function hasExactlyKeys(obj, expected) {
  const keys = Object.keys(obj);
  return keys.length === expected.length
    && expected.every((key, i) => keys[i] === key);
}
function validPublicJwk(jwk) {
  return !!jwk && typeof jwk === "object" && !Array.isArray(jwk)
    && Object.keys(jwk).length === 4
    && jwk.kty === "EC" && jwk.crv === "P-256"
    && typeof jwk.x === "string" && typeof jwk.y === "string"
    && /^[A-Za-z0-9_-]{43}$/.test(jwk.x)
    && /^[A-Za-z0-9_-]{43}$/.test(jwk.y);
}

/**
 * Pure proof check with an injected trusted registry + atomic nonce hook.
 * No actual keys or nonce storage are supplied by Blueprint OS C29.
 * Positive result explicitly DENIES external Graph transport.
 */
export async function verifyGraphConsumerProofCandidate({
  compactJws, expectedProjectId, trustedPublicKeys,
  consumeReplayNonce, nowSeconds,
} = {}) {
  if (typeof compactJws !== "string" || compactJws.length > MAX_TOKEN
    || typeof expectedProjectId !== "string" || !PROJECT_ID.test(expectedProjectId)
    || /[^A-Za-z0-9:._-]/.test(expectedProjectId)
    || !Number.isSafeInteger(nowSeconds) || nowSeconds < 0
    || !(trustedPublicKeys instanceof Map)
    || typeof consumeReplayNonce !== "function") return denied();
  const parts = compactJws.split(".");
  if (parts.length !== 3) return denied();
  const [protectedHeader, body, signaturePart] = parts;
  const header = canonicalDecode(protectedHeader, 1024);
  const claims = canonicalDecode(body, 3072);
  if (!header || !claims || !hasExactlyKeys(header, HEADER_KEYS)
    || !hasExactlyKeys(claims, CLAIM_KEYS)
    || header.alg !== "ES256" || header.typ !== "BLUEPRINT-GRAPH-READ-CANDIDATE"
    || !KID.test(header.kid)
    || claims.iss !== ISSUER || claims.sub !== ISSUER
    || claims.aud !== AUDIENCE || claims.scope !== "graph:read:project"
    || claims.projectId !== expectedProjectId
    || claims.resource !== "hub-canonical-graph"
    || claims.method !== "GET" || !NONCE.test(claims.jti)
    || !Number.isSafeInteger(claims.iat)
    || !Number.isSafeInteger(claims.nbf)
    || !Number.isSafeInteger(claims.exp)
    || claims.iat < 0 || claims.nbf < 0 || claims.exp < 0
    || claims.nbf > claims.iat
    || claims.exp <= claims.iat
    || claims.exp - claims.iat > MAX_LIFETIME_SECONDS
    || claims.iat > nowSeconds + CLOCK_SKEW_SECONDS
    || claims.nbf > nowSeconds + CLOCK_SKEW_SECONDS
    || claims.exp <= nowSeconds) return denied();

  if (!trustedPublicKeys.has(header.kid)) return denied();
  const key = trustedPublicKeys.get(header.kid);
  if (!validPublicJwk(key) || typeof signaturePart !== "string"
    || signaturePart.length !== 86 || !BASE64URL.test(signaturePart)) return denied();
  const rawSignature = Buffer.from(signaturePart, "base64url");
  if (rawSignature.length !== 64
    || rawSignature.toString("base64url") !== signaturePart) return denied();

  let verified = false;
  try {
    const trustedKey = createPublicKey({ key, format: "jwk" });
    verified = verify("sha256",
      Buffer.from(protectedHeader + "." + body, "ascii"),
      { key: trustedKey, dsaEncoding: "ieee-p1363" }, rawSignature);
  } catch { return denied(); }
  if (!verified) return denied();

  // Integration gate: this callback must be backed by a durable, atomic,
  // identity-scoped one-time nonce repository, never an in-memory cache.
  let consumed = false;
  try {
    consumed = (await consumeReplayNonce({
      issuer: ISSUER, keyId: header.kid, nonce: claims.jti,
      projectId: expectedProjectId, expiresAtSeconds: claims.exp,
    })) === true;
  } catch { return denied(); }
  if (!consumed) return denied();

  return Object.freeze({
    ok: true, status: "CRYPTO_PROOF_VALID_ONLY_NOT_AUTHORIZED",
    projectId: expectedProjectId, issuer: ISSUER,
    canReadGraphExternally: false, transportEnabled: false,
    canonicalMutationAllowed: false, gateMutationAllowed: false,
    releaseAuthority: false, agentDispatchAllowed: false,
  });
}
