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

const projection: BlueprintCompassProjection = Object.freeze({
  projectionKind: "development-baseline",
  projectId: "project:blueprint-os",
  phase: "Phase 9 — Compass Construction",
  currentStorey: Object.freeze({
    number: 20,
    total: 20,
    name: "Compass Acceptance & data lifecycle"
  }),
  releaseAuthority: "not-authorized",
  sourceOfTruth:
    "projects/blueprint-os/PHASE-9-COMPASS-CONSTRUCTION-WORK-PACKAGES.md",
  activeWork: Object.freeze({
    id: "P9-015",
    title: "Data lifecycle & archive",
    storey: 20,
    status: "active",
    reason:
      "P9-014 passed the full Release Gate with explicit threat boundaries; long-lived retention, archive, deletion, export and migration semantics can now be hardened without implicit destructive mutation."
  }),
  workSequence: Object.freeze([
    Object.freeze({
      id: "P9-014",
      title: "Security threat-model hardening",
      storey: 20,
      status: "complete",
      reason:
        "Threat boundaries, credential ownership, escalation paths and destructive operations passed the full Release Gate with no open severe blocker."
    }),
    Object.freeze({
      id: "P9-015",
      title: "Data lifecycle & archive",
      storey: 20,
      status: "active",
      reason:
        "Retention, archive, deletion, export and migration semantics are now the next dependency-valid governance layer."
    }),
    Object.freeze({
      id: "P9-016",
      title: "Accessibility & adaptive UX audit",
      storey: 20,
      status: "next",
      reason:
        "Adaptive UX revalidation follows once long-lived data lifecycle behavior is explicit."
    })
  ]),
  dependencyBlockers: Object.freeze([]),
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
      label: "P9-014 Security Threat-model full Release Gate",
      revision: "0297d00599fac21956bf65dc2482cbc4cfca2d53",
      source: "Software-Blueprint-Hub PR #59 / main Release Gate",
      result: "pass"
    })
  ]),
  nextActions: Object.freeze([
    "Complete P9-015 by proving retention, archive, deletion, export and migration plans remain project-isolated, held when required and non-destructive until explicit execution.",
    "Start P9-016 Accessibility & Adaptive UX Audit only after P9-015 exact PR-head evidence and full Release Gate are green.",
    "Production publish remains blocked until a real deployment provider is connected and explicit external execution succeeds."
  ]),
  truthNote:
    "This is a checked-in Development Baseline projection. It does not manufacture project completion percentages, Quality Gate PASS state or Production readiness."
});

export function getBlueprintCompassProjection(): BlueprintCompassProjection {
  return projection;
}
