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
    number: 12,
    total: 20,
    name: "Compass dashboard"
  }),
  releaseAuthority: "not-authorized",
  sourceOfTruth:
    "projects/blueprint-os/PHASE-9-COMPASS-CONSTRUCTION-WORK-PACKAGES.md",
  activeWork: Object.freeze({
    id: "P9-002",
    title: "Compass dashboard",
    storey: 12,
    status: "active",
    reason:
      "P9-001 established the ecosystem management boundary, so the next valid construction step is the orientation surface."
  }),
  workSequence: Object.freeze([
    Object.freeze({
      id: "P9-001",
      title: "Application Management contract & core registration",
      storey: 11,
      status: "complete",
      reason:
        "Blueprint OS publishes a metadata-only contract and Application Management now registers the app without canonical authority."
    }),
    Object.freeze({
      id: "P9-002",
      title: "Compass dashboard",
      storey: 12,
      status: "active",
      reason:
        "The system needs one truthful orientation surface before the 20-storey architecture projection is expanded."
    }),
    Object.freeze({
      id: "P9-003",
      title: "20-storey architecture projection",
      storey: 12,
      status: "next",
      reason:
        "Structured storey inspection follows only after the dashboard orientation contract is stable."
    })
  ]),
  dependencyBlockers: Object.freeze([]),
  risks: Object.freeze([
    Object.freeze({
      id: "R-P9-DRIFT",
      title: "Source-of-truth drift is not yet automatically detected",
      treatment:
        "P9-004 will add contradiction detection across roadmap, README, gates and runtime projections."
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
    })
  ]),
  nextActions: Object.freeze([
    "Complete P9-002 with a truthful orientation surface and regression coverage.",
    "Start P9-003 only after the P9-002 exact PR head is green.",
    "Keep Production release unauthorized while Phase 9 remains Development Mode."
  ]),
  truthNote:
    "This is a checked-in Development Baseline projection. It does not manufacture project completion percentages, Quality Gate PASS state or Production readiness."
});

export function getBlueprintCompassProjection(): BlueprintCompassProjection {
  return projection;
}
