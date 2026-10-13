/**
 * Phase 5A: signed, evidence-bound read-only workflow planning.
 * No public endpoint can record receipts, PASS Quality Gates or dispatch an agent.
 * Signing keys belong to an independently trusted authority; application commits
 * and generated prompts are untrusted evidence until verified.
 */
import { createHash, createPublicKey, verify as cryptoVerify } from "node:crypto";
import {
  validateWorkflow,
  type WorkflowManifest,
  type WorkflowNode,
  type NodeSourceContext
} from "./prompt-workflow-core.mjs";

const DIGEST = /^sha256:[0-9a-f]{64}$/;
const SHA = /^[0-9a-f]{40}$/;
const ID = /^[a-z][a-z0-9-]{1,79}$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export interface WorkflowEvidenceAnchor {
  readonly reference: string;
  readonly digest: string;
}

export interface WorkflowReceiptPayload {
  readonly schemaVersion: "1.0.0";
  readonly projectId: string;
  readonly repository: string;
  readonly workflowId: string;
  readonly workflowVersion: string;
  readonly workflowDigest: string;
  readonly templateId: string;
  readonly nodeId: string;
  readonly appHead: string;
  readonly canonicalDigest: string;
  readonly policyVersion: string;
  readonly issuerId: string;
  readonly issuedAt: string;
  readonly outcome: "completed";
  readonly evidence: readonly WorkflowEvidenceAnchor[];
}

export interface WorkflowSignedReceipt extends WorkflowReceiptPayload {
  readonly signature: string;
}

export interface WorkflowReceiptSource {
  /** Scope is enforced by the server after canonical PROJECT_READ. */
  list(projectId: string, workflowId: string): Promise<readonly unknown[]>;
}

export interface WorkflowEvidenceVerifier {
  /** Verify EACH referenced artifact exists at exactly the signed SHA256. Fail closed on errors. */
  verify(anchor: WorkflowEvidenceAnchor): Promise<boolean>;
}

export interface WorkflowTrustStore {
  /** Pinned Ed25519 public keys; never read keys from repository-supplied workflow text. */
  publicKeyFor(projectId: string, issuerId: string): string | null;
}

export interface WorkflowNodeReadiness {
  readonly id: string;
  readonly stage: WorkflowNode["stage"];
  readonly state: "available" | "waiting-evidence" | "verified" | "human-gate";
  readonly missingDependencies: readonly string[];
  readonly evidenceCount: number;
  readonly explanation: string;
}

export interface WorkflowReadinessPlan {
  readonly workflowId: string;
  readonly workflowVersion: string;
  readonly workflowDigest: string;
  readonly appHead: string;
  readonly canonicalDigest: string;
  readonly policyVersion: string;
  readonly totalReceipts: number;
  readonly acceptedReceipts: number;
  readonly rejectedReceipts: number;
  readonly readyNodeIds: readonly string[];
  readonly nodes: readonly WorkflowNodeReadiness[];
  /** available means proposal/preview only, never autonomous execution. */
  readonly readOnly: true;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, stable(child)]));
  }
  return value;
}

export function workflowReceiptSigningPayload(payload: WorkflowReceiptPayload): string {
  // No signed field can be dropped, extra properties are rejected separately.
  return JSON.stringify(stable(payload));
}

export function workflowManifestDigest(manifest: WorkflowManifest): string {
  return "sha256:" + createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function ownKeysExactly(obj: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(obj).length === keys.length && keys.every((k) => Object.hasOwn(obj, k));
}
const PAYLOAD_KEYS = [
  "schemaVersion","projectId","repository","workflowId","workflowVersion",
  "workflowDigest","templateId","nodeId","appHead","canonicalDigest",
  "policyVersion","issuerId","issuedAt","outcome","evidence"
];
const RECEIPT_KEYS = [...PAYLOAD_KEYS, "signature"];

function validateReceiptShape(value: unknown): value is WorkflowSignedReceipt {
  if (!isObject(value) || !ownKeysExactly(value, RECEIPT_KEYS)) return false;
  if (value.schemaVersion !== "1.0.0" || value.outcome !== "completed" ||
      !Array.isArray(value.evidence) || value.evidence.length < 1 || value.evidence.length > 30) return false;
  const strings = [
    "projectId","repository","workflowId","workflowVersion","workflowDigest",
    "templateId","nodeId","appHead","canonicalDigest","policyVersion","issuerId","issuedAt","signature"
  ];
  if (strings.some((key) => typeof value[key] !== "string")) return false;
  if (!DIGEST.test(value.workflowDigest as string) ||
      !DIGEST.test(value.canonicalDigest as string) ||
      !SHA.test(value.appHead as string) ||
      !ID.test(value.issuerId as string) ||
      !BASE64.test(value.signature as string) ||
      (value.signature as string).length < 80 ||
      !Number.isFinite(Date.parse(value.issuedAt as string))) return false;

  const keys = new Set<string>();
  for (const entry of value.evidence) {
    if (!isObject(entry) || !ownKeysExactly(entry, ["reference", "digest"]) ||
        typeof entry.reference !== "string" ||
        !/^(?:github:|artifact:|canonical:)[a-zA-Z0-9/:._#@-]{4,300}$/.test(entry.reference) ||
        typeof entry.digest !== "string" || !DIGEST.test(entry.digest) ||
        keys.has(entry.reference)) return false;
    keys.add(entry.reference);
  }
  return true;
}

function receiptMatches(
  receipt: WorkflowSignedReceipt,
  workflow: WorkflowManifest,
  context: NodeSourceContext,
  digest: string,
  known: ReadonlySet<string>
): boolean {
  return receipt.projectId === context.projectId &&
    receipt.repository === context.repository &&
    receipt.workflowId === workflow.workflowId &&
    receipt.workflowVersion === workflow.workflowVersion &&
    receipt.workflowDigest === digest &&
    receipt.templateId === workflow.templateId &&
    receipt.appHead === context.appHead &&
    receipt.canonicalDigest === context.canonicalDigest &&
    receipt.policyVersion === context.policyVersion &&
    known.has(receipt.nodeId);
}

export async function buildWorkflowReadiness(
  workflow: WorkflowManifest,
  context: NodeSourceContext,
  source: WorkflowReceiptSource,
  trust: WorkflowTrustStore,
  verifier: WorkflowEvidenceVerifier
): Promise<WorkflowReadinessPlan> {
  const valid = validateWorkflow(workflow);
  if (!valid.valid) throw new TypeError("Invalid central workflow: " + valid.errors.join("; "));
  if (context.projectId !== workflow.project.id ||
      context.repository !== workflow.project.repo ||
      !SHA.test(context.appHead) || !DIGEST.test(context.canonicalDigest) ||
      !/^\d+\.\d+\.\d+$/.test(context.policyVersion)) {
    throw new TypeError("Unverified or mismatched canonical workflow context");
  }
  const digest = workflowManifestDigest(workflow);
  const known = new Set(workflow.nodes.map((node) => node.id));
  // Source must be a protected, server-supplied provider. The caller is already
  // authorized by the canonical project service BEFORE invoking this function.
  const supplied = await source.list(context.projectId, workflow.workflowId);
  if (!Array.isArray(supplied) || supplied.length > 240) {
    throw new Error("Trusted completion receipt source unavailable or oversized");
  }
  const verified = new Map<string, WorkflowSignedReceipt>();
  const compromised = new Set<string>();
  let rejected = 0;
  for (const value of supplied) {
    if (!validateReceiptShape(value) ||
        !receiptMatches(value, workflow, context, digest, known)) {
      rejected++;
      continue;
    }
    const node = workflow.nodes.find((item) => item.id === value.nodeId)!;
    // A prompt/agent cannot become its own human reviewer or release authority.
    if (node.humanGate || node.stage === "RELEASE") {
      rejected++;
      continue;
    }
    const publicPem = trust.publicKeyFor(context.projectId, value.issuerId);
    if (!publicPem) { rejected++; continue; }
    const { signature, ...payload } = value;
    let signatureValid = false;
    try {
      const encoded = Buffer.from(signature, "base64");
      signatureValid = encoded.length === 64 &&
        cryptoVerify(null, Buffer.from(workflowReceiptSigningPayload(payload)),
          createPublicKey(publicPem), encoded);
    } catch { signatureValid = false; }
    if (!signatureValid) { rejected++; continue; }
    let evidenceValid = true;
    for (const anchor of value.evidence) {
      try {
        if (!(await verifier.verify(anchor))) { evidenceValid = false; break; }
      } catch { evidenceValid = false; break; }
    }
    if (!evidenceValid) { rejected++; continue; }
    // Duplicate node attestations are ambiguous: fail closed rather than
    // picking a conveniently successful receipt.
    if (verified.has(value.nodeId)) {
      compromised.add(value.nodeId);
      verified.delete(value.nodeId);
      rejected++;
      continue;
    }
    if (compromised.has(value.nodeId)) { rejected++; continue; }
    verified.set(value.nodeId, value);
  }

  // Even a valid receipt is only usable if all its dependency receipts are
  // also valid for the EXACT SAME workflow, app HEAD and canonical revision.
  const accepted = new Set<string>();
  for (const node of workflow.nodes) {
    if (verified.has(node.id) && node.dependsOn.every((id) => accepted.has(id))) {
      accepted.add(node.id);
    }
  }
  const rows: WorkflowNodeReadiness[] = workflow.nodes.map((node) => {
    const missing = node.dependsOn.filter((id) => !accepted.has(id));
    if (node.humanGate || node.stage === "RELEASE") {
      return Object.freeze({
        id: node.id, stage: node.stage, state: "human-gate" as const,
        missingDependencies: Object.freeze(missing), evidenceCount: 0,
        explanation: "Requires separate trusted human or release authorization."
      });
    }
    if (accepted.has(node.id)) {
      return Object.freeze({
        id: node.id, stage: node.stage, state: "verified" as const,
        missingDependencies: Object.freeze([]), evidenceCount: verified.get(node.id)!.evidence.length,
        explanation: "Signed completion receipt and referenced evidence digests verified for this exact source revision."
      });
    }
    if (missing.length) {
      return Object.freeze({
        id: node.id, stage: node.stage, state: "waiting-evidence" as const,
        missingDependencies: Object.freeze(missing), evidenceCount: 0,
        explanation: "Missing trusted completion receipt(s) for prerequisite node(s)."
      });
    }
    return Object.freeze({
      id: node.id, stage: node.stage, state: "available" as const,
      missingDependencies: Object.freeze([]), evidenceCount: 0,
      explanation: "Eligible for read-only planning/preview; not a grant to execute or PASS a gate."
    });
  });
  return Object.freeze({
    workflowId: workflow.workflowId,
    workflowVersion: workflow.workflowVersion,
    workflowDigest: digest,
    appHead: context.appHead,
    canonicalDigest: context.canonicalDigest,
    policyVersion: context.policyVersion,
    totalReceipts: supplied.length,
    acceptedReceipts: accepted.size,
    rejectedReceipts: rejected + (verified.size - accepted.size),
    readyNodeIds: Object.freeze(rows.filter((row) => row.state === "available").map((row) => row.id)),
    nodes: Object.freeze(rows),
    readOnly: true as const
  });
}
