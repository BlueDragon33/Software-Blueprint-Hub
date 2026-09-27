import { createHash } from "node:crypto";

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
