import type { HumanProfessionalReviewDecisionRecord } from "@blueprint-os/core";

export type CompassWorkStatus = "complete" | "active" | "next";

export interface CompassEvidence {
  readonly label: string;
  readonly revision: string;
  readonly source: string;
  readonly result: "pass";
}

export interface CompassWorkItem {
  readonly id: string;
  readonly title: string;
  readonly storey: number;
  readonly status: CompassWorkStatus;
  readonly reason: string;
}

export interface CompassRisk {
  readonly id: string;
  readonly title: string;
  readonly treatment: string;
}

export interface BlueprintCompassProjection {
  readonly projectionKind: "development-baseline";
  readonly projectId: "project:blueprint-os";
  readonly phase: string;
  readonly currentStorey: {
    readonly number: number;
    readonly total: 20;
    readonly name: string;
  };
  readonly releaseAuthority: "not-authorized";
  readonly sourceOfTruth: string;
  readonly activeWork: CompassWorkItem;
  readonly workSequence: readonly CompassWorkItem[];
  readonly dependencyBlockers: readonly string[];
  readonly risks: readonly CompassRisk[];
  readonly evidence: readonly CompassEvidence[];
  readonly nextActions: readonly string[];
  readonly truthNote: string;
}

const pendingProjection: BlueprintCompassProjection = Object.freeze({
  projectionKind: "development-baseline",
  projectId: "project:blueprint-os",
  phase: "Phase 9 — Compass Construction",
  currentStorey: Object.freeze({
    number: 20,
    total: 20,
    name: "Compass Acceptance & ecosystem dogfood"
  }),
  releaseAuthority: "not-authorized",
  sourceOfTruth:
    "projects/blueprint-os/PHASE-9-COMPASS-CONSTRUCTION-WORK-PACKAGES.md",
  activeWork: Object.freeze({
    id: "P9-019",
    title: "Human professional review",
    storey: 20,
    status: "active",
    reason:
      "P9-018 passed ecosystem dogfood and full Release Gate; the remaining product gate is an explicit human professional review decision against exact evidence."
  }),
  workSequence: Object.freeze([
    Object.freeze({
      id: "P9-018",
      title: "Ecosystem dogfood regression",
      storey: 20,
      status: "complete",
      reason:
        "Self-dogfood and heterogeneous project classes passed identity and semantic-isolation regression with full Release Gate evidence."
    }),
    Object.freeze({
      id: "P9-019",
      title: "Human professional review",
      storey: 20,
      status: "active",
      reason:
        "Automated and AI-assisted review evidence is ready; explicit human sign-off remains the required blocker."
    }),
    Object.freeze({
      id: "P9-020",
      title: "Compass Acceptance Gate",
      storey: 20,
      status: "next",
      reason:
        "Final acceptance cannot start until P9-019 has an explicit human professional decision."
    })
  ]),
  dependencyBlockers: Object.freeze([
    "P9-019 human professional sign-off has not been recorded for the exact current review candidate."
  ]),
  risks: Object.freeze([
    Object.freeze({
      id: "R-P9-DRIFT",
      title: "Source-of-truth drift must remain fail-closed as Phase 9 advances",
      treatment:
        "P9-004 wires contradiction detection into Fast CI; future Work Packages must update roadmap and Compass together."
    }),
    Object.freeze({
      id: "R-P9-RELEASE",
      title: "Production deployment is not authorized",
      treatment:
        "Keep Local, Preview and Production distinct until an explicit Release Mode gate produces exact evidence."
    })
  ]),
  evidence: Object.freeze([
    Object.freeze({
      label: "Phase 8 Reference Import Gate",
      revision: "f2233ef2a0c606359428199e596afffc6ccbfdc2",
      source: "Software-Blueprint-Hub PR #36",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-001 Blueprint management contract",
      revision: "c12c5517b4e80a59bb8636b98394682b1ae71ce4",
      source: "Software-Blueprint-Hub PR #37",
      result: "pass"
    }),
    Object.freeze({
      label: "Application Management registration",
      revision: "0c482e4f88478d55bd6198938934af708f907dc7",
      source: "Application-Management PR #183",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-002 System Compass dashboard",
      revision: "8d1ce6059eb66d91d432cafb0751fb6ab3c3aa63",
      source: "Software-Blueprint-Hub PR #38",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-003 20-storey architecture projection",
      revision: "eb7f936b0e67dce8e9d614e41520ff982b02487e",
      source: "Software-Blueprint-Hub PR #39",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-004 Source-of-truth contradiction detector",
      revision: "e03857831987afda72efb24d4246345dbb77716a",
      source: "Software-Blueprint-Hub PR #40",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-005 Project Bootstrap Factory",
      revision: "32e082f4a7e28c4ac7df510fa51a8ed8e98c4e41",
      source: "Software-Blueprint-Hub PR #41",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-006 Pattern Promotion Governance",
      revision: "caba8047a700da1c163de764021703f7bc554173",
      source: "Software-Blueprint-Hub PR #42",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-007 Export / Backup / Restore",
      revision: "6293dbb04a6ba4137a57dd887bbe35ceaa585d9c",
      source: "Software-Blueprint-Hub PR #43",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-008 Observability & Incident Diagnostics full Release Gate",
      revision: "f953c6dce02da341e0fd2471fab5bca079736a94",
      source: "Software-Blueprint-Hub main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-009 Provider / Plugin Boundary full Release Gate",
      revision: "565f05f198364fd10b307bb6f9989f06bb56182a",
      source: "Software-Blueprint-Hub PR #50 / main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-010 Bounded AI Copilot full Release Gate",
      revision: "cd55737bd82c47838e92108a3d778de5f9bde162",
      source: "Software-Blueprint-Hub PR #51 / main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-011 Multi-project Portfolio full Release Gate",
      revision: "548813aaa458a769ca00d3b74a36a0b4cb032252",
      source: "Software-Blueprint-Hub PR #53 / main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-012 Quality Evidence Graph full Release Gate",
      revision: "7dd360aad0a89b7ca687524a639c7fccdda08077",
      source: "Software-Blueprint-Hub PR #55 / main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-013 Release Orchestration full Release Gate",
      revision: "fb7e36544714946c807c549aa11f270c461532e0",
      source: "Software-Blueprint-Hub PR #57 / main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-014 Security Threat-model Hardening full Release Gate",
      revision: "0297d00599fac21956bf65dc2482cbc4cfca2d53",
      source: "Software-Blueprint-Hub PR #59 / main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-015 Data Lifecycle & Archive full Release Gate",
      revision: "5a664f608b07623a2a89b4d2078c37ddaedd7e43",
      source: "Software-Blueprint-Hub PR #60 / main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-016 Accessibility & Adaptive UX full Release Gate",
      revision: "38960d4312de41063859c0bc6544dbd3600278fb",
      source: "Software-Blueprint-Hub PR #61 / main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-017 Performance & Capacity full Release Gate",
      revision: "7a6fa378bb3ae970b167f742a01bebf612b97b26",
      source: "Software-Blueprint-Hub PR #62 / main Release Gate",
      result: "pass"
    }),
    Object.freeze({
      label: "P9-018 Ecosystem Dogfood full Release Gate",
      revision: "6da60278e4ef03a95f137eae1902a4054de66120",
      source: "Software-Blueprint-Hub PR #63 / workflow 36252022005",
      result: "pass"
    })
  ]),
  nextActions: Object.freeze([
    "Record an explicit human professional review decision against the exact P9-019 review candidate.",
    "Start P9-020 Compass Acceptance Gate only after human sign-off is recorded without unresolved P0/P1 findings.",
    "Production publish remains blocked until a real deployment provider is connected and explicit external execution succeeds."
  ]),
  truthNote:
    "This is a checked-in Development Baseline projection. It does not manufacture project completion percentages, Quality Gate PASS state or Production readiness."
});

export type CompassHumanReviewDecision = Pick<
  HumanProfessionalReviewDecisionRecord,
  | "decision"
  | "candidateReviewedRevision"
  | "candidateEvidenceDigest"
  | "humanSignoff"
  | "p9020TransitionAllowed"
  | "productionReleaseAuthority"
  | "blockers"
>;

function freezeWorkItem(item: CompassWorkItem): CompassWorkItem {
  return Object.freeze({ ...item });
}

export function getBlueprintCompassProjection(
  reviewDecision: CompassHumanReviewDecision | null = null
): BlueprintCompassProjection {
  const approved =
    reviewDecision?.decision === "approve" &&
    reviewDecision.humanSignoff === true &&
    reviewDecision.p9020TransitionAllowed === true &&
    reviewDecision.productionReleaseAuthority === false;

  if (!approved) {
    if (!reviewDecision) {
      return pendingProjection;
    }

    const decisionBlockers = reviewDecision.blockers.length
      ? reviewDecision.blockers
      : ["human-professional-signoff-required"];

    return Object.freeze({
      ...pendingProjection,
      dependencyBlockers: Object.freeze([
        `P9-019 recorded ${reviewDecision.decision}; P9-020 remains blocked until an explicit approval is recorded for the exact current candidate.`,
        ...decisionBlockers
      ]),
      nextActions: Object.freeze([
        "Resolve the recorded P9-019 review outcome and record an explicit approval against the exact current candidate.",
        "Start P9-020 only after the approval grants p9020TransitionAllowed = true.",
        "Production publish remains blocked until a real deployment provider is connected and explicit external execution succeeds."
      ])
    });
  }

  const p9018 = freezeWorkItem({
    id: "P9-018",
    title: "Ecosystem dogfood regression",
    storey: 20,
    status: "complete",
    reason:
      "Self-dogfood and heterogeneous project classes passed identity and semantic-isolation regression with full Release Gate evidence."
  });
  const p9019 = freezeWorkItem({
    id: "P9-019",
    title: "Human professional review",
    storey: 20,
    status: "complete",
    reason:
      "An authenticated human approval is recorded against the exact current P9-019 review candidate."
  });
  const p9020 = freezeWorkItem({
    id: "P9-020",
    title: "Compass Acceptance Gate",
    storey: 20,
    status: "active",
    reason:
      "P9-019 human sign-off is recorded. Final ecosystem reference acceptance may now evaluate exact evidence without granting Production authority."
  });

  return Object.freeze({
    ...pendingProjection,
    activeWork: p9020,
    workSequence: Object.freeze([p9018, p9019, p9020]),
    dependencyBlockers: Object.freeze([]),
    evidence: Object.freeze([
      ...pendingProjection.evidence,
      Object.freeze({
        label: "P9-019 Human Professional Review",
        revision: reviewDecision.candidateReviewedRevision,
        source: "Authenticated append-only human professional review decision",
        result: "pass" as const
      })
    ]),
    nextActions: Object.freeze([
      "Run P9-020 Compass Acceptance Gate against the exact approved review candidate and current source-of-truth.",
      "Fail closed on any source-of-truth contradiction, authority leakage, unresolved P0/P1 or evidence revision mismatch.",
      "Production publish remains separate and unauthorized until a real deployment provider plus explicit external execution succeeds."
    ]),
    truthNote:
      "P9-019 human sign-off is recorded for the exact candidate. P9-020 is active, but Production release authority remains false and no deployment is implied."
  });
}
