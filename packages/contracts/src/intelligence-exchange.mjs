import { createHash } from "node:crypto";

export const HUB_REPOSITORY = "BlueDragon33/Software-Blueprint-Hub";
export const TECH_PRODUCER = "project:software-blueprint-tech-intelligence";
export const DEFENSE_PRODUCER = "project:software-blueprint-innovation-defense";
export const EVIDENCE_ID_PATTERN = "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
export const SOURCE_REVISION_PATTERN = "^(?!0{40}$)[0-9a-f]{40}$";

const kind = "intelligence-exchange-manifest/v1";
const maxWireBytes = 2048;
const researchOutcomes = ["RESEARCH_HYPOTHESIS_SUPPORTED", "RESEARCH_HYPOTHESIS_FALSIFIED"];
const defenseOutcomes = ["DEFENSE_MITIGATION_VERIFIED", "DEFENSE_REVIEW_REQUIRED"];
const fields = Object.freeze({
  kind: { const: kind },
  schemaVersion: { const: "1.0.0" },
  id: { type: "string", maxLength: 100 },
  producer: { enum: [TECH_PRODUCER, DEFENSE_PRODUCER] },
  owner: { enum: [TECH_PRODUCER, DEFENSE_PRODUCER] },
  contentRevision: { type: "integer", minimum: 1, maximum: 2147483647 },
  sourceRevision: { type: "string", pattern: SOURCE_REVISION_PATTERN },
  timestamp: { type: "string", pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{3}Z$" },
  evidenceId: { type: "string", pattern: EVIDENCE_ID_PATTERN },
  outcome: { enum: [...researchOutcomes, ...defenseOutcomes] },
  visibility: { const: "private" },
  rights: { const: "reference-only" },
  shareScope: { const: HUB_REPOSITORY },
  retentionDays: { const: 30 },
  integrityDigest: { type: "string", pattern: "^sha256:[0-9a-f]{64}$" }
});
for (const rule of Object.values(fields)) {
  if (rule.enum) Object.freeze(rule.enum);
  Object.freeze(rule);
}

export const manifestSchema = Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://blueprint-os.invalid/schemas/intelligence-exchange-manifest.v1.json",
  title: "Blueprint OS intelligence exchange manifest v1",
  type: "object",
  additionalProperties: false,
  required: Object.freeze(Object.keys(fields)),
  properties: fields
});

export function exchangeError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function serializeObject(record) {
  return JSON.stringify(Object.fromEntries(Object.keys(record).sort().map(key => [key, record[key]])));
}

function validateField(value, rule) {
  if ("const" in rule) return value === rule.const;
  if ("enum" in rule) return rule.enum.includes(value);
  if (rule.type === "integer") {
    return Number.isSafeInteger(value) && value >= rule.minimum && value <= rule.maximum;
  }
  if (typeof value !== "string") return false;
  if ("maxLength" in rule) return value.length <= rule.maxLength;
  return new RegExp(rule.pattern).test(value);
}

function assertManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) throw exchangeError("INVALID_MANIFEST");
  if (manifest.schemaVersion !== "1.0.0" || manifest.kind !== kind) throw exchangeError("UNSUPPORTED_VERSION");
  if (Object.keys(manifest).length !== manifestSchema.required.length ||
      !manifestSchema.required.every(key => Object.hasOwn(manifest, key) && validateField(manifest[key], fields[key]))) {
    throw exchangeError("INVALID_MANIFEST");
  }
  const outcomes = manifest.producer === TECH_PRODUCER ? researchOutcomes : defenseOutcomes;
  const expectedId = manifest.producer + ":" + manifest.evidenceId;
  const parsedTimestamp = new Date(manifest.timestamp);
  if (manifest.id !== expectedId || manifest.owner !== manifest.producer || !outcomes.includes(manifest.outcome) ||
      !Number.isFinite(parsedTimestamp.getTime()) || parsedTimestamp.toISOString() !== manifest.timestamp) {
    throw exchangeError("INVALID_MANIFEST_BINDING");
  }
}

function digestPayload(payload) {
  return "sha256:" + createHash("sha256").update(serializeObject(payload)).digest("hex");
}

export function createIntelligenceManifest({ producer, contentRevision, sourceRevision, timestamp, evidenceId, outcome }) {
  const payload = {
    kind,
    schemaVersion: "1.0.0",
    id: producer + ":" + evidenceId,
    producer,
    owner: producer,
    contentRevision,
    sourceRevision,
    timestamp,
    evidenceId,
    outcome,
    visibility: "private",
    rights: "reference-only",
    shareScope: HUB_REPOSITORY,
    retentionDays: 30
  };
  assertManifest({ ...payload, integrityDigest: "sha256:" + "0".repeat(64) });
  return Object.freeze({ ...payload, integrityDigest: digestPayload(payload) });
}

export function encodeIntelligenceManifest(manifest) {
  assertManifest(manifest);
  const { integrityDigest, ...payload } = manifest;
  if (integrityDigest !== digestPayload(payload)) throw exchangeError("INTEGRITY_MISMATCH");
  return serializeObject(manifest) + "\n";
}

export function decodeIntelligenceManifest(wire) {
  if (typeof wire !== "string" || Buffer.byteLength(wire) > maxWireBytes) throw exchangeError("INVALID_WIRE_SIZE");
  let manifest;
  try {
    manifest = JSON.parse(wire);
  } catch {
    throw exchangeError("INVALID_JSON");
  }
  // Comparing the parsed canonical form also rejects repeated member names.
  if (wire !== encodeIntelligenceManifest(manifest)) throw exchangeError("NON_CANONICAL_WIRE");
  return Object.freeze(manifest);
}
