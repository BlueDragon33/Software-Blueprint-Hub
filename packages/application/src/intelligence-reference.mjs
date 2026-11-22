import {
  decodeIntelligenceManifest,
  exchangeError,
  HUB_REPOSITORY,
  TECH_PRODUCER
} from "../../contracts/src/intelligence-exchange.mjs";

const dayMs = 86400000;

export async function prepareIntelligenceReference(wire, { readTrust, observedAt } = {}) {
  const manifest = decodeIntelligenceManifest(wire);
  if (typeof readTrust !== "function" || !Number.isFinite(observedAt)) {
    throw exchangeError("TRUST_CONTEXT_REQUIRED");
  }
  const createdAt = Date.parse(manifest.timestamp);
  const expiresAt = createdAt + manifest.retentionDays * dayMs;
  if (observedAt < createdAt || observedAt >= expiresAt) throw exchangeError("MANIFEST_OUTSIDE_RETENTION");

  const identity = Object.freeze({
    id: manifest.id,
    producer: manifest.producer,
    consumer: HUB_REPOSITORY
  });
  let trust;
  try {
    trust = await readTrust(identity);
  } catch {
    throw exchangeError("TRUST_UNAVAILABLE");
  }
  if (trust?.readAllowed !== true || trust.id !== identity.id ||
      trust.producer !== identity.producer || trust.consumer !== identity.consumer) {
    throw exchangeError("SCOPE_DENIED");
  }

  const pin = trust.currentSource;
  if (!pin || pin.revoked !== false || !Number.isFinite(pin.expiresAt) || pin.expiresAt <= observedAt) {
    throw exchangeError("SOURCE_PIN_REQUIRED");
  }
  if (pin.sourceRevision !== manifest.sourceRevision) throw exchangeError("STALE_SOURCE_REVISION");
  if (pin.integrityDigest !== manifest.integrityDigest) throw exchangeError("UNTRUSTED_MANIFEST_DIGEST");

  const allowedUntil = Math.min(expiresAt, pin.expiresAt);
  const previous = trust.previousReference;
  if (previous !== null) {
    if (!previous || previous.id !== manifest.id || !Number.isSafeInteger(previous.contentRevision) ||
        previous.contentRevision < 1 || typeof previous.integrityDigest !== "string") {
      throw exchangeError("PRIOR_REFERENCE_UNKNOWN");
    }
    if (manifest.contentRevision < previous.contentRevision) throw exchangeError("STALE_CONTENT_REVISION");
    if (manifest.contentRevision === previous.contentRevision) {
      if (manifest.integrityDigest !== previous.integrityDigest) throw exchangeError("CONTENT_REVISION_CONFLICT");
      return Object.freeze({ status: "DUPLICATE", allowedUntil });
    }
  }

  const reference = Object.freeze({
    id: manifest.id,
    evidenceId: manifest.evidenceId,
    producer: manifest.producer,
    sourceRevision: manifest.sourceRevision,
    contentRevision: manifest.contentRevision,
    integrityDigest: manifest.integrityDigest,
    outcome: manifest.outcome,
    sourceKind: manifest.producer === TECH_PRODUCER ? "research-experiment" : "defense-regression",
    relationship: "references-external-evidence",
    visibility: manifest.visibility,
    allowedUntil
  });
  return Object.freeze({ status: "REFERENCE_PREPARED", reference });
}
