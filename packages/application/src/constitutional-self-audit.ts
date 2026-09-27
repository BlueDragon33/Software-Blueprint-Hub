import type { HumanProfessionalReviewDecisionRecord } from "@blueprint-os/core";

import {
  p9019ProfessionalReviewCandidate,
  type HumanProfessionalReviewCandidate
} from "./professional-review";

export type ConstitutionalPillarId =
  | "structural-capacity"
  | "architectural-longevity"
  | "product-elegance"
  | "premium-usability"
  | "long-term-durability"
  | "fortress-security-disaster-resilience";

export type ConstitutionalPillarAuditState =
  | "historical-evidence"
  | "human-review-required"
  | "final-evidence-required";

export interface ConstitutionalEvidenceReference {
  readonly label: string;
  readonly source: string;
  readonly revision: string;
  readonly kind:
    | "architecture"
    | "quality"
    | "ux"
    | "durability"
    | "security"
    | "resilience";
}

export interface ConstitutionalPillarAudit {
  readonly id: ConstitutionalPillarId;
  readonly label: string;
  readonly state: ConstitutionalPillarAuditState;
  readonly requiredGateIds: readonly string[];
  readonly evidence: readonly ConstitutionalEvidenceReference[];
  readonly blockers: readonly string[];
  readonly detail: string;
}

export interface BlueprintOsConstitutionAudit {
  readonly kind: "blueprint-os-constitutional-self-audit";
  readonly projectId: "project:blueprint-os";
  readonly policyId: "blueprint-os:universal-century-grade";
  readonly policyVersion: "1.1.0";
  readonly blueprintLevel: "B4";
  readonly state: "blocked" | "ready-for-final-evidence";
  readonly pillars: readonly ConstitutionalPillarAudit[];
  readonly blockers: readonly string[];
  readonly exactHumanReviewBound: boolean;
  readonly canonicalGatePassRecorded: false;
  readonly acceptanceAuthority: false;
  readonly productionReleaseAuthority: false;
  readonly requiresFinalExactRevisionEvidence: true;
  readonly boundaryNote: string;
}

function evidence(
  label: string,
  source: string,
  revision: string,
  kind: ConstitutionalEvidenceReference["kind"]
): ConstitutionalEvidenceReference {
  return Object.freeze({ label, source, revision, kind });
}

function pillar(
  id: ConstitutionalPillarId,
  label: string,
  state: ConstitutionalPillarAuditState,
  requiredGateIds: readonly string[],
  references: readonly ConstitutionalEvidenceReference[],
  blockers: readonly string[],
  detail: string
): ConstitutionalPillarAudit {
  return Object.freeze({
    id,
    label,
    state,
    requiredGateIds: Object.freeze([...requiredGateIds]),
    evidence: Object.freeze([...references]),
    blockers: Object.freeze([...blockers]),
    detail
  });
}

function exactHumanApproval(
  candidate: HumanProfessionalReviewCandidate,
  decision: HumanProfessionalReviewDecisionRecord | null
): boolean {
  return (
    decision !== null &&
    decision.decision === "approve" &&
    decision.humanSignoff === true &&
    decision.p9020TransitionAllowed === true &&
    decision.productionReleaseAuthority === false &&
    decision.candidateReviewedRevision === candidate.reviewedRevision &&
    decision.candidateEvidenceDigest === candidate.evidenceArtifact.digest
  );
}

export function buildBlueprintOsConstitutionAudit(input?: {
  readonly reviewCandidate?: HumanProfessionalReviewCandidate;
  readonly reviewDecision?: HumanProfessionalReviewDecisionRecord | null;
}): BlueprintOsConstitutionAudit {
  const candidate = input?.reviewCandidate ?? p9019ProfessionalReviewCandidate;
  const decision = input?.reviewDecision ?? null;
  const humanApproved = exactHumanApproval(candidate, decision);

  const humanBlocker = "p9-019-human-professional-review-required";
  const productState: ConstitutionalPillarAuditState = humanApproved
    ? "final-evidence-required"
    : "human-review-required";

  const pillars = Object.freeze([
    pillar(
      "structural-capacity",
      "Structural Capacity",
      "final-evidence-required",
      ["gate:architecture:future-scale"],
      [
        evidence(
          "Architecture boundary baseline",
          "projects/blueprint-os/ARCHITECTURE-V1.md",
          "architecture-v1",
          "architecture"
        ),
        evidence(
          "Performance & capacity proof",
          "projects/blueprint-os/P9-017-PERFORMANCE-CAPACITY-PROOF.md",
          "7a6fa378bb3ae970b167f742a01bebf612b97b26",
          "quality"
        )
      ],
      [],
      "The modular Core, explicit dependency direction and measured capacity evidence support future scale, but the constitutional gate still needs final exact-revision evidence before acceptance."
    ),
    pillar(
      "architectural-longevity",
      "Architectural Longevity",
      "final-evidence-required",
      ["gate:quality:evidence", "gate:platform:compatibility"],
      [
        evidence(
          "Versioned contract and compatibility baseline",
          "docs/UNIVERSAL-CONSTITUTION.v0.md",
          "policy-1.1.0",
          "architecture"
        ),
        evidence(
          "Provider/plugin replacement boundary",
          "projects/blueprint-os/P9-009-PROVIDER-PLUGIN-BOUNDARY.md",
          "565f05f198364fd10b307bb6f9989f06bb56182a",
          "architecture"
        )
      ],
      [],
      "Domain meaning is separated from providers and versioned contracts exist; final acceptance must still re-prove compatibility on the exact acceptance revision."
    ),
    pillar(
      "product-elegance",
      "Product Elegance",
      productState,
      ["gate:ux:commercial-quality", "gate:ux:human-acceptance"],
      [
        evidence(
          "Product UX gate",
          "projects/blueprint-os/P6-009-PRODUCT-UX-GATE.md",
          "phase-6-product-ux-pass",
          "ux"
        ),
        evidence(
          "Adaptive UX audit",
          "projects/blueprint-os/P9-016-ACCESSIBILITY-ADAPTIVE-UX-AUDIT.md",
          "38960d4312de41063859c0bc6544dbd3600278fb",
          "ux"
        )
      ],
      humanApproved ? [] : [humanBlocker],
      humanApproved
        ? "Historical visual and responsive evidence exists and the exact professional review is approved; final exact-revision commercial-quality evidence is still required."
        : "Automated and AI-assisted visual evidence exists, but the Constitution does not allow the product to self-approve visual quality. P9-019 human professional review remains mandatory."
    ),
    pillar(
      "premium-usability",
      "Premium Usability",
      productState,
      ["gate:ux:commercial-quality", "gate:ux:human-acceptance"],
      [
        evidence(
          "Human UX development gate",
          "projects/blueprint-os/FND-009-HUMAN-UX-REVIEW.md",
          "foundation-human-ux",
          "ux"
        ),
        evidence(
          "Current professional-review candidate",
          "projects/blueprint-os/P9-019-HUMAN-PROFESSIONAL-REVIEW.md",
          candidate.reviewedRevision,
          "ux"
        )
      ],
      humanApproved ? [] : [humanBlocker],
      humanApproved
        ? "The exact professional review is approved; P9-020 must still bind final usability evidence to the exact acceptance revision."
        : "Critical journeys have automated evidence, but premium usability remains blocked until an authenticated human signs off the exact P9-019 candidate."
    ),
    pillar(
      "long-term-durability",
      "Long-Term Durability",
      "final-evidence-required",
      ["gate:durability:ageing-regression"],
      [
        evidence(
          "Schema compatibility and migration gate",
          ".github/workflows/ci.yml",
          "release-gate-current",
          "durability"
        ),
        evidence(
          "Export / backup / restore",
          "projects/blueprint-os/P9-007-EXPORT-BACKUP-RESTORE.md",
          "6293dbb04a6ba4137a57dd887bbe35ceaa585d9c",
          "resilience"
        )
      ],
      [],
      "Migration, schema compatibility, regression and restore mechanisms exist. The ageing-regression constitutional gate still requires evidence from the final exact acceptance revision."
    ),
    pillar(
      "fortress-security-disaster-resilience",
      "Fortress Security & Disaster Resilience",
      "final-evidence-required",
      [
        "gate:security:authority",
        "gate:security:resilience-containment"
      ],
      [
        evidence(
          "Authority and security regression",
          "projects/blueprint-os/P7-006-AUTHORITY-SECURITY-REGRESSION.md",
          "phase-7-authority-security",
          "security"
        ),
        evidence(
          "Threat-model hardening",
          "projects/blueprint-os/P9-014-SECURITY-THREAT-MODEL.md",
          "0297d00599fac21956bf65dc2482cbc4cfca2d53",
          "security"
        ),
        evidence(
          "Operational diagnostics and recovery",
          "projects/blueprint-os/P9-008-OBSERVABILITY-INCIDENT-DIAGNOSTICS.md",
          "f953c6dce02da341e0fd2471fab5bca079736a94",
          "resilience"
        )
      ],
      [],
      "Defense-in-depth, authority isolation, threat modelling and recovery evidence exist. Final acceptance still requires exact-revision containment and recovery evidence."
    )
  ] satisfies readonly ConstitutionalPillarAudit[]);

  const blockers = humanApproved
    ? []
    : [humanBlocker];

  return Object.freeze({
    kind: "blueprint-os-constitutional-self-audit",
    projectId: "project:blueprint-os",
    policyId: "blueprint-os:universal-century-grade",
    policyVersion: "1.1.0",
    blueprintLevel: "B4",
    state: humanApproved ? "ready-for-final-evidence" : "blocked",
    pillars,
    blockers: Object.freeze(blockers),
    exactHumanReviewBound: humanApproved,
    canonicalGatePassRecorded: false,
    acceptanceAuthority: false,
    productionReleaseAuthority: false,
    requiresFinalExactRevisionEvidence: true,
    boundaryNote:
      "This self-audit is an evidence projection, not a Constitutional Quality Gate PASS. It cannot self-approve P9-019, record P9-020 acceptance, authorize Production or replace exact-revision gate evidence."
  });
}
