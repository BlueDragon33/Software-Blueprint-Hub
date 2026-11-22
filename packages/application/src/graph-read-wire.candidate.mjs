/**
 * C27 — internal, read-only GRAPH wire candidate.
 *
 * NOT an HTTP endpoint, not an app identity verifier, not a grant or production
 * contract. Only a caller that has ALREADY passed the Hub's real project-scoped
 * PROJECT_READ (e.g. loadGraphIntelligence) may use this serialization.
 * Never pass a browser-supplied graph or project ID to this function as authority.
 */
const HASH = /^sha256:[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const ID = /^[^<>\u0000-\u001f]{1,256}$/;
const NODE_KINDS = new Set([
  "mechanism", "project", "requirement", "work-package", "quality-gate",
  "gate-evidence", "release", "workflow-node",
]);
const VERIFICATIONS = new Set(["unverified", "recorded-pass", "recorded-fail"]);
const APPROVALS = new Set(["separate-human-authority", "not-conferred"]);
const PROVENANCE = new Set(["canonical", "contract"]);
const SOURCES = new Set(["canonical-record", "source-contract"]);
const RELATIONS = new Set(["dependency", "data-flow", "control", "evidence"]);
const MAX_NODES = 256, MAX_EDGES = 1024;

function validId(value) {
  return typeof value === "string" && ID.test(value);
}
function validLabel(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 240
    && !/[<>\u0000-\u001f]/.test(value);
}
function deny(code) {
  return Object.freeze({
    ok: false, schema: "blueprint-os.graph-read-wire.candidate/v0",
    status: "UNVERIFIED", code, transportEnabled: false,
    canReadGraphExternally: false, canonicalMutationAllowed: false,
    gateMutationAllowed: false, releaseAuthority: false,
    agentDispatchAllowed: false,
  });
}
function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) freeze(nested);
    Object.freeze(value);
  }
  return value;
}

/**
 * Pure shape+scope check on a trusted Hub-only runtime result.
 * This does NOT check an external client's identity or enable transmission.
 * The result must never be returned by a public route until separate signed
 * APP identity and same-project permission gates are implemented and tested.
 */
export function prepareGraphReadWireCandidate(graph, scopedProjectId) {
  if (!validId(scopedProjectId) || !graph || typeof graph !== "object"
    || Array.isArray(graph) || graph.schemaVersion !== "1.0.0"
    || graph.projectId !== scopedProjectId || graph.intelligence !== "deterministic-rules-not-llm"
    || !HASH.test(graph.fingerprint) || typeof graph.policyVersion !== "string"
    || !/^\d+\.\d+\.\d+$/.test(graph.policyVersion)
    || graph.canonicalMutationAllowed !== false || graph.qualityGateMutationAllowed !== false
    || graph.releaseAuthority !== false || graph.agentDispatchAllowed !== false
    || graph.sourceCodeRevision !== null && !COMMIT.test(graph.sourceCodeRevision)
    || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)
    || graph.nodes.length > MAX_NODES || graph.edges.length > MAX_EDGES) {
    return deny("INVALID_OR_OUT_OF_SCOPE_CANONICAL_GRAPH");
  }

  const ids = new Set();
  const nodes = [];
  for (const n of graph.nodes) {
    if (!n || typeof n !== "object" || !validId(n.id) || ids.has(n.id)
      || !validLabel(n.label) || !NODE_KINDS.has(n.kind)
      || !validId(n.domain) || !VERIFICATIONS.has(n.verification)
      || !APPROVALS.has(n.approval) || !n.source || typeof n.source !== "object"
      || !SOURCES.has(n.source.kind) || !validId(n.source.reference)
      || !HASH.test(n.source.digest)
      || n.source.revision !== null && !COMMIT.test(n.source.revision)
      || !validId(n.source.codePath)) {
      return deny("INVALID_OR_UNTRUSTED_NODE_PROVENANCE");
    }
    ids.add(n.id);
    nodes.push({
      id: n.id, label: n.label, kind: n.kind, domain: n.domain,
      verification: n.verification, approval: n.approval,
      source: {
        kind: n.source.kind, reference: n.source.reference,
        revision: n.source.revision, digest: n.source.digest,
        codePath: n.source.codePath,
      },
    });
  }

  const edgeIds = new Set();
  const edges = [];
  for (const e of graph.edges) {
    if (!e || typeof e !== "object" || !validId(e.id) || edgeIds.has(e.id)
      || !ids.has(e.from) || !ids.has(e.to) || !validId(e.kind)
      || !RELATIONS.has(e.relation) || !PROVENANCE.has(e.provenance)) {
      return deny("BROKEN_OR_UNTRUSTED_GRAPH_EDGE");
    }
    edgeIds.add(e.id);
    edges.push({
      id: e.id, from: e.from, to: e.to, kind: e.kind,
      relation: e.relation, provenance: e.provenance,
    });
  }
  return freeze({
    ok: true, schema: "blueprint-os.graph-read-wire.candidate/v0",
    status: "INTERNAL_SHAPE_VALIDATED", projectId: scopedProjectId,
    policyVersion: graph.policyVersion,
    fingerprint: graph.fingerprint, sourceCodeRevision: graph.sourceCodeRevision,
    nodes, edges,
    source: "hub-authorized-server-view-required",
    intelligence: "deterministic-rules-not-llm",
    // Deliberately denied even for a shape-valid canonical graph:
    transportEnabled: false, canReadGraphExternally: false,
    canonicalMutationAllowed: false, gateMutationAllowed: false,
    releaseAuthority: false, agentDispatchAllowed: false,
  });
}
