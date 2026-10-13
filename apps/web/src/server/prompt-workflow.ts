import "server-only";

import {
  CentralPromptWorkflowRegistry,
  CONSTITUTION_POLICY_VERSION,
  PromptWorkflowPreviewService,
  type CentralWorkflowDescription,
  type WorkflowNodePreview,
  type WorkflowNode,
  buildWorkflowReadiness,
  type WorkflowReadinessPlan
} from "@blueprint-os/application";
import { resolveGitHubPublicationToken, type WebAuthenticatedActor } from "../auth/server-actor";
import { ScopedGitHubReadExecutor } from "@blueprint-os/runtime";

import governed from "../../../../control/constitution-governed-repositories.json";
import { CENTRAL_WORKFLOW_MANIFESTS } from "./prompt-workflow-manifests.generated";
import { getBlueprintServerRuntime } from "./runtime";
import { trustedWorkflowReceiptAdapters } from "./prompt-workflow-receipts";

const workflowRegistry = new CentralPromptWorkflowRegistry(
  governed.repositories,
  CENTRAL_WORKFLOW_MANIFESTS
);

export type WorkflowNodeSummary = WorkflowNode;

export function registeredWorkflowSummaries(
  projectId: string
): readonly CentralWorkflowDescription[] {
  // Must be called only AFTER loadProjectWorkspace(...).state === "ready".
  return workflowRegistry.workflowsForProject(projectId);
}

export function isRegisteredGovernedProject(projectId: string): boolean {
  return workflowRegistry.isGovernedProject(projectId);
}

export function registeredWorkflowNodes(
  projectId: string,
  workflowId: string
): readonly WorkflowNodeSummary[] {
  const workflow = workflowRegistry.workflowForProject(projectId, workflowId);
  if (!workflow) return Object.freeze([]);
  return Object.freeze(workflow.nodes.map((node) => Object.freeze({
    ...node,
    dependsOn: Object.freeze([...node.dependsOn]),
    inputs: Object.freeze([...node.inputs]),
    outputs: Object.freeze([...node.outputs]),
    acceptance: Object.freeze([...node.acceptance]),
    evidence: Object.freeze([...node.evidence]),
    allowedActions: Object.freeze([...node.allowedActions]),
    forbiddenActions: Object.freeze([...node.forbiddenActions]),
    budget: Object.freeze({ ...node.budget })
  })));
}

/**
 * Verify the exact active branch of the repository listed in constitutional
 * governance. The registry chooses the branch; neither client nor workflow
 * manifests can substitute a branch or supply a supposed HEAD.
 */
export async function verifiedRepoHead(repo: string): Promise<string> {
  const registered = workflowRegistry.repositoryByName(repo);
  if (!registered) throw new Error("Repository is not governed by the Hub");
  const [owner, name] = registered.repository.split("/");
  if (!owner || !name) throw new Error("Malformed governed repository");
  const url = "https://api.github.com/repos/" +
    encodeURIComponent(owner) + "/" + encodeURIComponent(name) +
    "/branches/" + encodeURIComponent(registered.branch);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) {
    throw new Error("Verified repository HEAD unavailable: HTTP " + response.status);
  }
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("commit" in body)) {
    throw new Error("Malformed GitHub HEAD response");
  }
  const commit = body.commit;
  if (!commit || typeof commit !== "object" ||
      !("sha" in commit) || typeof commit.sha !== "string" ||
      !/^[0-9a-f]{40}$/.test(commit.sha)) {
    throw new Error("Verified repository SHA unavailable");
  }
  return commit.sha;
}

export async function previewRegisteredWorkflowRoot(
  actor: WebAuthenticatedActor,
  projectId: string,
  workflowId: string,
  nodeId: string
): Promise<WorkflowNodePreview> {
  const workflow = workflowRegistry.workflowForProject(projectId, workflowId);
  if (!workflow) throw new Error("Workflow does not belong to this project");
  const project = workflowRegistry.repositoryForProject(projectId);
  if (!project || workflow.project.repo !== project.repository) {
    throw new Error("Central project/repository binding mismatch");
  }

  const runtime = getBlueprintServerRuntime();
  const service = new PromptWorkflowPreviewService(
    runtime.prompts,
    {
      read: async (id: string) => {
        if (id !== workflowId) throw new Error("Workflow reader identity mismatch");
        return workflow;
      }
    },
    { readHead: verifiedRepoHead },
    CONSTITUTION_POLICY_VERSION
  );
  return service.preview(actor, projectId, workflowId, nodeId);
}


export interface RegisteredWorkflowReadiness {
  readonly plan: WorkflowReadinessPlan;
  readonly receiptVerificationConfigured: boolean;
}

/**
 * Authenticated project snapshot + verified repository HEAD are resolved first.
 * The client cannot submit completion receipts, issuer keys or an app SHA.
 * If keys/receipt source are not configured, the honest result has zero
 * verified completions; root nodes remain read-only planning candidates.
 */
export async function readRegisteredWorkflowReadiness(
  actor: WebAuthenticatedActor,
  projectId: string,
  workflowId: string
): Promise<RegisteredWorkflowReadiness> {
  const runtime = getBlueprintServerRuntime();
  const canonical = await runtime.prompts.generate(actor, projectId);
  const workflow = workflowRegistry.workflowForProject(projectId, workflowId);
  if (!workflow || canonical.projectId !== projectId) {
    throw new Error("Workflow does not belong to the authorized canonical project");
  }
  const head = await verifiedRepoHead(workflow.project.repo);
  const adapters = trustedWorkflowReceiptAdapters(
    projectId, workflow.project.repo, workflowId, head
  );
  const plan = await buildWorkflowReadiness(
    workflow, {
      projectId,
      repository: workflow.project.repo,
      appHead: head,
      canonicalDigest: canonical.sourceRevision,
      policyVersion: CONSTITUTION_POLICY_VERSION
    },
    adapters.source, adapters.trust, adapters.verifier
  );
  return Object.freeze({
    plan,
    receiptVerificationConfigured: adapters.configured
  });
}


export interface LatestCommitScopedInspection {
  readonly mode: "last-commit-read-only";
  readonly appHead: string;
  readonly nodeId: string;
  readonly checkedChangeCount: number;
  readonly scannedRepositoryRecursively: false;
  readonly state: "observed" | "no-relevant-changes";
  readonly observationDigest: string | null;
  readonly evidenceReferences: readonly string[];
  readonly explanation: string;
}

/**
 * A useful real preview for candidate DISCOVER roots, without waiting for
 * formally approved execution grants. Only reads the exact latest commit
 * diff and up to three relevant concrete source files pinned to HEAD.
 *
 * This NEVER records an execution attempt, receipt, Quality Gate or approval.
 * It is not an autonomous workflow run, and commits without relevant paths
 * truthfully report zero inspected files.
 */
export async function inspectLatestWorkflowRootChange(
  actor: WebAuthenticatedActor,
  projectId: string,
  workflowId: string
): Promise<LatestCommitScopedInspection> {
  const runtime = getBlueprintServerRuntime();
  const canonical = await runtime.prompts.generate(actor, projectId);
  const workflow = workflowRegistry.workflowForProject(projectId, workflowId);
  const governedProject = workflowRegistry.repositoryForProject(projectId);
  if (!workflow || !governedProject || canonical.projectId !== projectId ||
      workflow.project.repo !== governedProject.repository) {
    throw new Error("Canonical project/repository authorization failed");
  }
  const root = workflow.nodes.find((n) =>
    n.stage === "DISCOVER" && n.dependsOn.length === 0 && !n.humanGate);
  if (!root) throw new Error("No scoped read-only discovery root available");

  const head = await verifiedRepoHead(governedProject.repository);
  const [owner, repository] = governedProject.repository.split("/");
  if (!owner || !repository) throw new Error("Malformed governed repo identity");
  const token = await resolveGitHubPublicationToken();
  const readToken = token ?? process.env.WORKFLOW_RECEIPT_GITHUB_READ_TOKEN?.trim() ?? null;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (readToken) headers.Authorization = "Bearer " + readToken;

  const response = await fetch(
    "https://api.github.com/repos/" + encodeURIComponent(owner) + "/" +
    encodeURIComponent(repository) + "/commits/" + head,
    { cache: "no-store", redirect: "error", headers, signal: AbortSignal.timeout(8000) }
  );
  if (!response.ok) throw new Error("Pinned latest commit unavailable (" + response.status + ")");
  const commit: unknown = await response.json();
  if (!commit || typeof commit !== "object" || !("sha" in commit) ||
      commit.sha !== head || !("files" in commit) ||
      !Array.isArray(commit.files) || commit.files.length > 300) {
    throw new Error("Incomplete or malformed pinned commit diff");
  }

  const terms = (workflow.project.area.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [])
    .filter((word) => !["management", "recovery", "workflow"].includes(word));
  const candidatePaths: string[] = [];
  for (const entry of commit.files) {
    if (!entry || typeof entry !== "object" ||
        !("filename" in entry) || typeof entry.filename !== "string" ||
        !("status" in entry) || !["modified", "added"].includes(String(entry.status))) continue;
    const path = entry.filename;
    const lowered = path.toLowerCase();
    if (!/^[a-zA-Z0-9_./-]{2,240}$/.test(path) ||
        path.split("/").some((segment) => segment === "." || segment === "..") ||
        !/\.(?:ts|tsx|js|jsx|json|css|md|mjs|cjs|py|sql)$/i.test(path) ||
        /(?:^|\/)(?:\.env|secrets?|private|credentials?)(?:\/|\.|$)/i.test(path) ||
        !terms.some((term) => lowered.includes(term))) continue;
    candidatePaths.push(path);
    if (candidatePaths.length === 3) break;
  }

  if (candidatePaths.length === 0) {
    return Object.freeze({
      mode: "last-commit-read-only" as const,
      appHead: head, nodeId: root.id,
      checkedChangeCount: commit.files.length,
      scannedRepositoryRecursively: false as const,
      state: "no-relevant-changes" as const,
      observationDigest: null, evidenceReferences: Object.freeze([]),
      explanation: "No relevant readable source files were changed in this one HEAD commit. This is NOT evidence that the wider repository was inspected."
    });
  }
  const executor = new ScopedGitHubReadExecutor({
    repository: governedProject.repository,
    tokenProvider: async () => readToken
  });
  const observed = await executor.execute({
    requestId: "read-only-preview",
    projectId, repository: governedProject.repository, appHead: head,
    nodeId: root.id, mode: "inspect-scoped",
    allowedPaths: Object.freeze(candidatePaths),
    maxFiles: candidatePaths.length,
    maxTokenEstimate: 1000, attempt: 1
  });
  return Object.freeze({
    mode: "last-commit-read-only" as const,
    appHead: head, nodeId: root.id,
    checkedChangeCount: commit.files.length,
    scannedRepositoryRecursively: false as const,
    state: "observed" as const,
    observationDigest: observed.observationDigest,
    evidenceReferences: observed.evidenceReferences,
    explanation: "Pinned commit files read and hashed. Inspection only; no node execution, signed completion receipt or Gate PASS."
  });
}
