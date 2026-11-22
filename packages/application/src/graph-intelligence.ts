/** Federated read model. Existing services retain all canonical and gate authority. */
import { createHash } from "node:crypto";
import type { ProjectProfile, ResolvedBlueprint } from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import { assertQualityGateCanPass } from "@blueprint-os/core";
import { CONSTITUTION_POLICY_VERSION } from "./constitution-authority";
import { buildQualityEvidenceGraph, type QualityEvidenceGraphInput } from "./quality-evidence-graph";
import { validateWorkflow, type WorkflowManifest } from "./prompt-workflow-core.mjs";
import type { SecurityThreatModel } from "./security-threat-model";
import type { DataLifecyclePolicy } from "./data-lifecycle";

import { graphEdgeContracts, GRAPH_LIMITS, type GraphDomain, type GraphEdgeKind, type GraphRelation } from "./graph-intelligence-view";
export * from "./graph-intelligence-view";
export type GraphNodeKind = "mechanism" | "project" | "requirement" | "work-package" |
  "quality-gate" | "gate-evidence" | "release" | "workflow-node";

export interface IntelligenceNode {
  readonly id: string;
  readonly recordId: string;
  readonly label: string;
  readonly domain: GraphDomain;
  readonly kind: GraphNodeKind;
  readonly owner: string;
  readonly contract: string;
  readonly execution: string;
  readonly verification: "unverified" | "recorded-pass" | "recorded-fail";
  readonly approval: "separate-human-authority" | "not-conferred";
  readonly source: Readonly<{
    kind: "canonical-record" | "source-contract";
    reference: string;
    revision: string | null;
    digest: string;
    codePath: string;
  }>;
  readonly details: readonly string[];
}
export interface IntelligenceEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly kind: GraphEdgeKind;
  readonly relation: GraphRelation;
  readonly provenance: "canonical" | "contract";
  readonly explanation: string;
}
export interface IntelligenceFinding {
  readonly id: string;
  readonly code: string;
  readonly severity: "warning" | "error";
  readonly nodeIds: readonly string[];
  readonly owner: GraphDomain;
  readonly reason: string;
  readonly recommendation: string;
}
export interface GraphIntelligenceProjection {
  readonly schemaVersion: "1.0.0";
  readonly projectId: string;
  readonly policyVersion: string;
  readonly sourceCodeRevision: string | null;
  readonly fingerprint: string;
  readonly nodes: readonly IntelligenceNode[];
  readonly edges: readonly IntelligenceEdge[];
  readonly findings: readonly IntelligenceFinding[];
  readonly intelligence: "deterministic-rules-not-llm";
  readonly canonicalMutationAllowed: false;
  readonly qualityGateMutationAllowed: false;
  readonly releaseAuthority: false;
  readonly agentDispatchAllowed: false;
}
export interface GraphIntelligenceInput extends QualityEvidenceGraphInput {
  readonly profile: ProjectProfile;
  readonly blueprint: ResolvedBlueprint;
  readonly workflows: readonly WorkflowManifest[];
  readonly security: SecurityThreatModel | null;
  readonly dataPolicy: DataLifecyclePolicy | null;
  /** Trusted build/runtime metadata only; never a browser-supplied supposed target HEAD. */
  readonly sourceCodeRevision: string | null;
}


const mechanisms: readonly Readonly<{
  domain: GraphDomain; label: string; owner: string; path: string; contract: string;
}>[] = [
  { domain: "constitution", label: "Constitution", owner: "ConstitutionAuthorityService", path: "control/universal-constitution-version.json", contract: "Active versioned authority set; amendments require existing ratification/publication protocol." },
  { domain: "projects", label: "Projects", owner: "ProjectProfileApplicationService", path: "packages/application/src/index.ts", contract: "Authenticated PROJECT_READ and canonical ProjectProfile resolution." },
  { domain: "architecture", label: "Architecture", owner: "Blueprint resolver", path: "packages/blueprint-engine/src/resolver.ts", contract: "Resolved requirements and dependency closure derive from versioned templates." },
  { domain: "security", label: "Security", owner: "Security threat model", path: "packages/application/src/security-threat-model.ts", contract: "Independent threat constraints and mitigation evidence; graph cannot accept risk." },
  { domain: "data", label: "Data", owner: "Data lifecycle policy", path: "packages/application/src/data-lifecycle.ts", contract: "Project-scoped retention, archive and destructive-action constraints." },
  { domain: "agents", label: "AI / Agents", owner: "Bounded AI Copilot", path: "packages/application/src/ai-copilot.ts", contract: "Analysis and proposals require explicit acceptance; no canonical, gate, release or dispatch authority." },
  { domain: "workflows", label: "Workflows", owner: "CentralPromptWorkflowRegistry", path: "packages/application/src/prompt-workflow-orchestration.ts", contract: "Versioned manifests, independently verified receipts and bounded existing execution authority." },
  { domain: "qa", label: "QA", owner: "WorkQualityApplicationService", path: "packages/application/src/work-quality-service.ts", contract: "PROJECT_REVIEW and canonical gate evidence govern recorded QualityGate status." },
  { domain: "evidence", label: "Evidence", owner: "Quality Evidence Graph", path: "packages/application/src/quality-evidence-graph.ts", contract: "Exact source/revision references; graph links do not authenticate artifact bytes." },
  { domain: "operations", label: "Operations", owner: "Release orchestration", path: "packages/application/src/release-orchestration.ts", contract: "Independent promotion constraints; deployment observation and Production authorization stay separate." },
  { domain: "human", label: "Human Authority", owner: "Authenticated human authority", path: "packages/core/src/authority.ts", contract: "Existing scoped roles and explicit human decisions; no authority granted by projection." }
];
const mechanismId = (domain: GraphDomain) => "mechanism:" + domain;
const recordId = (kind: string, id: string) => JSON.stringify([kind, id]);

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)]));
  return value;
}
function digest(value: unknown): string {
  return "sha256:" + createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function buildGraphIntelligence(input: GraphIntelligenceInput): GraphIntelligenceProjection {
  // Check inexpensive bounds BEFORE validation, cloning, hashing or graph traversal.
  const recordCount = input.workPackages.length + input.qualityGates.length + input.evidence.length +
    input.releases.length + input.blueprint.requiredModules.length + input.blueprint.requiredGates.length +
    input.workflows.reduce((n, w) => n + w.nodes.length, 0) + mechanisms.length + 1;
  const declaredEdges = input.workPackages.reduce((n, w) => n + w.dependencies.length + w.qualityGateIds.length, 0) +
    input.qualityGates.reduce((n, g) => n + g.evidenceIds.length, 0) +
    input.releases.reduce((n, r) => n + r.gateEvidenceIds.length, 0) + input.blueprint.dependencyEdges.length +
    input.workflows.reduce((n, w) => n + w.nodes.reduce((m, x) => m + x.dependsOn.length, 0), 0);
  if (recordCount > GRAPH_LIMITS.nodes || declaredEdges > GRAPH_LIMITS.edges) {
    throw new TypeError("Graph capacity exceeded; narrow the canonical project scope before retrying");
  }
  if (input.sourceCodeRevision !== null && !/^[0-9a-f]{40}$/.test(input.sourceCodeRevision)) {
    throw new TypeError("Invalid source code revision");
  }
  const records = [
    ["ProjectProfile", input.profile], ["ResolvedBlueprint", input.blueprint],
    ...input.workPackages.map(x => ["WorkPackage", x]), ...input.qualityGates.map(x => ["QualityGate", x]),
    ...input.evidence.map(x => ["GateEvidence", x]), ...input.releases.map(x => ["ReleaseRecord", x])
  ] as const;
  for (const [name, record] of records) {
    const result = validateContract(name as Parameters<typeof validateContract>[0], record);
    if (!result.valid) throw new TypeError("Invalid graph source contract: " + name);
  }
  if (input.profile.projectId !== input.projectId || input.blueprint.projectId !== input.projectId ||
      input.security && input.security.projectId !== input.projectId ||
      input.dataPolicy && input.dataPolicy.projectId !== input.projectId) {
    throw new TypeError("Graph source belongs to another project");
  }
  // This existing projection owns canonical identity and provenance-link validation.
  const quality = buildQualityEvidenceGraph(input);
  const nodes: IntelligenceNode[] = [];
  const edges: IntelligenceEdge[] = [];
  const edgeIds = new Set<string>();
  const findings: IntelligenceFinding[] = [];
  const byId = new Map<string, IntelligenceNode>();
  function addNode(node: IntelligenceNode) {
    if (byId.has(node.id)) throw new TypeError("Duplicate graph identity " + node.id);
    byId.set(node.id, node); nodes.push(node);
  }
  function edge(from: string, to: string, kind: GraphEdgeKind, explanation: string,
    provenance: IntelligenceEdge["provenance"] = "contract") {
    if (!byId.has(from) || !byId.has(to)) throw new TypeError("Broken graph reference");
    const id = JSON.stringify([kind, from, to]);
    if (edgeIds.has(id)) throw new TypeError("Duplicate graph edge");
    edgeIds.add(id);
    edges.push({ id, from, to, kind, relation: graphEdgeContracts[kind].relation, explanation, provenance });
  }
  function finding(code: string, nodeIds: readonly string[], owner: GraphDomain,
    reason: string, recommendation: string, severity: IntelligenceFinding["severity"] = "warning") {
    findings.push({ id: digest([code, nodeIds]), code, nodeIds, owner, reason, recommendation, severity });
  }
  const root = recordId("project", input.profile.id);
  for (const m of mechanisms) {
    const policy = m.domain === "security" ? input.security : m.domain === "data" ? input.dataPolicy : null;
    addNode({ id: mechanismId(m.domain), recordId: m.domain, kind: "mechanism", domain: m.domain,
      label: m.label, owner: m.owner, contract: m.contract,
      execution: policy ? "policy-loaded-runtime-unobserved" : "source-contract-runtime-unobserved",
      verification: "unverified", approval: m.domain === "human" || m.domain === "constitution" || m.domain === "operations"
        ? "separate-human-authority" : "not-conferred",
      source: { kind: "source-contract", reference: m.path, revision: policy?.sourceRevision ?? input.sourceCodeRevision,
        digest: digest(policy ?? { ...m, policyVersion: CONSTITUTION_POLICY_VERSION }), codePath: m.path },
      details: policy ? ["Checked-in project policy; evidence labels are not artifact verification.", JSON.stringify(policy)] :
        ["Contract responsibility only. No live service, LLM execution, approval or compliance is inferred."] });
  }
  addNode({ id: root, recordId: input.profile.id, label: input.profile.name, kind: "project", domain: "projects",
    owner: "ProjectProfileApplicationService", contract: "schemas/vertical-slice.contracts.v1.json#/$defs/ProjectProfile",
    execution: "profile-loaded", verification: "unverified", approval: "not-conferred",
    source: { kind: "canonical-record", reference: input.profile.id,
      revision: "recordVersion:" + input.profile.meta.recordVersion, digest: digest(input.profile),
      codePath: "packages/application/src/index.ts" },
    details: [input.profile.blueprintLevel, "Profile version " + input.profile.meta.recordVersion,
      "Resolution " + input.blueprint.resolutionId, "Profile records are not product acceptance."] });
  edge(mechanismId("constitution"), root, "governs", "Active constitutional contract governs this project; adoption is not inferred.");
  const domainLinks = [
    ["constitution", "architecture", "constrains"], ["projects", "architecture", "feeds"],
    ["security", "operations", "constrains"], ["data", "evidence", "constrains"],
    ["agents", "workflows", "feeds"], ["workflows", "qa", "feeds"],
    ["qa", "operations", "constrains"], ["qa", "evidence", "supported-by"],
    ["constitution", "human", "requires-approval"], ["operations", "human", "requires-approval"]
  ] as const;
  for (const [from, to, kind] of domainLinks) edge(mechanismId(from), mechanismId(to), kind,
    "Contract relationship: " + from + " / " + to + ". It does not report runtime execution or approval.");
  for (const m of mechanisms) edge(mechanismId(m.domain), root, "scopes", "Project-scoped contract projection; no runtime state asserted.");

  const canonicalById = new Map([...input.workPackages, ...input.qualityGates, ...input.evidence,
    ...input.releases].map(x => [x.id, x]));
  for (const q of quality.nodes) {
    const record = canonicalById.get(q.id)!;
    const domain: GraphDomain = q.kind === "work-package" ? "workflows" : q.kind === "quality-gate" ? "qa" :
      q.kind === "gate-evidence" ? "evidence" : "operations";
    const contractName = { "work-package": "WorkPackage", "quality-gate": "QualityGate", "gate-evidence": "GateEvidence", release: "ReleaseRecord" }[q.kind];
    addNode({ id: recordId(q.kind, q.id), recordId: q.id, label: q.label, kind: q.kind, domain,
      owner: mechanisms.find(m => m.domain === domain)!.owner,
      contract: "schemas/vertical-slice.contracts.v1.json#/$defs/" + contractName,
      execution: q.kind === "work-package" || q.kind === "release" ? "recorded:" + q.status : "not-observed",
      verification: q.kind === "quality-gate" && q.status === "pass" ? "recorded-pass" :
        q.kind === "quality-gate" && q.status === "fail" ? "recorded-fail" : "unverified",
      approval: q.kind === "release" ? "separate-human-authority" : "not-conferred",
      source: { kind: "canonical-record", reference: q.source ?? q.id,
        revision: q.revision ?? ("meta" in record ? "recordVersion:" + record.meta.recordVersion : null),
        digest: digest(record), codePath: mechanisms.find(m => m.domain === domain)!.path },
      details: ["Canonical recorded status: " + (q.status ?? "not recorded"),
        ...(q.kind === "work-package" ? input.workPackages.find(x => x.id === q.id)!.acceptanceCriteria :
          q.kind === "quality-gate" ? input.qualityGates.find(x => x.id === q.id)!.requirements : []),
        "Evidence artifacts and independent reviewer identity are not reverified by this projection."] });
    edge(mechanismId(domain), recordId(q.kind, q.id), "scopes", "Record owned by existing " + domain + " service.");
  }
  const qualityIds = new Map(quality.nodes.map(x => [x.id, recordId(x.kind, x.id)]));
  for (const e of quality.edges) edge(qualityIds.get(e.from)!, qualityIds.get(e.to)!, e.kind, e.explanation, "canonical");

  const requirementIds = [...input.blueprint.requiredModules, ...input.blueprint.requiredGates];
  for (const id of requirementIds) {
    const n = recordId("requirement", id);
    addNode({ id: n, recordId: id, label: id, domain: "architecture", kind: "requirement",
      owner: "Blueprint resolver", contract: "schemas/vertical-slice.contracts.v1.json#/$defs/ResolvedBlueprint",
      execution: "required-by-resolution", verification: "unverified", approval: "not-conferred",
      source: { kind: "canonical-record", reference: input.blueprint.resolutionId, revision: input.blueprint.inputFingerprint,
        digest: digest(input.blueprint), codePath: "packages/blueprint-engine/src/resolver.ts" },
      details: input.blueprint.rationale.filter(x => x.targetId === id).map(x => x.sourceId + ": " + x.reason) });
    edge(mechanismId("architecture"), n, "scopes", "Required by the current canonical resolution.", "canonical");
    const gate = input.qualityGates.find(g => g.id === id);
    if (gate) edge(n, recordId("quality-gate", gate.id), "implements-requirement", "Canonical gate record for this resolved requirement.", "canonical");
    else if (input.blueprint.requiredGates.includes(id)) finding("MISSING_REQUIRED_GATE", [n], "qa",
      "Resolved gate has no canonical QualityGate record.", "Inspect the existing Quality workspace; do not synthesize a gate PASS.");
  }
  for (const e of input.blueprint.dependencyEdges) edge(recordId("requirement", e.from), recordId("requirement", e.to),
    "depends-on", "Canonical blueprint dependency; requirement existence is not implementation.", "canonical");
  if (input.blueprint.profileRecordVersion !== input.profile.meta.recordVersion) finding("STALE_RESOLUTION", [root], "architecture",
    "Resolution targets a different ProjectProfile recordVersion.", "Reload/re-resolve through the existing profile service.", "error");

  const workflowIds = new Set<string>();
  for (const w of input.workflows) {
    if (w.project.id !== input.projectId) throw new TypeError("Workflow belongs to another project");
    if (workflowIds.has(w.workflowId) || !validateWorkflow(w).valid) throw new TypeError("Invalid/duplicate workflow contract");
    workflowIds.add(w.workflowId);
    for (const x of w.nodes) {
      const id = recordId("workflow-node", JSON.stringify([w.workflowId, x.id]));
      addNode({ id, recordId: w.workflowId + "/" + x.id, label: x.goal, domain: "workflows", kind: "workflow-node",
        owner: x.role, contract: "prompt-workflows/workflow.schema.v1.json",
        execution: "manifest-only", verification: "unverified", approval: x.humanGate || x.stage === "RELEASE"
          ? "separate-human-authority" : "not-conferred",
        source: { kind: "source-contract", reference: w.workflowId, revision: w.workflowVersion,
          digest: digest(w), codePath: "prompt-workflows/workflow.schema.v1.json" },
        details: ["Stage: " + x.stage, "Inputs: " + x.inputs.join("; "), "Outputs: " + x.outputs.join("; "),
          "Acceptance: " + x.acceptance.join("; "), "Required evidence (not observed): " + x.evidence.join("; "),
          "Allowed: " + x.allowedActions.join("; "), "Forbidden: " + x.forbiddenActions.join("; "),
          "Budget: " + JSON.stringify(x.budget) + "; on failure: " + x.onFailure] });
      edge(mechanismId("workflows"), id, "scopes", "Authored manifest only; no signed completion receipts were loaded.");
      if (x.humanGate || x.stage === "RELEASE") edge(id, mechanismId("human"), "requires-approval", "Existing human gate; graph cannot approve.");
    }
    for (const x of w.nodes) for (const dep of x.dependsOn) edge(
      recordId("workflow-node", JSON.stringify([w.workflowId, x.id])),
      recordId("workflow-node", JSON.stringify([w.workflowId, dep])), "depends-on", "Versioned manifest dependency; execution unobserved.");
  }

  for (const gate of input.qualityGates) if (gate.status === "pass") {
    try { assertQualityGateCanPass(gate, input.evidence); }
    catch { finding("PASS_WITHOUT_PROVENANCE", [recordId("quality-gate", gate.id)], "qa",
      "Recorded PASS contradicts the existing gate evidence contract.", "Have the authorized QA owner inspect canonical evidence; graph cannot repair or certify the gate.", "error"); }
  }
  for (const work of input.workPackages) if (work.status === "completed") {
    const pending = work.qualityGateIds.filter(id => input.qualityGates.find(x => x.id === id)?.status !== "pass");
    const dependencies = work.dependencies.filter(id => input.workPackages.find(x => x.id === id)?.status !== "completed");
    if (pending.length || dependencies.length) finding("COMPLETION_CONFLICT", [recordId("work-package", work.id)], "workflows",
      "Recorded completed work has unfinished dependencies or gates: " + [...pending, ...dependencies].join(", "),
      "Reconcile with the canonical WorkPackage and QA owners. Completion does not override independent constraints.", "error");
  }
  for (const release of input.releases) {
    const evidence = release.gateEvidenceIds.map(id => input.evidence.find(x => x.id === id)!);
    if (!evidence.length || evidence.some(x => x.revision !== release.revision)) finding("RELEASE_REVISION_GAP", [recordId("release", release.id)], "operations",
      "Release has no evidence or evidence targets a different exact revision.", "Collect exact-revision evidence through existing release/QA services; keep human release authority separate.", "error");
  }
  if (input.security?.publishBlockers.length) finding("SECURITY_CONSTRAINT", [mechanismId("security"), mechanismId("operations")], "security",
    "Checked-in model reports publish constraints: " + input.security.publishBlockers.join(", "),
    "Security owner must verify mitigation evidence; no other domain can waive this constraint.", "error");
  for (const [domain, value] of [["security", input.security], ["data", input.dataPolicy]] as const) if (!value) finding("POLICY_UNAVAILABLE_" + domain.toUpperCase(), [mechanismId(domain)], domain,
    "No project-scoped " + domain + " model loaded.", "Inspect the existing domain workspace; never inherit another project's policy.");

  // Cycles are conflicts for dependency edges only. Control/evidence feedback may be legitimate.
  const dependencies = new Map(nodes.map(n => [n.id, [] as string[]]));
  for (const e of edges) if (e.kind === "depends-on") dependencies.get(e.from)!.push(e.to);
  const active = new Set<string>(), visited = new Set<string>();
  function visit(id: string, trail: string[]) {
    if (active.has(id)) {
      const cycle = trail.slice(trail.indexOf(id));
      finding("DEPENDENCY_CYCLE", cycle, "architecture", "Dependency cycle: " + cycle.map(x => byId.get(x)!.recordId).join(" → "),
        "Repair the source dependency contract before scheduling affected work.", "error"); return;
    }
    if (visited.has(id)) return;
    active.add(id);
    for (const dep of dependencies.get(id)!) visit(dep, [...trail, id]);
    active.delete(id); visited.add(id);
  }
  for (const n of nodes) visit(n.id, []);
  if (nodes.length > GRAPH_LIMITS.nodes || edges.length > GRAPH_LIMITS.edges) throw new TypeError("Graph capacity exceeded");
  nodes.sort((a, b) => a.id.localeCompare(b.id)); edges.sort((a, b) => a.id.localeCompare(b.id));
  findings.sort((a, b) => a.id.localeCompare(b.id));
  const identity = { projectId: input.projectId, policyVersion: CONSTITUTION_POLICY_VERSION,
    sourceCodeRevision: input.sourceCodeRevision, nodes, edges, findings };
  return deepFreeze({ ...identity, schemaVersion: "1.0.0", fingerprint: digest(identity),
    intelligence: "deterministic-rules-not-llm", canonicalMutationAllowed: false,
    qualityGateMutationAllowed: false, releaseAuthority: false, agentDispatchAllowed: false });
}
