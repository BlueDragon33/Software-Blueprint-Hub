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
import type { WebAuthenticatedActor } from "../auth/server-actor";

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
async function verifiedRepoHead(repo: string): Promise<string> {
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
