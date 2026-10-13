import { createHash } from "node:crypto";

import type { PromptProjection } from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import type { AuthenticatedActor } from "@blueprint-os/core";

import { PromptProjectionApplicationService } from "./prompt-projection";
import {
  renderNodePromptCandidate,
  validateWorkflow,
  type WorkflowManifest
} from "./prompt-workflow-core.mjs";

const SHA = /^[0-9a-f]{40}$/;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertValidManifest(input: unknown): asserts input is WorkflowManifest {
  const result = validateWorkflow(input);
  if (!result.valid) {
    throw new TypeError("Invalid central workflow: " + result.errors.join("; "));
  }
}

export interface CentralWorkflowReader {
  /** Registry entries come from the trusted Blueprint Hub, never client prompt text. */
  read(workflowId: string): Promise<unknown>;
}

export interface VerifiedApplicationHeadReader {
  /** Resolve actual repository HEAD from a trusted read-only provider, not a client-supplied SHA. */
  readHead(repo: string): Promise<string>;
}

export interface WorkflowNodePreview {
  readonly workflowId: string;
  readonly nodeId: string;
  readonly status: "candidate";
  readonly appHead: string;
  readonly canonicalPromptRevision: string;
  readonly projection: PromptProjection;
}

/**
 * Read-only workflow adapter to the existing authorized PromptProjectionApplicationService.
 *
 * Deliberately DOES NOT call generateAndRecord: candidate workflow prompts must not be
 * confused with canonical prompt history or imply execution/adoption authority.
 */
export class PromptWorkflowPreviewService {
  constructor(
    private readonly canonicalPrompts: PromptProjectionApplicationService,
    private readonly workflowReader: CentralWorkflowReader,
    private readonly headReader: VerifiedApplicationHeadReader,
    private readonly policyVersion: string,
    private readonly clock: () => string = () => new Date().toISOString()
  ) {}

  async preview(
    actor: AuthenticatedActor | null,
    projectId: string,
    workflowId: string,
    nodeId: string
  ): Promise<WorkflowNodePreview> {
    // Existing service handles authenticated PROJECT_READ, absent project and canonical reads.
    const canonical = await this.canonicalPrompts.generate(actor, projectId);
    const workflowInput = await this.workflowReader.read(workflowId);
    assertValidManifest(workflowInput);
    const workflow = workflowInput;
    if (workflow.workflowId !== workflowId || workflow.project.id !== projectId) {
      throw new TypeError("Workflow/project identity mismatch");
    }

    // No adoption or approval receipt exists yet. Fail closed except for read-only candidates.
    if (workflow.status !== "candidate") {
      throw new Error("Workflow must remain a candidate until trusted adoption is implemented");
    }
    const node = workflow.nodes.find((item) => item.id === nodeId);
    if (!node) throw new TypeError("Unknown workflow node");
    if (node.dependsOn.length !== 0) {
      throw new Error("Node has unmet dependencies: verified completion receipts are not implemented");
    }
    if (node.stage === "RELEASE" || node.humanGate) {
      throw new Error("Human or release gates cannot be projected as executable candidate work");
    }

    const actualHead = await this.headReader.readHead(workflow.project.repo);
    if (!SHA.test(actualHead)) throw new Error("Verified application HEAD is unavailable");
    if (!/^sha256:[a-f0-9]{64}$/.test(canonical.sourceRevision)) {
      throw new Error("Canonical source revision is unavailable");
    }
    if (canonical.projectId !== projectId) throw new Error("Canonical project identity mismatch");
    if (canonical.contentHash !== "sha256:" + sha256(canonical.content)) {
      throw new Error("Canonical projection content hash mismatch");
    }

    const nodeContent = renderNodePromptCandidate(workflow, nodeId, {
      projectId,
      repository: workflow.project.repo,
      appHead: actualHead,
      canonicalDigest: canonical.sourceRevision,
      policyVersion: this.policyVersion
    });

    const workflowDigest = sha256(JSON.stringify(workflow));
    const revisionInput = {
      canonicalRevision: canonical.sourceRevision,
      canonicalContentHash: canonical.contentHash,
      appHead: actualHead,
      workflowDigest,
      workflowId,
      workflowVersion: workflow.workflowVersion,
      templateId: workflow.templateId,
      nodeId,
      policyVersion: this.policyVersion
    };
    const sourceRevision = "sha256:" + sha256(JSON.stringify(revisionInput));
    const content = canonical.content +
      "\n---\n\n# Central workflow node overlay — candidate only\n\n" + nodeContent;
    const contentHash = "sha256:" + sha256(content);
    const projection: PromptProjection = {
      id: "prompt-projection:" + contentHash.slice(7, 39),
      projectId,
      sourceRevision,
      templateVersion: "workflow-node:v1",
      generatedAt: this.clock(),
      contentHash,
      content
    };
    const result = validateContract("PromptProjection", projection);
    if (!result.valid) {
      throw new TypeError("Invalid node PromptProjection: " +
        result.errors.map((item) => item.instancePath + " " + item.message).join("; "));
    }
    return Object.freeze({
      workflowId,
      nodeId,
      status: "candidate" as const,
      appHead: actualHead,
      canonicalPromptRevision: canonical.sourceRevision,
      projection: Object.freeze(projection)
    });
  }
}
