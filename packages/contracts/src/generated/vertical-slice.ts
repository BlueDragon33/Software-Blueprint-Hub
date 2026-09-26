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
  architectureDecision?: ArchitectureDecision;
  risk?: Risk;
  technicalDebt?: TechnicalDebt;
  releaseRecord?: ReleaseRecord;
  lessonLearned?: LessonLearned;
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
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "ArchitectureDecision".
 */
export interface ArchitectureDecision {
  id: Id;
  projectId: Id;
  title: string;
  context: string;
  decision: string;
  /**
   * @minItems 1
   */
  consequences: [string, ...string[]];
  status: "proposed" | "accepted" | "superseded" | "deprecated";
  supersedesId?: Id;
  source: string;
  sourceRevision?: string;
  meta: RecordMeta;
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "Risk".
 */
export interface Risk {
  id: Id;
  projectId: Id;
  title: string;
  description: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high" | "critical";
  status: "open" | "mitigating" | "accepted" | "closed";
  mitigation: string;
  owner?: string;
  linkedWorkPackageIds: Id[];
  source: string;
  sourceRevision?: string;
  meta: RecordMeta;
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "TechnicalDebt".
 */
export interface TechnicalDebt {
  id: Id;
  projectId: Id;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "planned" | "in-progress" | "resolved" | "accepted";
  remediation: string;
  linkedWorkPackageIds: Id[];
  source: string;
  sourceRevision?: string;
  meta: RecordMeta;
}

/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "ReleaseRecord".
 */
export interface ReleaseRecord {
  id: Id;
  projectId: Id;
  version: string;
  revision: string;
  environment: string;
  artifactSource: string;
  status: "planned" | "candidate" | "released" | "rolled-back" | "superseded";
  releasedAt?: string;
  gateEvidenceIds: Id[];
  rollbackPlan: string;
  rollbackRevision?: string;
  notes?: string;
  meta: RecordMeta;
}
/**
 * This interface was referenced by `VerticalSliceContracts`'s JSON-Schema
 * via the `definition` "LessonLearned".
 */
export interface LessonLearned {
  id: Id;
  projectId: Id;
  title: string;
  category: "product" | "architecture" | "data" | "ux" | "security" | "quality" | "operations" | "governance";
  observation: string;
  impact: string;
  action: string;
  source: string;
  sourceRevision: string;
  releaseId?: Id;
  linkedWorkPackageIds: Id[];
  meta: RecordMeta;
}
