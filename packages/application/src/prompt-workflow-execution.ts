/**
 * Phase 5B — opt-in, typed and bounded execution gateway.
 *
 * Executing a node requires independently trusted adoption + an ephemeral
 * Ed25519 owner grant + a persistent atomic execution journal + a real scoped
 * runner. No application endpoint or default runner is installed in this phase.
 * A successful runner outcome is NOT a signed completion receipt or QA PASS.
 */
import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";

import type { NodeSourceContext, WorkflowManifest, WorkflowNode } from "./prompt-workflow-core.mjs";
import { validateWorkflow } from "./prompt-workflow-core.mjs";
import {
  buildWorkflowReadiness,
  workflowManifestDigest,
  type WorkflowReadinessPlan,
  type WorkflowReceiptSource,
  type WorkflowTrustStore,
  type WorkflowEvidenceVerifier
} from "./prompt-workflow-orchestration";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const SHA = /^[a-f0-9]{40}$/;
const ID = /^[a-z][a-z0-9-]{1,79}$/;
const NONCE = /^[a-f0-9]{32,64}$/;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/;
const GRANT_KEYS = [
  "schemaVersion", "projectId", "repository", "workflowId",
  "workflowVersion", "workflowDigest", "templateId", "nodeId",
  "appHead", "canonicalDigest", "policyVersion", "issuerId",
  "nonce", "issuedAt", "expiresAt", "mode", "allowedPaths",
  "maxAttempts", "maxFiles", "maxTokenEstimate"
] as const;

export type WorkflowExecutionMode = "inspect-scoped" | "edit-scoped" | "test-scoped";

export interface WorkflowExecutionGrantPayload {
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
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly mode: WorkflowExecutionMode;
  readonly allowedPaths: readonly string[];
  readonly maxAttempts: number;
  readonly maxFiles: number;
  readonly maxTokenEstimate: number;
}

export interface WorkflowExecutionGrant extends WorkflowExecutionGrantPayload {
  readonly signature: string;
}

export interface WorkflowExecutionAuthority {
  /** Pinned public key of a distinct trusted execution authorizer. */
  publicKeyFor(projectId: string, issuerId: string): string | null;
  /** Authorize this issuer for scoped execution, distinct from owning a signing key. */
  assertMayExecute(projectId: string, workflowId: string, issuerId: string): Promise<void>;
  /** Check an authenticated workflow adoption decision independent of manifest.status. */
  assertAdopted(projectId: string, workflowId: string, digest: string): Promise<void>;
}

export interface WorkflowExecutionJournal {
  /**
   * MUST atomically claim nonce+scope once in durable storage (unique index/CAS).
   * False indicates a replay/in-flight task and MUST halt before any action.
   */
  claim(key: string, expiresAt: string): Promise<boolean>;
  /** MUST persist observations durably. Failure blocks next retry. */
  append(key: string, observation: WorkflowAttemptRecord): Promise<void>;
}

export interface WorkflowScopedAction {
  readonly requestId: string;
  readonly projectId: string;
  readonly repository: string;
  readonly appHead: string;
  readonly nodeId: string;
  readonly mode: WorkflowExecutionMode;
  readonly allowedPaths: readonly string[];
  readonly maxFiles: number;
  readonly maxTokenEstimate: number;
  readonly attempt: number;
}

export interface WorkflowAttemptResult {
  readonly outcome: "succeeded" | "failed";
  /** Fingerprint of a REAL observed run (test output/diff), not an inferred result. */
  readonly observationDigest: string;
  readonly evidenceReferences: readonly string[];
  readonly filesTouched: readonly string[];
  readonly tokensUsed: number;
}

export interface WorkflowExecutionFreshness {
  /** Verify *both* current canonical revision and application HEAD before each action. */
  assertCurrent(context: NodeSourceContext): Promise<void>;
}

export interface WorkflowScopedExecutor {
  /** This interface intentionally supplies no arbitrary command/shell string. */
  execute(action: WorkflowScopedAction): Promise<WorkflowAttemptResult>;
}

export interface WorkflowAttemptRecord {
  readonly attempt: number;
  readonly outcome: "succeeded" | "failed" | "invalid-result" | "runner-error";
  readonly observationDigest: string | null;
  readonly evidenceReferences: readonly string[];
  readonly filesTouched: readonly string[];
  readonly tokensUsed: number;
}

export interface WorkflowExecutionReport {
  readonly status: "submitted-for-verification" | "stopped" | "needs-new-evidence";
  readonly requestId: string;
  readonly nodeId: string;
  readonly attempts: number;
  readonly reason: string;
  readonly observations: readonly WorkflowAttemptRecord[];
  readonly completionReceiptIssued: false;
  readonly qualityGatePassed: false;
  readonly productionAuthorized: false;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stable(child)])
    );
  }
  return value;
}

export function workflowExecutionGrantSigningPayload(payload: WorkflowExecutionGrantPayload): string {
  return JSON.stringify(stable(payload));
}

const modesByStage: Readonly<Partial<Record<WorkflowNode["stage"], WorkflowExecutionMode>>> = {
  DISCOVER: "inspect-scoped",
  SPECIFY: "inspect-scoped",
  DESIGN: "inspect-scoped",
  PLAN: "inspect-scoped",
  IMPLEMENT: "edit-scoped",
  TEST: "test-scoped",
  LEARN: "inspect-scoped"
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

function validPath(value: unknown): value is string {
  if (typeof value !== "string" || value.length < 2 || value.length > 240 ||
      value.startsWith("/") || value.includes("\\") ||
      !/^[a-zA-Z0-9_./-]+$/.test(value)) return false;
  return value.split("/").every((s) => s.length > 0 && s !== "." && s !== "..");
}

function validGrantShape(v: unknown): v is WorkflowExecutionGrant {
  if (!isRecord(v) ||
      Object.keys(v).length !== GRANT_KEYS.length + 1 ||
      ![...GRANT_KEYS, "signature"].every((key) => Object.hasOwn(v, key)) ||
      v.schemaVersion !== "1.0.0") return false;
  for (const name of [
    "projectId", "repository", "workflowId", "workflowVersion", "workflowDigest",
    "templateId", "nodeId", "appHead", "canonicalDigest", "policyVersion",
    "issuerId", "nonce", "issuedAt", "expiresAt", "mode", "signature"
  ]) if (typeof v[name] !== "string") return false;
  if (!DIGEST.test(v.workflowDigest as string) ||
      !DIGEST.test(v.canonicalDigest as string) ||
      !SHA.test(v.appHead as string) ||
      !ID.test(v.issuerId as string) || !NONCE.test(v.nonce as string) ||
      !ISO.test(v.issuedAt as string) || !ISO.test(v.expiresAt as string) ||
      !/^[A-Za-z0-9+/]{86}==$/.test(v.signature as string) ||
      !["inspect-scoped", "edit-scoped", "test-scoped"].includes(v.mode as string)) return false;
  if (!Array.isArray(v.allowedPaths) || v.allowedPaths.length < 1 ||
      v.allowedPaths.length > 30 || !v.allowedPaths.every(validPath) ||
      new Set(v.allowedPaths).size !== v.allowedPaths.length) return false;
  return Number.isInteger(v.maxAttempts) && (v.maxAttempts as number) > 0 &&
    (v.maxAttempts as number) <= 5 &&
    Number.isInteger(v.maxFiles) && (v.maxFiles as number) > 0 &&
    (v.maxFiles as number) <= 30 &&
    Number.isInteger(v.maxTokenEstimate) && (v.maxTokenEstimate as number) > 0 &&
    (v.maxTokenEstimate as number) <= 30000;
}

function exactContext(
  grant: WorkflowExecutionGrant,
  workflow: WorkflowManifest,
  context: NodeSourceContext
): boolean {
  return grant.projectId === context.projectId &&
    grant.repository === context.repository &&
    grant.workflowId === workflow.workflowId &&
    grant.workflowVersion === workflow.workflowVersion &&
    grant.workflowDigest === workflowManifestDigest(workflow) &&
    grant.templateId === workflow.templateId &&
    grant.appHead === context.appHead &&
    grant.canonicalDigest === context.canonicalDigest &&
    grant.policyVersion === context.policyVersion;
}

function versionNotOlder(current: string, minimum: string): boolean {
  const a = current.split(".").map(Number);
  const b = minimum.split(".").map(Number);
  if (a.length !== 3 || b.length !== 3 ||
      [...a, ...b].some((n) => !Number.isSafeInteger(n) || n < 0)) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i]! > b[i]!) return true;
    if (a[i]! < b[i]!) return false;
  }
  return true;
}

export async function verifyWorkflowExecutionGrant(
  grantInput: unknown,
  workflow: WorkflowManifest,
  context: NodeSourceContext,
  authority: WorkflowExecutionAuthority,
  now: Date
): Promise<{ readonly grant: WorkflowExecutionGrant; readonly node: WorkflowNode }> {
  const validation = validateWorkflow(workflow);
  if (!validation.valid) throw new Error("Invalid workflow: " + validation.errors.join("; "));
  if (workflow.status !== "approved") throw new Error("Workflow has no approved execution status");
  if (!validGrantShape(grantInput)) throw new Error("Invalid signed execution grant shape");
  const grant = grantInput;
  if (!exactContext(grant, workflow, context) ||
      context.projectId !== workflow.project.id || context.repository !== workflow.project.repo ||
      !versionNotOlder(context.policyVersion, workflow.project.constitutionMinVersion)) {
    throw new Error("Stale or mismatched execution source binding");
  }
  const node = workflow.nodes.find((candidate) => candidate.id === grant.nodeId);
  if (!node || node.humanGate || node.stage === "RELEASE" || node.stage === "REVIEW") {
    throw new Error("Human/release/unknown workflow node cannot be executed here");
  }
  if (modesByStage[node.stage] !== grant.mode) throw new Error("Execution capability violates node stage");
  if (grant.maxAttempts > node.budget.maxAttempts ||
      grant.maxFiles > node.budget.maxFiles ||
      grant.maxTokenEstimate > node.budget.maxTokenEstimate ||
      grant.allowedPaths.length > grant.maxFiles) {
    throw new Error("Signed grant exceeds node budget");
  }
  const issued = Date.parse(grant.issuedAt), expires = Date.parse(grant.expiresAt);
  if (!Number.isFinite(issued) || !Number.isFinite(expires) ||
      issued > now.getTime() + 60_000 ||
      expires <= now.getTime() || expires <= issued ||
      expires - issued > 3_600_000) throw new Error("Execution grant is expired or outside bounded validity");
  const key = authority.publicKeyFor(context.projectId, grant.issuerId);
  if (!key) throw new Error("No pinned issuer key for execution");
  const { signature, ...payload } = grant;
  let signatureValid = false;
  try {
    const bytes = Buffer.from(signature, "base64");
    signatureValid = bytes.length === 64 &&
      verifySignature(null, Buffer.from(workflowExecutionGrantSigningPayload(payload)),
        createPublicKey(key), bytes);
  } catch { signatureValid = false; }
  if (!signatureValid) throw new Error("Untrusted execution grant signature");
  // Adoption lives in a separate trusted canonical authority; editing a manifest
  // status to "approved" cannot grant execution.
  await authority.assertAdopted(context.projectId, workflow.workflowId, grant.workflowDigest);
  await authority.assertMayExecute(context.projectId, workflow.workflowId, grant.issuerId);
  return { grant, node };
}

function validResult(result: WorkflowAttemptResult, grant: WorkflowExecutionGrant): boolean {
  return isRecord(result) &&
    (result.outcome === "failed" || result.outcome === "succeeded") &&
    typeof result.observationDigest === "string" && DIGEST.test(result.observationDigest) &&
    Array.isArray(result.evidenceReferences) &&
    result.evidenceReferences.length > 0 && result.evidenceReferences.length <= 30 &&
    result.evidenceReferences.every((r) => typeof r === "string" &&
      /^(?:github:|artifact:|canonical:)[a-zA-Z0-9/:._#@-]{4,300}$/.test(r)) &&
    Array.isArray(result.filesTouched) && result.filesTouched.length <= grant.maxFiles &&
    result.filesTouched.every((path) => validPath(path) &&
      grant.allowedPaths.some((allowed) => path === allowed || path.startsWith(allowed + "/"))) &&
    Number.isInteger(result.tokensUsed) && result.tokensUsed >= 0 &&
    result.tokensUsed <= grant.maxTokenEstimate;
}

/**
 * Opt-in trusted execution. The real runner cannot provide arbitrary commands
 * through this interface, only the signed enumerated mode and path scope.
 * No auto-signing of completion receipts or automatic Quality Gate transitions.
 */
export async function executeBoundedWorkflowNode(
  grantInput: unknown,
  workflow: WorkflowManifest,
  context: NodeSourceContext,
  readiness: WorkflowReadinessPlan,
  authority: WorkflowExecutionAuthority,
  journal: WorkflowExecutionJournal,
  runner: WorkflowScopedExecutor,
  freshness: WorkflowExecutionFreshness,
  clock: () => Date = () => new Date()
): Promise<WorkflowExecutionReport> {
  const { grant, node } = await verifyWorkflowExecutionGrant(
    grantInput, workflow, context, authority, clock()
  );
  if (readiness.workflowId !== workflow.workflowId ||
      readiness.workflowVersion !== workflow.workflowVersion ||
      readiness.workflowDigest !== workflowManifestDigest(workflow) ||
      readiness.appHead !== context.appHead ||
      readiness.canonicalDigest !== context.canonicalDigest ||
      readiness.policyVersion !== context.policyVersion ||
      readiness.readOnly !== true ||
      !readiness.readyNodeIds.includes(node.id) ||
      readiness.nodes.find((item) => item.id === node.id)?.state !== "available") {
    throw new Error("No verified source-bound dependency readiness for node");
  }
  await freshness.assertCurrent(context);
  const requestId = "sha256:" + createHash("sha256")
    .update(workflowExecutionGrantSigningPayload(grant))
    .digest("hex");
  const locked = await journal.claim(requestId, grant.expiresAt);
  if (!locked) throw new Error("Execution grant replay or concurrent task is blocked");

  const attempts: WorkflowAttemptRecord[] = [];
  const fingerprints = new Set<string>();
  let totalTokens = 0;
  const finish = (status: WorkflowExecutionReport["status"], reason: string): WorkflowExecutionReport =>
    Object.freeze({
      status, requestId, nodeId: node.id,
      attempts: attempts.length,
      reason, observations: Object.freeze(attempts),
      completionReceiptIssued: false, qualityGatePassed: false, productionAuthorized: false
    });

  for (let i = 1; i <= grant.maxAttempts; i++) {
    if (clock().getTime() >= Date.parse(grant.expiresAt)) {
      return finish("stopped", "Grant expired before next action");
    }
    try {
      await freshness.assertCurrent(context);
    } catch {
      return finish("stopped", "Canonical source or repository HEAD changed; reauthorize");
    }
    const action: WorkflowScopedAction = Object.freeze({
      requestId, projectId: context.projectId, repository: context.repository,
      appHead: context.appHead, nodeId: node.id,
      mode: grant.mode, allowedPaths: Object.freeze([...grant.allowedPaths]),
      maxFiles: grant.maxFiles, maxTokenEstimate: grant.maxTokenEstimate - totalTokens,
      attempt: i
    });
    let result: WorkflowAttemptResult;
    try {
      result = await runner.execute(action);
    } catch {
      const record: WorkflowAttemptRecord = Object.freeze({
        attempt: i, outcome: "runner-error", observationDigest: null,
        evidenceReferences: Object.freeze([]),
        filesTouched: Object.freeze([]), tokensUsed: 0
      });
      await journal.append(requestId, record);
      attempts.push(record);
      return finish("stopped", "Runner error; no verified observation to justify retry");
    }
    if (!validResult(result, grant) ||
        result.tokensUsed > grant.maxTokenEstimate - totalTokens) {
      const record: WorkflowAttemptRecord = Object.freeze({
        attempt: i, outcome: "invalid-result", observationDigest: null,
        evidenceReferences: Object.freeze([]),
        filesTouched: Object.freeze([]), tokensUsed: 0
      });
      await journal.append(requestId, record);
      attempts.push(record);
      return finish("stopped", "Runner report violates path, evidence or budget contract");
    }
    totalTokens += result.tokensUsed;
    const record: WorkflowAttemptRecord = Object.freeze({
      attempt: i, outcome: result.outcome,
      observationDigest: result.observationDigest,
      evidenceReferences: Object.freeze([...result.evidenceReferences]),
      filesTouched: Object.freeze([...result.filesTouched]),
      tokensUsed: result.tokensUsed
    });
    // Must persist observation before considering another attempt.
    await journal.append(requestId, record);
    attempts.push(record);
    if (result.outcome === "succeeded") {
      return finish("submitted-for-verification", "Runner reported success; separate signed evidence verification required");
    }
    if (fingerprints.has(result.observationDigest)) {
      return finish("needs-new-evidence", "Same failure fingerprint repeated; stop bounded loop");
    }
    fingerprints.add(result.observationDigest);
    if (totalTokens >= grant.maxTokenEstimate) {
      return finish("stopped", "Token budget exhausted");
    }
  }
  return finish("stopped", "Maximum authorized attempts exhausted; no successful verified outcome");
}


export interface WorkflowExecutionTrustedDependencies {
  readonly source: WorkflowReceiptSource;
  readonly trust: WorkflowTrustStore;
  readonly verifier: WorkflowEvidenceVerifier;
  readonly authority: WorkflowExecutionAuthority;
  readonly journal: WorkflowExecutionJournal;
  readonly runner: WorkflowScopedExecutor;
  readonly freshness: WorkflowExecutionFreshness;
  readonly clock?: () => Date;
}

/**
 * Safe internal entrypoint: recompute signed evidence-backed dependency
 * readiness inside the authority boundary, rather than trusting caller-
 * supplied readyNodeIds/booleans. No route, job or provider is implicitly active.
 */
export async function executeEvidenceBoundWorkflowNode(
  grant: unknown,
  workflow: WorkflowManifest,
  context: NodeSourceContext,
  dependencies: WorkflowExecutionTrustedDependencies
): Promise<WorkflowExecutionReport> {
  await dependencies.freshness.assertCurrent(context);
  const readiness = await buildWorkflowReadiness(
    workflow, context, dependencies.source,
    dependencies.trust, dependencies.verifier
  );
  return executeBoundedWorkflowNode(
    grant, workflow, context, readiness,
    dependencies.authority, dependencies.journal,
    dependencies.runner, dependencies.freshness,
    dependencies.clock
  );
}
