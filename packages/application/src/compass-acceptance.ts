import type { HumanProfessionalReviewDecisionRecord } from "@blueprint-os/core";
import type { QualityGateEvidenceBundle } from "@blueprint-os/core";

import {
  p9019ProfessionalReviewCandidate,
  type HumanProfessionalReviewCandidate
} from "./professional-review";
import type { ConstitutionalComplianceAudit } from "./constitutional-compliance";

export type CompassAcceptanceCriterionState =
  | "pass"
  | "blocked"
  | "pending-final-evidence";

export interface CompassAcceptanceCriterion {
  readonly id: string;
  readonly label: string;
  readonly state: CompassAcceptanceCriterionState;
  readonly detail: string;
}

export interface CompassAcceptancePreflight {
  readonly kind: "compass-acceptance-preflight";
  readonly projectId: "project:blueprint-os";
  readonly workPackageId: "P9-020";
  readonly state: "locked" | "ready-for-final-evidence";
  readonly criteria: readonly CompassAcceptanceCriterion[];
  readonly blockers: readonly string[];
  readonly productionReleaseAuthority: false;
  readonly acceptanceRecorded: false;
  readonly requiresFinalReleaseGate: true;
  readonly boundaryNote: string;
}

function criterion(
  id: string,
  label: string,
  state: CompassAcceptanceCriterionState,
  detail: string
): CompassAcceptanceCriterion {
  return Object.freeze({ id, label, state, detail });
}

export function buildCompassAcceptancePreflight(input?: {
  readonly reviewCandidate?: HumanProfessionalReviewCandidate;
  readonly reviewDecision?: HumanProfessionalReviewDecisionRecord | null;
  readonly constitutionAudit?: ConstitutionalComplianceAudit | null;
}): CompassAcceptancePreflight {
  const candidate = input?.reviewCandidate ?? p9019ProfessionalReviewCandidate;
  const decision = input?.reviewDecision ?? null;
  const constitutionAudit = input?.constitutionAudit ?? null;

  const exactDecision =
    decision !== null &&
    decision.candidateReviewedRevision === candidate.reviewedRevision &&
    decision.candidateEvidenceDigest === candidate.evidenceArtifact.digest;

  const humanApproval =
    exactDecision &&
    decision.decision === "approve" &&
    decision.humanSignoff === true &&
    decision.p9020TransitionAllowed === true &&
    decision.productionReleaseAuthority === false;

  const blockingSevereFinding = candidate.findings.some(
    (finding) =>
      finding.blocking &&
      (finding.severity === "P0" || finding.severity === "P1")
  );

  const constitutionCompliant =
    constitutionAudit?.projectId === candidate.projectId &&
    constitutionAudit.state === "compliant" &&
    constitutionAudit.productionReleaseAuthority === false &&
    constitutionAudit.exactReleaseRevisionCertified === false;

  const blockers: string[] = [];
  if (!constitutionCompliant) {
    blockers.push("universal-constitution-non-compliant");
  }
  if (!humanApproval) {
    blockers.push("p9-019-human-signoff-required");
  }
  if (blockingSevereFinding) {
    blockers.push("unresolved-p0-p1-finding");
  }

  const unlocked =
    constitutionCompliant && humanApproval && !blockingSevereFinding;

  return Object.freeze({
    kind: "compass-acceptance-preflight",
    projectId: candidate.projectId,
    workPackageId: "P9-020",
    state: unlocked ? "ready-for-final-evidence" : "locked",
    criteria: Object.freeze([
      criterion(
        "universal-constitution",
        "Universal Constitution compliance",
        constitutionCompliant ? "pass" : "blocked",
        constitutionCompliant
          ? "All Universal Constitution gates are canonically present, PASS and evidence-backed. Exact final release revision certification remains separate."
          : "Blueprint OS has not yet proved canonical PASS evidence for every Universal Constitution gate."
      ),
      criterion(
        "lower-dependencies",
        "All lower dependencies complete",
        humanApproval ? "pass" : "blocked",
        humanApproval
          ? "P9-019 has an authenticated approval bound to the exact current candidate."
          : "P9-019 remains incomplete until an authenticated human approval is recorded for the exact current candidate."
      ),
      criterion(
        "p0-p1",
        "No unresolved P0/P1 finding",
        blockingSevereFinding ? "blocked" : "pass",
        blockingSevereFinding
          ? "At least one blocking P0/P1 finding remains open."
          : "The current P9-019 candidate records no blocking P0/P1 finding."
      ),
      criterion(
        "exact-review-evidence",
        "Professional review bound to exact evidence",
        exactDecision ? "pass" : "blocked",
        exactDecision
          ? "The recorded review decision matches the candidate revision and evidence digest."
          : "No recorded human decision is bound to the exact current review revision and evidence digest."
      ),
      criterion(
        "source-of-truth",
        "No source-of-truth contradiction",
        unlocked ? "pending-final-evidence" : "blocked",
        unlocked
          ? "Re-run the contradiction gate on the final P9-020 revision before acceptance."
          : "Final source-of-truth evaluation remains dependency-gated until P9-019 approval."
      ),
      criterion(
        "authority",
        "No authority leakage",
        decision?.productionReleaseAuthority === false || decision === null
          ? "pass"
          : "blocked",
        "Human review and P9-020 preflight grant zero Production release authority."
      ),
      criterion(
        "final-release-gate",
        "Exact-revision full Release Gate",
        unlocked ? "pending-final-evidence" : "blocked",
        unlocked
          ? "A final full Release Gate must PASS on the exact P9-020 acceptance revision."
          : "Final Release Gate acceptance evidence is not valid before lower dependencies unlock P9-020."
      ),
      criterion(
        "production-truth",
        "No false Production claim",
        "pass",
        "P9-020 acceptance and Production deployment remain separate. This preflight cannot deploy or authorize Production."
      )
    ]),
    blockers: Object.freeze(blockers),
    productionReleaseAuthority: false,
    acceptanceRecorded: false,
    requiresFinalReleaseGate: true,
    boundaryNote:
      "This is a preflight only. It may show when P9-020 is dependency-valid, but it cannot record acceptance, PASS a Quality Gate, authorize Production or execute deployment."
  });
}

export const compassAcceptanceGateId = (revision: string): string =>
  `gate:compass:p9-020:${revision}`;

export interface VerifiedFinalReleaseGate {
  readonly revision: string;
  readonly runId: number;
  readonly artifactId: number;
  readonly artifactDigest: string;
  readonly runUrl: string;
}

export function verifyFinalReleaseGateMetadata(input: {
  readonly revision: string;
  readonly run: {
    readonly id: number;
    readonly head_sha: string;
    readonly status: string;
    readonly conclusion: string | null;
    readonly path: string;
    readonly event: string;
    readonly html_url: string;
  };
  readonly jobs: readonly {
    readonly name: string;
    readonly conclusion: string | null;
    readonly steps?: readonly { readonly name: string; readonly conclusion: string | null }[];
  }[];
  readonly artifacts: readonly {
    readonly id: number;
    readonly name: string;
    readonly digest: string | null;
    readonly expired: boolean;
  }[];
}): VerifiedFinalReleaseGate {
  const { revision, run } = input;
  if (!/^[a-f0-9]{40}$/.test(revision) ||
      run.head_sha !== revision ||
      run.status !== "completed" ||
      run.conclusion !== "success" ||
      run.event !== "workflow_dispatch" ||
      !(run.path === ".github/workflows/release-gate.yml" ||
        run.path.endsWith("/.github/workflows/release-gate.yml")) ||
      run.html_url !== `https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/${run.id}`) {
    throw new Error("Final Release Gate did not PASS on the exact deployment revision.");
  }

  const job = input.jobs.find((item) => item.name === "release-gate" && item.conclusion === "success");
  const requiredSteps = [
    "Universal Constitution compliance",
    "Constitution authority-set atomicity",
    "Source-of-truth contradiction gate",
    "Unit, contract, authority, and PostgreSQL integration tests",
    "Production build",
    "App Shell E2E + screenshots",
    "Generate Release Gate evidence manifest"
  ];
  if (!job || requiredSteps.some((name) =>
    !job.steps?.some((step) => step.name === name && step.conclusion === "success")
  )) {
    throw new Error("Final Release Gate is missing a required successful audit step.");
  }

  const artifact = input.artifacts.find((item) =>
    item.name === `release-gate-evidence-${revision}` &&
    !item.expired &&
    /^sha256:[a-f0-9]{64}$/.test(item.digest ?? "")
  );
  if (!artifact) {
    throw new Error("Exact-revision Release Gate evidence artifact is unavailable.");
  }
  return Object.freeze({
    revision,
    runId: run.id,
    artifactId: artifact.id,
    artifactDigest: artifact.digest!,
    runUrl: run.html_url
  });
}

export function compassAcceptanceReceipt(input: {
  readonly revision: string;
  readonly gateBundles: readonly QualityGateEvidenceBundle[];
}): { readonly accepted: boolean; readonly evidenceSource: string | null } {
  const gateId = compassAcceptanceGateId(input.revision);
  const bundle = input.gateBundles.find((item) => item.gate.id === gateId);
  if (!bundle || bundle.gate.projectId !== "project:blueprint-os" || bundle.gate.status !== "pass") {
    return { accepted: false, evidenceSource: null };
  }
  const evidence = bundle.evidence.find((item) =>
    bundle.gate.evidenceIds.includes(item.id) &&
    item.gateId === gateId && item.kind === "artifact" &&
    item.revision === input.revision &&
    /^https:\/\/github\.com\/BlueDragon33\/Software-Blueprint-Hub\/actions\/runs\/\d+\/artifacts\/\d+#sha256:[a-f0-9]{64}$/.test(item.source)
  );
  return { accepted: Boolean(evidence), evidenceSource: evidence?.source ?? null };
}
