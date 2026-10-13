// Type declarations for the shared ESM workflow runtime.
export interface WorkflowNode {
  readonly id: string;
  readonly stage: "DISCOVER" | "SPECIFY" | "DESIGN" | "PLAN" | "IMPLEMENT" | "TEST" | "REVIEW" | "RELEASE" | "LEARN";
  readonly role: string;
  readonly goal: string;
  readonly dependsOn: readonly string[];
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly acceptance: readonly string[];
  readonly evidence: readonly string[];
  readonly allowedActions: readonly string[];
  readonly forbiddenActions: readonly string[];
  readonly budget: Readonly<{ maxAttempts: number; maxFiles: number; maxTokenEstimate: number }>;
  readonly onFailure: "BLOCK";
  readonly humanGate: boolean;
}
export interface WorkflowManifest {
  readonly schemaVersion: "1.0.0";
  readonly workflowId: string;
  readonly workflowVersion: string;
  readonly status: "candidate" | "approved" | "deprecated";
  readonly templateId: string;
  readonly project: Readonly<{
    id: string;
    repo: string;
    constitutionMinVersion: string;
    area: string;
    architectureDepthTarget: number;
  }>;
  readonly nodes: readonly WorkflowNode[];
}
export interface NodeSourceContext {
  readonly projectId: string;
  readonly repository: string;
  readonly appHead: string;
  readonly canonicalDigest: string;
  readonly policyVersion: string;
}
export function validateWorkflow(input: unknown): { readonly valid: boolean; readonly errors: readonly string[] };
export function suggestDependencyEligibleNodes(workflow: WorkflowManifest, externallyVerifiedCompletedIds?: readonly string[]): string[];
export function renderNodePromptCandidate(workflow: WorkflowManifest, nodeId: string, context: NodeSourceContext): string;
