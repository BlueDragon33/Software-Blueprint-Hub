/** C27: INTERNAL transport candidate only. These types convey no access token. */
export type GraphWireNodeCandidate = Readonly<{
  id: string;
  label: string;
  kind: "mechanism" | "project" | "requirement" | "work-package" |
    "quality-gate" | "gate-evidence" | "release" | "workflow-node";
  domain: string;
  verification: "unverified" | "recorded-pass" | "recorded-fail";
  approval: "separate-human-authority" | "not-conferred";
  source: Readonly<{
    kind: "canonical-record" | "source-contract";
    reference: string;
    revision: string | null;
    digest: string;
    codePath: string;
  }>;
}>;
export type GraphWireEdgeCandidate = Readonly<{
  id: string;
  from: string;
  to: string;
  kind: string;
  relation: "dependency" | "data-flow" | "control" | "evidence";
  provenance: "canonical" | "contract";
}>;
export type GraphReadWireDenied = Readonly<{
  ok: false;
  schema: "blueprint-os.graph-read-wire.candidate/v0";
  status: "UNVERIFIED";
  code: string;
  transportEnabled: false;
  canReadGraphExternally: false;
  canonicalMutationAllowed: false;
  gateMutationAllowed: false;
  releaseAuthority: false;
  agentDispatchAllowed: false;
}>;
export type GraphReadWireShapeValid = Readonly<{
  ok: true;
  schema: "blueprint-os.graph-read-wire.candidate/v0";
  status: "INTERNAL_SHAPE_VALIDATED";
  projectId: string;
  policyVersion: string;
  fingerprint: string;
  sourceCodeRevision: string | null;
  nodes: readonly GraphWireNodeCandidate[];
  edges: readonly GraphWireEdgeCandidate[];
  source: "hub-authorized-server-view-required";
  intelligence: "deterministic-rules-not-llm";
  transportEnabled: false;
  canReadGraphExternally: false;
  canonicalMutationAllowed: false;
  gateMutationAllowed: false;
  releaseAuthority: false;
  agentDispatchAllowed: false;
}>;
/**
 * Input MUST come from Hub's existing authenticated, project-scoped read loader.
 * A successful structural projection is NOT a verified external identity,
 * remote Graph read capability, QA approval, or production release authority.
 */
export function prepareGraphReadWireCandidate(
  trustedHubGraph: unknown, authorizedScopedProjectId: string
): GraphReadWireDenied | GraphReadWireShapeValid;
