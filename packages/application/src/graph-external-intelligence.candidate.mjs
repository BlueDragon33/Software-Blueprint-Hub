/**
 * P3-02 source-only, read-only Graph ↔ Dual Intelligence reference bridge.
 *
 * This sidecar NEVER extends canonical Graph nodes, commits QA evidence or
 * authenticates a caller. The protected Graph server must authorize PROJECT_READ
 * before calling it and must supply a *separate*, project-scoped readTrust port.
 * These outputs remain advisory; no live/private reference is claimed.
 */
import { decodeIntelligenceManifest, exchangeError } from "../../contracts/src/intelligence-exchange.mjs";
import { prepareIntelligenceReference } from "./intelligence-reference.mjs";

const MAX_REFERENCES = 32;
const validGraph = graph => graph && typeof graph === "object" &&
  /^project:[a-z0-9][a-z0-9-]{0,158}$/.test(graph.projectId ?? "") &&
  Array.isArray(graph.nodes) && graph.nodes.some(n => n?.kind === "project" &&
    n?.domain === "projects") &&
  graph.canonicalMutationAllowed === false &&
  graph.qualityGateMutationAllowed === false &&
  graph.releaseAuthority === false &&
  graph.agentDispatchAllowed === false;

function seal(projection) {
  Object.freeze(projection.references);
  for (const ref of projection.references) Object.freeze(ref);
  return Object.freeze(projection);
}

export async function projectExternalIntelligenceReferences(graph, wires, { readTrust, observedAt } = {}) {
  if (!validGraph(graph)) throw exchangeError("GRAPH_PROJECT_AUTHORITY_REQUIRED");
  if (!Array.isArray(wires) || wires.length > MAX_REFERENCES ||
      wires.some(w => typeof w !== "string")) throw exchangeError("REFERENCE_BATCH_INVALID");
  if (typeof readTrust !== "function" || !Number.isFinite(observedAt))
    throw exchangeError("TRUST_CONTEXT_REQUIRED");

  // Fail the entire batch on a malformed/foreign/replayed reference; do not
  // render a misleading partial "accepted" graph after another item fails.
  const seen = new Set();
  const entries = [];
  let duplicates = 0;
  for (const wire of wires) {
    // Decode *before* asking the protected trust service to prevent an
    // attacker-controlled free-form payload from entering any trust callback.
    const manifest = decodeIntelligenceManifest(wire);
    if (seen.has(manifest.id)) throw exchangeError("DUPLICATE_REFERENCE_IN_BATCH");
    seen.add(manifest.id);
    const admitted = await prepareIntelligenceReference(wire, {
      observedAt,
      readTrust: async identity => {
        const bound = Object.freeze({ ...identity, projectId: graph.projectId });
        const trust = await readTrust(bound);
        if (!trust || trust.projectId !== graph.projectId) throw exchangeError("FOREIGN_PROJECT_TRUST");
        return trust;
      }
    });
    if (admitted.status === "DUPLICATE") {
      duplicates++;
      continue;
    }
    if (admitted.status !== "REFERENCE_PREPARED") throw exchangeError("UNEXPECTED_ADMISSION_STATE");
    const ref = admitted.reference;
    if (ref.allowedUntil <= observedAt) throw exchangeError("EXPIRED_ADMISSION");
    // Allowlisted metadata only: never expose the raw wire, URLs, paths,
    // content, token values, original trust snapshot or canonical gate fields.
    entries.push({
      id: ref.id, producer: ref.producer, sourceKind: ref.sourceKind,
      sourceRevision: ref.sourceRevision, contentRevision: ref.contentRevision,
      integrityDigest: ref.integrityDigest, outcome: ref.outcome,
      allowedUntil: ref.allowedUntil,
      relation: "references-external-evidence",
      verified: "admitted-by-caller-trust-only",
      gatePass: false, reviewerApproved: false, agentDispatch: false
    });
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));
  return seal({
    schemaVersion: "1.0.0", projectId: graph.projectId,
    status: "READ_ONLY_ADVISORY", references: entries, duplicates,
    canonicalMutationAllowed: false, qualityGateMutationAllowed: false,
    agentDispatchAllowed: false, releaseAuthority: false,
    runtimeVerified: false,
    note: "Caller-scoped trusted reference admission only; this projection does not independently verify QA, review, runtime federation or production readiness."
  });
}
