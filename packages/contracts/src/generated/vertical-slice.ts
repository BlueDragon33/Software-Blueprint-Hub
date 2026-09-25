/* AUTO-GENERATED FROM schemas/vertical-slice.contracts.v1.json. DO NOT EDIT BY HAND. */

/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "Id".
 */
export type Id = string;

export interface VerticalSliceContracts {
  projectProfile?: ProjectProfile;
  resolvedBlueprint?: ResolvedBlueprint;
  workPackage?: WorkPackage;
  qualityGate?: QualityGate;
  gateEvidence?: GateEvidence;
  promptProjection?: PromptProjection;
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "ProjectProfile".
 */
export interface ProjectProfile {
  id: Id;
  projectId: Id;
  meta: RecordMeta;
  name: string;
  projectType: string;
  blueprintLevel: "B0" | "B1" | "B2" | "B3" | "B4" | "B5";
  /**
   * @minItems 1
   */
  primaryUsers: [string, ...string[]];
  /**
   * @minItems 1
   */
  jobsToBeDone: [string, ...string[]];
  dataSensitivity: "public" | "internal" | "confidential" | "restricted";
  persistence: "none" | "local" | "server" | "hybrid";
  authentication: "none" | "optional" | "required";
  authorization: "none" | "simple" | "role-based" | "policy-based";
  offlineRequirement?: "none" | "read" | "read-write";
  externalIntegrations?: string[];
  aiUse?: "none" | "assistive" | "core-feature" | "agentic";
  extensibilityRequirement?: "none" | "configuration" | "templates" | "plugins";
  expectedLifetime: "temporary" | "months" | "years" | "long-lived";
  expectedScale?: string;
  availabilityRequirement?: string;
  complianceSecuritySensitivity?: string;
  deploymentTarget: string;
  maintenanceModel?: string;
  extensions?: {
    [k: string]: unknown;
  };
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "RecordMeta".
 */
export interface RecordMeta {
  schemaVersion: "1.0.0";
  recordVersion: number;
  createdAt: string;
  updatedAt: string;
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "ResolvedBlueprint".
 */
export interface ResolvedBlueprint {
  resolutionId: Id;
  resolverVersion: string;
  inputFingerprint: string;
  projectId: Id;
  profileRecordVersion: number;
  activatedTemplates: {
    id: Id;
    version: string;
    authorityLayer: "constitution" | "blueprint-level" | "project-type" | "domain-capability" | "project-addition";
  }[];
  requiredModules: Id[];
  requiredGates: Id[];
  dependencyEdges: {
    from: Id;
    to: Id;
  }[];
  rationale: {
    targetId: Id;
    sourceId: Id;
    reason: string;
  }[];
  warnings?: string[];
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "WorkPackage".
 */
export interface WorkPackage {
  id: Id;
  projectId: Id;
  title: string;
  purpose: string;
  dependencies: Id[];
  /**
   * @minItems 1
   */
  acceptanceCriteria: [string, ...string[]];
  qualityGateIds: Id[];
  status: "planned" | "blocked" | "ready" | "in-progress" | "testing" | "review" | "completed" | "archived";
  meta: RecordMeta;
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "QualityGate".
 */
export interface QualityGate {
  id: Id;
  projectId: Id;
  name: string;
  /**
   * @minItems 1
   */
  requirements: [string, ...string[]];
  status: "not-ready" | "candidate" | "pass" | "fail";
  evidenceIds: Id[];
  meta: RecordMeta;
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "GateEvidence".
 */
export interface GateEvidence {
  id: Id;
  gateId: Id;
  kind: "test" | "review" | "artifact" | "measurement" | "approval";
  source: string;
  revision: string;
  createdAt: string;
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "PromptProjection".
 */
export interface PromptProjection {
  id: Id;
  projectId: Id;
  sourceRevision: string;
  templateVersion: string;
  generatedAt: string;
  contentHash: string;
  content: string;
}
