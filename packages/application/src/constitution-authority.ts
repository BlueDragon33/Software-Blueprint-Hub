import { createHash, randomUUID } from "node:crypto";

import {
  AuthorityService,
  type AuthenticatedActor,
  type CanonicalConstitutionAmendmentRecord,
  type ConstitutionAuthorityRepository,
  type ConstitutionAuthoritySetAttestation,
  type ConstitutionAuthoritySetComponent,
  type ConstitutionEvidenceKind,
  type ConstitutionEvidenceRecord,
  type ConstitutionPublicationRecord,
  type ConstitutionRatificationDecisionKind,
  type ConstitutionRatificationDecisionRecord
} from "@blueprint-os/core";

export type {
  CanonicalConstitutionAmendmentRecord,
  ConstitutionAuthoritySetAttestation,
  ConstitutionAuthoritySetComponent,
  ConstitutionEvidenceKind,
  ConstitutionPublicationRecord,
  ConstitutionRatificationDecisionKind
} from "@blueprint-os/core";

export const CONSTITUTION_POLICY_ID = "blueprint-os:universal-century-grade" as const;
export const CONSTITUTION_POLICY_VERSION = "1.1.0" as const;
export const CONSTITUTION_AUTHORITY_PROMPT_VERSION =
  "constitution-authority-prompt:v1" as const;

export type ConstitutionAuthorityStageId =
  | "amendment"
  | "impact"
  | "migration"
  | "ratification"
  | "publication"
  | "propagation"
  | "verification";

export interface ConstitutionAuthorityStage {
  readonly id: ConstitutionAuthorityStageId;
  readonly order: number;
  readonly label: string;
  readonly purpose: string;
  readonly canonicalOutput: string;
  readonly humanAuthorityRequired: boolean;
  readonly mayPublishConstitution: boolean;
}

export const constitutionAuthorityStages: readonly ConstitutionAuthorityStage[] =
  Object.freeze([
    Object.freeze({
      id: "amendment",
      order: 1,
      label: "Amendment Proposal",
      purpose:
        "Describe the problem, proposed constitutional change, rationale and the exact law surface affected.",
      canonicalOutput: "versioned amendment proposal",
      humanAuthorityRequired: false,
      mayPublishConstitution: false
    }),
    Object.freeze({
      id: "impact",
      order: 2,
      label: "Impact Analysis",
      purpose:
        "Measure compatibility, security, data, UX, operations and ecosystem consequences before changing the law.",
      canonicalOutput: "impact report + affected-project matrix",
      humanAuthorityRequired: false,
      mayPublishConstitution: false
    }),
    Object.freeze({
      id: "migration",
      order: 3,
      label: "Migration Plan",
      purpose:
        "Define how existing projects move to the new law without fabricated PASS evidence or silent grandfathering.",
      canonicalOutput: "migration plan + rollout waves + rollback triggers",
      humanAuthorityRequired: false,
      mayPublishConstitution: false
    }),
    Object.freeze({
      id: "ratification",
      order: 4,
      label: "Human Ratification",
      purpose:
        "Present an exact, evidence-backed amendment brief for an authorized human constitutional decision.",
      canonicalOutput: "append-only ratification decision",
      humanAuthorityRequired: true,
      mayPublishConstitution: false
    }),
    Object.freeze({
      id: "publication",
      order: 5,
      label: "Publication",
      purpose:
        "Publish the ratified Constitution, machine-readable contract and template as one exact versioned authority set.",
      canonicalOutput: "published constitutional version",
      humanAuthorityRequired: true,
      mayPublishConstitution: true
    }),
    Object.freeze({
      id: "propagation",
      order: 6,
      label: "Propagation",
      purpose:
        "Move every governed repository to the published policy version and expose non-compliance truthfully.",
      canonicalOutput: "repository adoption/migration status",
      humanAuthorityRequired: false,
      mayPublishConstitution: false
    }),
    Object.freeze({
      id: "verification",
      order: 7,
      label: "Verification",
      purpose:
        "Prove the new law and migrations with exact evidence while keeping Production authority separate.",
      canonicalOutput: "constitutional compliance matrix + exact evidence",
      humanAuthorityRequired: false,
      mayPublishConstitution: false
    })
  ]);

export type ConstitutionAmendmentState =
  | "draft"
  | "impact-reviewed"
  | "migration-ready"
  | "ratification-ready"
  | "ratified"
  | "published"
  | "propagating"
  | "verified"
  | "rejected";

export interface ConstitutionAmendmentProposal {
  readonly id: string;
  readonly basePolicyVersion: string;
  readonly targetPolicyVersion: string;
  readonly title: string;
  readonly problem: string;
  readonly rationale: string;
  readonly affectedPillarIds: readonly string[];
  readonly affectedRequirementIds: readonly string[];
  readonly compatibilityRisk: "low" | "medium" | "high" | "critical";
  readonly migrationRequired: boolean;
  readonly proposedAt: string;
}

export interface ConstitutionAmendmentRecord {
  readonly proposal: ConstitutionAmendmentProposal;
  readonly state: ConstitutionAmendmentState;
  readonly impactEvidenceIds: readonly string[];
  readonly migrationEvidenceIds: readonly string[];
  readonly ratificationDecisionId: string | null;
  readonly publicationEvidenceId: string | null;
  readonly propagationEvidenceIds: readonly string[];
  readonly verificationEvidenceIds: readonly string[];
  readonly productionReleaseAuthority: false;
}

export type ConstitutionTransitionAction =
  | "complete-impact-review"
  | "complete-migration-plan"
  | "open-ratification"
  | "ratify"
  | "reject"
  | "publish"
  | "begin-propagation"
  | "verify";

export interface ConstitutionTransitionInput {
  readonly action: ConstitutionTransitionAction;
  readonly evidenceIds?: readonly string[];
  readonly humanRatificationDecisionId?: string | null;
}

function cleanIds(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze(
    [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))].sort()
  );
}

function requireEvidence(
  action: ConstitutionTransitionAction,
  evidenceIds: readonly string[]
): void {
  if (evidenceIds.length === 0) {
    throw new TypeError(`${action} requires canonical evidence`);
  }
}

export function transitionConstitutionAmendment(
  current: ConstitutionAmendmentRecord,
  input: ConstitutionTransitionInput
): ConstitutionAmendmentRecord {
  const evidenceIds = cleanIds(input.evidenceIds);

  if (current.state === "published" && input.action === "reject") {
    throw new TypeError("A published Constitution cannot be retroactively rejected");
  }
  if (current.state === "verified") {
    throw new TypeError("A verified amendment is immutable; propose a new amendment");
  }

  switch (input.action) {
    case "complete-impact-review":
      if (current.state !== "draft") {
        throw new TypeError("Impact review may only complete from draft");
      }
      requireEvidence(input.action, evidenceIds);
      return Object.freeze({
        ...current,
        state: "impact-reviewed",
        impactEvidenceIds: evidenceIds
      });

    case "complete-migration-plan":
      if (current.state !== "impact-reviewed") {
        throw new TypeError("Migration planning requires completed impact review");
      }
      if (current.proposal.migrationRequired) {
        requireEvidence(input.action, evidenceIds);
      }
      return Object.freeze({
        ...current,
        state: "migration-ready",
        migrationEvidenceIds: evidenceIds
      });

    case "open-ratification":
      if (current.state !== "migration-ready") {
        throw new TypeError("Ratification may only open after migration readiness");
      }
      return Object.freeze({ ...current, state: "ratification-ready" });

    case "ratify": {
      if (current.state !== "ratification-ready") {
        throw new TypeError("Ratification requires ratification-ready state");
      }
      const decisionId = input.humanRatificationDecisionId?.trim() ?? "";
      if (!decisionId) {
        throw new TypeError(
          "Ratification requires an authenticated human constitutional decision"
        );
      }
      return Object.freeze({
        ...current,
        state: "ratified",
        ratificationDecisionId: decisionId
      });
    }

    case "reject": {
      if (!["draft", "impact-reviewed", "migration-ready", "ratification-ready"].includes(current.state)) {
        throw new TypeError("This amendment state cannot be rejected");
      }
      const decisionId = input.humanRatificationDecisionId?.trim() ?? "";
      if (!decisionId) {
        throw new TypeError(
          "Rejection requires an authenticated human constitutional decision"
        );
      }
      return Object.freeze({
        ...current,
        state: "rejected",
        ratificationDecisionId: decisionId
      });
    }

    case "publish":
      if (current.state !== "ratified") {
        throw new TypeError("Publication requires a ratified amendment");
      }
      requireEvidence(input.action, evidenceIds);
      return Object.freeze({
        ...current,
        state: "published",
        publicationEvidenceId: evidenceIds[0]!
      });

    case "begin-propagation":
      if (current.state !== "published") {
        throw new TypeError("Propagation requires a published Constitution");
      }
      return Object.freeze({
        ...current,
        state: "propagating",
        propagationEvidenceIds: evidenceIds
      });

    case "verify":
      if (current.state !== "propagating") {
        throw new TypeError("Verification requires active propagation");
      }
      requireEvidence(input.action, evidenceIds);
      return Object.freeze({
        ...current,
        state: "verified",
        verificationEvidenceIds: evidenceIds
      });
  }
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stable(child)])
    );
  }
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex");
}

export interface ConstitutionPromptProjection {
  readonly stage: ConstitutionAuthorityStageId;
  readonly templateVersion: typeof CONSTITUTION_AUTHORITY_PROMPT_VERSION;
  readonly sourceDigest: string;
  readonly content: string;
  readonly mayMutateCanonicalConstitution: false;
  readonly mayRatify: false;
  readonly productionReleaseAuthority: false;
}

export function createConstitutionAuthorityPrompt(
  stageId: ConstitutionAuthorityStageId,
  proposal: ConstitutionAmendmentProposal
): ConstitutionPromptProjection {
  const stage = constitutionAuthorityStages.find((item) => item.id === stageId);
  if (!stage) throw new TypeError(`Unknown Constitution stage ${stageId}`);

  const sourceDigest = `sha256:${digest({ stageId, proposal })}`;
  const lines = [
    "# Blueprint OS Constitution Authority Prompt",
    "",
    `Template: ${CONSTITUTION_AUTHORITY_PROMPT_VERSION}`,
    `Stage: ${stage.order}. ${stage.label}`,
    `Source digest: ${sourceDigest}`,
    `Policy: ${CONSTITUTION_POLICY_ID}@${proposal.basePolicyVersion}`,
    `Target policy version: ${proposal.targetPolicyVersion}`,
    `Amendment: ${proposal.id} — ${proposal.title}`,
    "",
    "## Constitutional objective",
    proposal.problem,
    "",
    "## Rationale",
    proposal.rationale,
    "",
    "## Affected law surface",
    `- pillars: ${proposal.affectedPillarIds.join(", ") || "none declared"}`,
    `- requirements: ${proposal.affectedRequirementIds.join(", ") || "none declared"}`,
    `- compatibility risk: ${proposal.compatibilityRisk}`,
    `- migration required: ${proposal.migrationRequired ? "yes" : "no"}`,
    "",
    "## Stage duty",
    stage.purpose,
    `Required canonical output: ${stage.canonicalOutput}`,
    "",
    "## Non-negotiable authority boundaries",
    "- Treat the active Universal Constitution and machine-readable contract as source-of-truth.",
    "- Do not weaken or delete a Universal pillar to make a project pass.",
    "- Do not manufacture Quality Gate PASS or evidence.",
    "- AI may analyze, draft, compare and propose; AI cannot ratify or publish the Constitution.",
    "- Human ratification must be an authenticated, append-only canonical action.",
    "- Publication is permitted only after ratification and exact evidence for the versioned authority set.",
    "- Project authority, Constitutional authority and Production authority are separate.",
    "- Production release authority remains false.",
    "",
    "## Required response structure",
    "1. Facts and exact source revisions used.",
    "2. Proposed changes or findings for this stage.",
    "3. Compatibility and security consequences.",
    "4. Required migrations and affected projects.",
    "5. Evidence required before the next stage.",
    "6. Open blockers and decisions requiring human authority.",
    "7. Explicit statement of what this stage is NOT authorized to do."
  ];

  return Object.freeze({
    stage: stageId,
    templateVersion: CONSTITUTION_AUTHORITY_PROMPT_VERSION,
    sourceDigest,
    content: `${lines.join("\n")}\n`,
    mayMutateCanonicalConstitution: false,
    mayRatify: false,
    productionReleaseAuthority: false
  });
}



const authoritySetComponentIds = Object.freeze([
  "normative-document",
  "machine-contract",
  "universal-template",
  "policy-version"
] as const);

const authoritySetPaths: Readonly<Record<
  (typeof authoritySetComponentIds)[number],
  string
>> = Object.freeze({
  "normative-document": "docs/UNIVERSAL-CONSTITUTION.md",
  "machine-contract": "control/universal-constitution.contract.json",
  "universal-template": "packages/application/src/foundation-templates.ts",
  "policy-version": "packages/application/src/constitution-authority.ts"
});

export interface ConstitutionPublicationAttestationVerifier {
  readonly id: string;
  verify(
    attestation: ConstitutionAuthoritySetAttestation
  ): Promise<boolean>;
}

export interface ConstitutionPublicationSubmission {
  readonly amendmentId: string;
  readonly expectedRecordVersion: number;
  readonly attestation: ConstitutionAuthoritySetAttestation;
  readonly note: string;
}

export interface ConstitutionPublicationResult {
  readonly amendment: CanonicalConstitutionAmendmentRecord;
  readonly publication: ConstitutionPublicationRecord;
}

function sha256Value(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function stableAuthorityValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableAuthorityValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stableAuthorityValue(child)])
    );
  }
  return value;
}

export function validateConstitutionAuthoritySetAttestation(
  attestation: ConstitutionAuthoritySetAttestation
): ConstitutionAuthoritySetAttestation {
  if (attestation.schemaVersion !== "1.0.0") {
    throw new TypeError("Constitution authority-set schemaVersion must be 1.0.0");
  }
  if (attestation.source !== "trusted-ci-attestation") {
    throw new TypeError(
      "Constitution publication requires a trusted CI attestation source"
    );
  }
  if (attestation.policyId !== CONSTITUTION_POLICY_ID) {
    throw new TypeError(
      `Constitution authority-set policyId must be ${CONSTITUTION_POLICY_ID}`
    );
  }
  semver(attestation.policyVersion, "attestation.policyVersion");
  if (!/^[a-f0-9]{40}$/.test(nonEmpty(attestation.sourceRevision, "sourceRevision"))) {
    throw new TypeError("sourceRevision must be an exact 40-character Git commit SHA");
  }
  if (!/^\d+$/.test(nonEmpty(attestation.ciRunId, "ciRunId"))) {
    throw new TypeError("ciRunId must be a numeric trusted CI run identifier");
  }
  if (attestation.productionReleaseAuthority !== false) {
    throw new TypeError(
      "Constitution authority-set attestation must never grant Production authority"
    );
  }

  if (attestation.components.length !== authoritySetComponentIds.length) {
    throw new TypeError(
      "Constitution authority-set must contain exactly four canonical components"
    );
  }

  const seen = new Set<string>();
  const components = attestation.components
    .map((component): ConstitutionAuthoritySetComponent => {
      if (!authoritySetComponentIds.includes(component.id)) {
        throw new TypeError(
          `Unknown Constitution authority-set component ${component.id}`
        );
      }
      if (seen.has(component.id)) {
        throw new TypeError(
          `Duplicate Constitution authority-set component ${component.id}`
        );
      }
      seen.add(component.id);

      if (component.path !== authoritySetPaths[component.id]) {
        throw new TypeError(
          `Constitution authority-set component ${component.id} has an unexpected canonical path`
        );
      }
      if (component.version !== attestation.policyVersion) {
        throw new TypeError(
          `Constitution authority-set component ${component.id} version drift`
        );
      }
      sha256Digest(component.digest);
      return Object.freeze({ ...component });
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const id of authoritySetComponentIds) {
    if (!seen.has(id)) {
      throw new TypeError(
        `Constitution authority-set is missing canonical component ${id}`
      );
    }
  }

  const expectedDigest = sha256Value(
    JSON.stringify(
      stableAuthorityValue({
        policyId: attestation.policyId,
        policyVersion: attestation.policyVersion,
        components
      })
    )
  );
  if (sha256Digest(attestation.authoritySetDigest) !== expectedDigest) {
    throw new TypeError(
      "Constitution authority-set digest does not match its canonical components"
    );
  }

  return Object.freeze({
    ...attestation,
    components: Object.freeze(components),
    authoritySetDigest: expectedDigest,
    productionReleaseAuthority: false
  });
}

export interface ConstitutionPropagationAttestation {
  readonly schemaVersion: "1.0.0";
  readonly kind: "constitution-propagation-attestation";
  readonly source: "trusted-constitution-lifecycle-attestation";
  readonly policyId: string;
  readonly policyVersion: string;
  readonly amendmentId: string;
  readonly publicationId: string;
  readonly sourceRevision: string;
  readonly workflowRunId: string;
  readonly snapshotDigest: string;
  readonly totalRepositories: number;
  readonly currentRepositories: number;
  readonly migrationRequiredRepositories: number;
  readonly blockedRepositories: number;
  readonly exactReleaseRevisionCertified: false;
  readonly productionReleaseAuthority: false;
}

export interface ConstitutionVerificationAttestation {
  readonly schemaVersion: "1.0.0";
  readonly kind: "constitution-verification-attestation";
  readonly source: "trusted-constitution-lifecycle-attestation";
  readonly policyId: string;
  readonly policyVersion: string;
  readonly amendmentId: string;
  readonly publicationId: string;
  readonly sourceRevision: string;
  readonly workflowRunId: string;
  readonly matrixDigest: string;
  readonly totalRepositories: number;
  readonly compliantRepositories: number;
  readonly nonCompliantRepositories: number;
  readonly unverifiedRepositories: number;
  readonly migrationRequiredRepositories: number;
  readonly blockedRepositories: number;
  readonly exactReleaseRevisionCertified: false;
  readonly productionReleaseAuthority: false;
}

export interface ConstitutionLifecycleAttestationVerifier {
  readonly id: string;
  verifyPropagation(
    attestation: ConstitutionPropagationAttestation
  ): Promise<boolean>;
  verifyVerification(
    attestation: ConstitutionVerificationAttestation
  ): Promise<boolean>;
}

export interface ConstitutionPropagationSubmission {
  readonly amendmentId: string;
  readonly expectedRecordVersion: number;
  readonly attestation: ConstitutionPropagationAttestation;
  readonly note: string;
}

export interface ConstitutionVerificationSubmission {
  readonly amendmentId: string;
  readonly expectedRecordVersion: number;
  readonly attestation: ConstitutionVerificationAttestation;
  readonly note: string;
}

export interface ConstitutionAmendmentDraftInput {
  readonly targetPolicyVersion: string;
  readonly title: string;
  readonly problem: string;
  readonly rationale: string;
  readonly affectedPillarIds: readonly string[];
  readonly affectedRequirementIds: readonly string[];
  readonly compatibilityRisk: ConstitutionAmendmentProposal["compatibilityRisk"];
  readonly migrationRequired: boolean;
}

export interface ConstitutionStageEvidenceInput {
  readonly amendmentId: string;
  readonly expectedRecordVersion: number;
  readonly kind: Extract<ConstitutionEvidenceKind, "impact" | "migration">;
  readonly source: string;
  readonly revision: string;
  readonly digest: string;
  readonly note: string;
}

export interface ConstitutionRatificationSubmission {
  readonly amendmentId: string;
  readonly expectedRecordVersion: number;
  readonly decision: ConstitutionRatificationDecisionKind;
  readonly note: string;
}

export interface ConstitutionAmendmentWorkspace {
  readonly amendment: CanonicalConstitutionAmendmentRecord;
  readonly evidence: readonly ConstitutionEvidenceRecord[];
  readonly ratificationDecision: ConstitutionRatificationDecisionRecord | null;
}

function nonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function semver(value: string, label: string): string {
  const normalized = nonEmpty(value, label);
  if (!/^\d+\.\d+\.\d+$/.test(normalized)) {
    throw new TypeError(`${label} must use major.minor.patch semantic versioning`);
  }
  return normalized;
}

function requireIsoTimestamp(value: string): string {
  const normalized = nonEmpty(value, "timestamp");
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== normalized) {
    throw new TypeError("timestamp must be an exact ISO-8601 UTC timestamp");
  }
  return normalized;
}

const compatibilityRisks = new Set([
  "low",
  "medium",
  "high",
  "critical"
] as const);

function compatibilityRisk(
  value: ConstitutionAmendmentProposal["compatibilityRisk"]
): ConstitutionAmendmentProposal["compatibilityRisk"] {
  if (!compatibilityRisks.has(value)) {
    throw new TypeError("compatibilityRisk must be low, medium, high, or critical");
  }
  return value;
}

function compareSemver(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const delta = left[index]! - right[index]!;
    if (delta !== 0) return delta;
  }
  return 0;
}

function uniqueStrings(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string")) {
    throw new TypeError(`${label} must be a string array`);
  }
  return Object.freeze(
    [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort()
  );
}

function sha256Digest(value: string): string {
  const normalized = nonEmpty(value, "digest").toLowerCase();
  if (!/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    throw new TypeError("digest must be sha256:<64 lowercase hex characters>");
  }
  return normalized;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
  return value;
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${label} must be a positive integer`);
  }
  return value;
}

function validateLifecycleIdentity(input: {
  readonly schemaVersion: string;
  readonly source: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly amendmentId: string;
  readonly publicationId: string;
  readonly sourceRevision: string;
  readonly workflowRunId: string;
  readonly exactReleaseRevisionCertified: boolean;
  readonly productionReleaseAuthority: boolean;
}): void {
  if (input.schemaVersion !== "1.0.0") {
    throw new TypeError("Constitution lifecycle attestation schemaVersion must be 1.0.0");
  }
  if (input.source !== "trusted-constitution-lifecycle-attestation") {
    throw new TypeError("Constitution lifecycle attestation source is not trusted");
  }
  if (input.policyId !== CONSTITUTION_POLICY_ID) {
    throw new TypeError(
      `Constitution lifecycle policyId must be ${CONSTITUTION_POLICY_ID}`
    );
  }
  semver(input.policyVersion, "attestation.policyVersion");
  nonEmpty(input.amendmentId, "attestation.amendmentId");
  nonEmpty(input.publicationId, "attestation.publicationId");
  if (!/^[a-f0-9]{40}$/.test(nonEmpty(input.sourceRevision, "sourceRevision"))) {
    throw new TypeError("sourceRevision must be an exact 40-character Git commit SHA");
  }
  if (!/^\d+$/.test(nonEmpty(input.workflowRunId, "workflowRunId"))) {
    throw new TypeError("workflowRunId must be a numeric trusted CI run identifier");
  }
  if (input.exactReleaseRevisionCertified !== false) {
    throw new TypeError(
      "Constitution lifecycle evidence cannot certify the final Production release revision"
    );
  }
  if (input.productionReleaseAuthority !== false) {
    throw new TypeError(
      "Constitution lifecycle evidence must never grant Production authority"
    );
  }
}

export function validateConstitutionPropagationAttestation(
  attestation: ConstitutionPropagationAttestation
): ConstitutionPropagationAttestation {
  validateLifecycleIdentity(attestation);
  if (attestation.kind !== "constitution-propagation-attestation") {
    throw new TypeError("Constitution propagation attestation kind is invalid");
  }
  const totalRepositories = positiveInteger(
    attestation.totalRepositories,
    "totalRepositories"
  );
  const currentRepositories = nonNegativeInteger(
    attestation.currentRepositories,
    "currentRepositories"
  );
  const migrationRequiredRepositories = nonNegativeInteger(
    attestation.migrationRequiredRepositories,
    "migrationRequiredRepositories"
  );
  const blockedRepositories = nonNegativeInteger(
    attestation.blockedRepositories,
    "blockedRepositories"
  );
  if (
    currentRepositories +
      migrationRequiredRepositories +
      blockedRepositories !==
    totalRepositories
  ) {
    throw new TypeError(
      "Constitution propagation counts must partition all governed repositories"
    );
  }

  return Object.freeze({
    ...attestation,
    snapshotDigest: sha256Digest(attestation.snapshotDigest),
    totalRepositories,
    currentRepositories,
    migrationRequiredRepositories,
    blockedRepositories,
    exactReleaseRevisionCertified: false,
    productionReleaseAuthority: false
  });
}

export function validateConstitutionVerificationAttestation(
  attestation: ConstitutionVerificationAttestation
): ConstitutionVerificationAttestation {
  validateLifecycleIdentity(attestation);
  if (attestation.kind !== "constitution-verification-attestation") {
    throw new TypeError("Constitution verification attestation kind is invalid");
  }
  const totalRepositories = positiveInteger(
    attestation.totalRepositories,
    "totalRepositories"
  );
  const compliantRepositories = nonNegativeInteger(
    attestation.compliantRepositories,
    "compliantRepositories"
  );
  const nonCompliantRepositories = nonNegativeInteger(
    attestation.nonCompliantRepositories,
    "nonCompliantRepositories"
  );
  const unverifiedRepositories = nonNegativeInteger(
    attestation.unverifiedRepositories,
    "unverifiedRepositories"
  );
  const migrationRequiredRepositories = nonNegativeInteger(
    attestation.migrationRequiredRepositories,
    "migrationRequiredRepositories"
  );
  const blockedRepositories = nonNegativeInteger(
    attestation.blockedRepositories,
    "blockedRepositories"
  );
  if (
    compliantRepositories +
      nonCompliantRepositories +
      unverifiedRepositories +
      migrationRequiredRepositories +
      blockedRepositories !==
    totalRepositories
  ) {
    throw new TypeError(
      "Constitution verification counts must partition all governed repositories"
    );
  }

  return Object.freeze({
    ...attestation,
    matrixDigest: sha256Digest(attestation.matrixDigest),
    totalRepositories,
    compliantRepositories,
    nonCompliantRepositories,
    unverifiedRepositories,
    migrationRequiredRepositories,
    blockedRepositories,
    exactReleaseRevisionCertified: false,
    productionReleaseAuthority: false
  });
}

function canonicalNext(
  current: CanonicalConstitutionAmendmentRecord,
  next: ConstitutionAmendmentRecord,
  now: string
): CanonicalConstitutionAmendmentRecord {
  return Object.freeze({
    ...next,
    proposedByActorId: current.proposedByActorId,
    recordVersion: current.recordVersion + 1,
    createdAt: current.createdAt,
    updatedAt: now
  });
}

export class ConstitutionAuthorityApplicationService {
  constructor(
    private readonly repository: ConstitutionAuthorityRepository,
    private readonly authority: AuthorityService,
    private readonly publicationAttestationVerifier?: ConstitutionPublicationAttestationVerifier,
    private readonly lifecycleAttestationVerifier?: ConstitutionLifecycleAttestationVerifier
  ) {}

  async list(
    actor: AuthenticatedActor | null
  ): Promise<readonly CanonicalConstitutionAmendmentRecord[]> {
    await this.authority.requireConstitutionalAuthority(actor);
    return this.repository.listAmendments();
  }

  async read(
    actor: AuthenticatedActor | null,
    amendmentId: string
  ): Promise<ConstitutionAmendmentWorkspace | null> {
    await this.authority.requireConstitutionalAuthority(actor);
    const amendment = await this.repository.findAmendmentById(
      nonEmpty(amendmentId, "amendmentId")
    );
    if (!amendment) return null;

    const evidence = await this.repository.listEvidence(amendment.proposal.id);
    const ratificationDecision = amendment.ratificationDecisionId
      ? await this.repository.findRatificationDecisionById(
          amendment.ratificationDecisionId
        )
      : null;

    return Object.freeze({
      amendment,
      evidence,
      ratificationDecision
    });
  }

  async createDraft(
    actor: AuthenticatedActor | null,
    input: ConstitutionAmendmentDraftInput,
    now: string
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    await this.authority.requireConstitutionalAuthority(actor);
    const timestamp = requireIsoTimestamp(now);
    const targetPolicyVersion = semver(
      input.targetPolicyVersion,
      "targetPolicyVersion"
    );
    const basePolicyVersion = semver(
      CONSTITUTION_POLICY_VERSION,
      "basePolicyVersion"
    );
    if (compareSemver(targetPolicyVersion, basePolicyVersion) <= 0) {
      throw new TypeError(
        "targetPolicyVersion must be greater than the active Constitution version"
      );
    }

    const proposal: CanonicalConstitutionAmendmentRecord["proposal"] =
      Object.freeze({
        id: `amendment:${randomUUID()}`,
        basePolicyVersion,
        targetPolicyVersion,
        title: nonEmpty(input.title, "title"),
        problem: nonEmpty(input.problem, "problem"),
        rationale: nonEmpty(input.rationale, "rationale"),
        affectedPillarIds: uniqueStrings(
          input.affectedPillarIds,
          "affectedPillarIds"
        ),
        affectedRequirementIds: uniqueStrings(
          input.affectedRequirementIds,
          "affectedRequirementIds"
        ),
        compatibilityRisk: compatibilityRisk(input.compatibilityRisk),
        migrationRequired: input.migrationRequired,
        proposedAt: timestamp
      });

    if (proposal.affectedPillarIds.length === 0) {
      throw new TypeError("At least one affected Constitutional pillar is required");
    }

    const record: CanonicalConstitutionAmendmentRecord = Object.freeze({
      proposal,
      state: "draft",
      impactEvidenceIds: Object.freeze([]),
      migrationEvidenceIds: Object.freeze([]),
      ratificationDecisionId: null,
      publicationEvidenceId: null,
      propagationEvidenceIds: Object.freeze([]),
      verificationEvidenceIds: Object.freeze([]),
      productionReleaseAuthority: false,
      proposedByActorId: actor!.principalId,
      recordVersion: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    return this.repository.createAmendment(record);
  }

  async recordStageEvidence(
    actor: AuthenticatedActor | null,
    input: ConstitutionStageEvidenceInput,
    now: string
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    await this.authority.requireConstitutionalAuthority(actor);
    const current = await this.requireExactAmendment(
      input.amendmentId,
      input.expectedRecordVersion
    );
    const timestamp = requireIsoTimestamp(now);

    const expectedKind =
      current.state === "draft"
        ? "impact"
        : current.state === "impact-reviewed"
          ? "migration"
          : null;

    if (!expectedKind || input.kind !== expectedKind) {
      throw new TypeError(
        `Constitution stage ${current.state} does not accept ${input.kind} evidence`
      );
    }

    const evidence: ConstitutionEvidenceRecord = Object.freeze({
      id: `constitution-evidence:${randomUUID()}`,
      amendmentId: current.proposal.id,
      kind: input.kind,
      source: nonEmpty(input.source, "source"),
      revision: nonEmpty(input.revision, "revision"),
      digest: sha256Digest(input.digest),
      note: nonEmpty(input.note, "note"),
      recordedByActorId: actor!.principalId,
      createdAt: timestamp
    });

    const transition = transitionConstitutionAmendment(current, {
      action:
        input.kind === "impact"
          ? "complete-impact-review"
          : "complete-migration-plan",
      evidenceIds: [evidence.id]
    });
    const next = canonicalNext(current, transition, timestamp);

    return this.repository.appendEvidenceAndUpdate(
      evidence,
      next,
      input.expectedRecordVersion,
      actor!.principalId,
      input.kind === "impact"
        ? "IMPACT_REVIEW_COMPLETED"
        : "MIGRATION_PLAN_COMPLETED"
    );
  }

  async openRatification(
    actor: AuthenticatedActor | null,
    amendmentId: string,
    expectedRecordVersion: number,
    now: string
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    await this.authority.requireConstitutionalAuthority(actor);
    const current = await this.requireExactAmendment(
      amendmentId,
      expectedRecordVersion
    );
    const transition = transitionConstitutionAmendment(current, {
      action: "open-ratification"
    });
    const next = canonicalNext(current, transition, requireIsoTimestamp(now));
    return this.repository.updateAmendment(
      next,
      expectedRecordVersion,
      actor!.principalId,
      "RATIFICATION_OPENED"
    );
  }

  async ratify(
    actor: AuthenticatedActor | null,
    input: ConstitutionRatificationSubmission,
    now: string
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    await this.authority.requireConstitutionalAuthority(actor);
    const current = await this.requireExactAmendment(
      input.amendmentId,
      input.expectedRecordVersion
    );
    if (current.state !== "ratification-ready") {
      throw new TypeError(
        "Constitution amendment must be ratification-ready before a human decision"
      );
    }

    const timestamp = requireIsoTimestamp(now);
    const decisionId = `constitution-ratification:${randomUUID()}`;
    const note = nonEmpty(input.note, "ratification note");
    const decision: ConstitutionRatificationDecisionRecord = Object.freeze({
      id: decisionId,
      amendmentId: current.proposal.id,
      amendmentRecordVersion: current.recordVersion,
      reviewerActorId: actor!.principalId,
      source: "authenticated-user-action",
      decision: input.decision,
      note,
      decidedAt: timestamp,
      humanRatification: true,
      productionReleaseAuthority: false
    });

    const transition = transitionConstitutionAmendment(current, {
      action: input.decision === "approve" ? "ratify" : "reject",
      humanRatificationDecisionId: decisionId
    });
    const next = canonicalNext(current, transition, timestamp);

    return this.repository.appendRatificationDecisionAndUpdate(
      decision,
      next,
      input.expectedRecordVersion
    );
  }


  async publishFromTrustedAttestation(
    actor: AuthenticatedActor | null,
    input: ConstitutionPublicationSubmission,
    now: string
  ): Promise<ConstitutionPublicationResult> {
    await this.authority.requireConstitutionalAuthority(actor);
    if (!this.publicationAttestationVerifier) {
      throw new TypeError(
        "Constitution publication is blocked until a trusted attestation verifier is configured"
      );
    }

    const current = await this.requireExactAmendment(
      input.amendmentId,
      input.expectedRecordVersion
    );
    if (current.state !== "ratified" || !current.ratificationDecisionId) {
      throw new TypeError(
        "Constitution publication requires an exact human-ratified amendment"
      );
    }

    const ratificationDecision =
      await this.repository.findRatificationDecisionById(
        current.ratificationDecisionId
      );
    if (
      !ratificationDecision ||
      ratificationDecision.decision !== "approve" ||
      ratificationDecision.humanRatification !== true ||
      ratificationDecision.productionReleaseAuthority !== false
    ) {
      throw new TypeError(
        "Constitution publication requires a valid human approval record"
      );
    }

    const attestation = validateConstitutionAuthoritySetAttestation(
      input.attestation
    );
    if (attestation.policyVersion !== current.proposal.targetPolicyVersion) {
      throw new TypeError(
        "Constitution authority-set policy version does not match the ratified amendment target"
      );
    }
    if (
      !(await this.publicationAttestationVerifier.verify(attestation))
    ) {
      throw new TypeError(
        `Constitution authority-set attestation was not verified by ${this.publicationAttestationVerifier.id}`
      );
    }

    const timestamp = requireIsoTimestamp(now);
    const note = nonEmpty(input.note, "publication note");
    const evidence: ConstitutionEvidenceRecord = Object.freeze({
      id: `constitution-evidence:${randomUUID()}`,
      amendmentId: current.proposal.id,
      kind: "publication",
      source: `trusted-ci-attestation:${attestation.ciRunId}`,
      revision: attestation.sourceRevision,
      digest: attestation.authoritySetDigest,
      note,
      recordedByActorId: actor!.principalId,
      createdAt: timestamp
    });

    const publication: ConstitutionPublicationRecord = Object.freeze({
      id: `constitution-publication:${randomUUID()}`,
      amendmentId: current.proposal.id,
      amendmentRecordVersion: current.recordVersion,
      policyVersion: attestation.policyVersion,
      publishedByActorId: actor!.principalId,
      sourceRevision: attestation.sourceRevision,
      ciRunId: attestation.ciRunId,
      authoritySetDigest: attestation.authoritySetDigest,
      components: attestation.components,
      publishedAt: timestamp,
      productionReleaseAuthority: false
    });

    const transition = transitionConstitutionAmendment(current, {
      action: "publish",
      evidenceIds: [evidence.id]
    });
    const next = canonicalNext(current, transition, timestamp);

    const amendment = await this.repository.appendPublicationAndUpdate(
      publication,
      evidence,
      next,
      input.expectedRecordVersion
    );

    return Object.freeze({ amendment, publication });
  }

  async beginPropagationFromTrustedAttestation(
    actor: AuthenticatedActor | null,
    input: ConstitutionPropagationSubmission,
    now: string
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    await this.authority.requireConstitutionalAuthority(actor);
    if (!this.lifecycleAttestationVerifier) {
      throw new TypeError(
        "Constitution propagation is blocked until a trusted lifecycle attestation verifier is configured"
      );
    }

    const current = await this.requireExactAmendment(
      input.amendmentId,
      input.expectedRecordVersion
    );
    if (current.state !== "published" || !current.publicationEvidenceId) {
      throw new TypeError(
        "Constitution propagation requires an exactly published amendment"
      );
    }

    const publication = await this.repository.findPublicationByAmendmentId(
      current.proposal.id
    );
    if (!publication) {
      throw new TypeError(
        "Constitution propagation requires the canonical publication record"
      );
    }

    const attestation = validateConstitutionPropagationAttestation(
      input.attestation
    );
    if (
      attestation.amendmentId !== current.proposal.id ||
      attestation.publicationId !== publication.id ||
      attestation.policyVersion !== current.proposal.targetPolicyVersion ||
      attestation.policyVersion !== publication.policyVersion
    ) {
      throw new TypeError(
        "Constitution propagation attestation does not match the exact published amendment"
      );
    }
    if (!(await this.lifecycleAttestationVerifier.verifyPropagation(attestation))) {
      throw new TypeError(
        `Constitution propagation attestation was not verified by ${this.lifecycleAttestationVerifier.id}`
      );
    }

    const timestamp = requireIsoTimestamp(now);
    const evidence: ConstitutionEvidenceRecord = Object.freeze({
      id: `constitution-evidence:${randomUUID()}`,
      amendmentId: current.proposal.id,
      kind: "propagation",
      source: `trusted-constitution-propagation:${attestation.workflowRunId}`,
      revision: attestation.sourceRevision,
      digest: attestation.snapshotDigest,
      note: nonEmpty(input.note, "propagation note"),
      recordedByActorId: actor!.principalId,
      createdAt: timestamp
    });

    const transition = transitionConstitutionAmendment(current, {
      action: "begin-propagation",
      evidenceIds: [evidence.id]
    });
    const next = canonicalNext(current, transition, timestamp);

    return this.repository.appendEvidenceAndUpdate(
      evidence,
      next,
      input.expectedRecordVersion,
      actor!.principalId,
      "CONSTITUTION_PROPAGATION_STARTED"
    );
  }

  async verifyFromTrustedAttestation(
    actor: AuthenticatedActor | null,
    input: ConstitutionVerificationSubmission,
    now: string
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    await this.authority.requireConstitutionalAuthority(actor);
    if (!this.lifecycleAttestationVerifier) {
      throw new TypeError(
        "Constitution verification is blocked until a trusted lifecycle attestation verifier is configured"
      );
    }

    const current = await this.requireExactAmendment(
      input.amendmentId,
      input.expectedRecordVersion
    );
    if (current.state !== "propagating" || current.propagationEvidenceIds.length === 0) {
      throw new TypeError(
        "Constitution verification requires an evidence-backed propagation state"
      );
    }

    const publication = await this.repository.findPublicationByAmendmentId(
      current.proposal.id
    );
    if (!publication) {
      throw new TypeError(
        "Constitution verification requires the canonical publication record"
      );
    }

    const attestation = validateConstitutionVerificationAttestation(
      input.attestation
    );
    if (
      attestation.amendmentId !== current.proposal.id ||
      attestation.publicationId !== publication.id ||
      attestation.policyVersion !== current.proposal.targetPolicyVersion ||
      attestation.policyVersion !== publication.policyVersion
    ) {
      throw new TypeError(
        "Constitution verification attestation does not match the exact published amendment"
      );
    }
    if (
      attestation.compliantRepositories !== attestation.totalRepositories ||
      attestation.nonCompliantRepositories !== 0 ||
      attestation.unverifiedRepositories !== 0 ||
      attestation.migrationRequiredRepositories !== 0 ||
      attestation.blockedRepositories !== 0
    ) {
      throw new TypeError(
        "Constitution verification requires every governed repository to be compliance-attested with no blockers"
      );
    }
    if (!(await this.lifecycleAttestationVerifier.verifyVerification(attestation))) {
      throw new TypeError(
        `Constitution verification attestation was not verified by ${this.lifecycleAttestationVerifier.id}`
      );
    }

    const timestamp = requireIsoTimestamp(now);
    const evidence: ConstitutionEvidenceRecord = Object.freeze({
      id: `constitution-evidence:${randomUUID()}`,
      amendmentId: current.proposal.id,
      kind: "verification",
      source: `trusted-constitution-verification:${attestation.workflowRunId}`,
      revision: attestation.sourceRevision,
      digest: attestation.matrixDigest,
      note: nonEmpty(input.note, "verification note"),
      recordedByActorId: actor!.principalId,
      createdAt: timestamp
    });

    const transition = transitionConstitutionAmendment(current, {
      action: "verify",
      evidenceIds: [evidence.id]
    });
    const next = canonicalNext(current, transition, timestamp);

    return this.repository.appendEvidenceAndUpdate(
      evidence,
      next,
      input.expectedRecordVersion,
      actor!.principalId,
      "CONSTITUTION_VERIFIED"
    );
  }

  private async requireExactAmendment(
    amendmentId: string,
    expectedRecordVersion: number
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    const current = await this.repository.findAmendmentById(
      nonEmpty(amendmentId, "amendmentId")
    );
    if (!current) {
      throw new TypeError(`Unknown Constitution amendment ${amendmentId}`);
    }
    if (current.recordVersion !== expectedRecordVersion) {
      throw new TypeError(
        `Constitution amendment is stale: expected recordVersion ${expectedRecordVersion}, current is ${current.recordVersion}`
      );
    }
    return current;
  }
}
