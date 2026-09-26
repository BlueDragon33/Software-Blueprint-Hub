export interface ReferenceCaseProjectionEntry {
  readonly label: string;
  readonly detail: string;
}

export interface ReferenceCaseGap {
  readonly id: string;
  readonly label: string;
  readonly classification: string;
  readonly owner: string;
  readonly decision: string;
}

export interface ReferenceCaseProjection {
  readonly caseId: string;
  readonly source: {
    readonly repository: string;
    readonly branch: string;
    readonly pullRequest: string;
    readonly importedRevision: string;
    readonly manifestRevision: string;
    readonly importedAt: string;
  };
  readonly snapshotNote: string;
  readonly authorityNote: string;
  readonly classifications: {
    readonly supported: readonly string[];
    readonly patterns: readonly string[];
    readonly projectSpecific: readonly string[];
    readonly productGaps: readonly string[];
  };
  readonly guards: readonly ReferenceCaseProjectionEntry[];
  readonly gaps: readonly ReferenceCaseGap[];
  readonly conclusion: string;
}

const baumanNextgenV1: ReferenceCaseProjection = Object.freeze({
  caseId: "bauman-nextgen-v1",
  source: Object.freeze({
    repository: "BlueDragon33/Bauman-master-ai-system",
    branch: "architecture/bauman-nextgen-blueprint-v1",
    pullRequest: "#127 — Architecture Blueprint v1 · Bauman Next-Generation Platform",
    importedRevision: "52b2a581a9c38a7060e95209e94c3087764f6d5f",
    manifestRevision: "c195f2abc4fe0ee6a6cf3f05aab04e814a07d0b2",
    importedAt: "2026-09-26"
  }),
  snapshotNote:
    "This view describes the frozen architecture revision imported into Blueprint OS. Newer Bauman main commits are not silently included.",
  authorityNote:
    "Reference knowledge can guide comparison and gap analysis, but it cannot set project completion, Quality Gate state, release readiness, access authority or production revision.",
  classifications: Object.freeze({
    supported: Object.freeze([
      "Durable identity and separate schema/content/release versions",
      "Stable Core with explicit dependency direction",
      "Explicit authority boundaries for UI, plugins and AI",
      "Additive migration, ADR governance and exact-revision release discipline",
      "Offline/extensibility requirements at Project Profile and template depth"
    ]),
    patterns: Object.freeze([
      "Provenance-aware registry",
      "Canonical-read adapter / Strangler migration",
      "Sandboxed capability extension host",
      "Projection-not-authority reporting",
      "Fail-isolated package validation"
    ]),
    projectSpecific: Object.freeze([
      "Curriculum, learning, assessment and academic mastery",
      "Learner state and portfolio/output domain",
      "Learner / Publisher / Admin runtime role taxonomy",
      "Device Gate and Bauman control-plane topology",
      "Bauman A0–A5 construction-gate meanings"
    ]),
    productGaps: Object.freeze([
      "Machine-readable Reference Case provenance",
      "External concept aliasing and namespacing",
      "Frozen-source versus later-source drift observations",
      "Reviewed Pattern promotion workflow",
      "Dedicated Reference Case inspection UX"
    ])
  }),
  guards: Object.freeze([
    Object.freeze({
      label: "Academic Evidence ≠ GateEvidence",
      detail:
        "Bauman learner evidence stays in the academic domain. Blueprint GateEvidence remains engineering evidence attached to a software Quality Gate."
    }),
    Object.freeze({
      label: "Learner Project ≠ Blueprint Project",
      detail:
        "A Bauman project/portfolio artifact cannot become the managed software Project merely because both use the same display name."
    }),
    Object.freeze({
      label: "Mastery ≠ engineering readiness",
      detail:
        "Academic mastery decisions cannot promote Blueprint readiness or Quality Gate state, and Blueprint gate state cannot claim learner mastery."
    }),
    Object.freeze({
      label: "Content Registry ≠ Knowledge Library",
      detail:
        "Bauman runtime learning-resource authority is distinct from Blueprint OS reusable engineering knowledge."
    }),
    Object.freeze({
      label: "Runtime roles ≠ Blueprint authority roles",
      detail:
        "Bauman Learner/Publisher/Admin/Plugin/AI permissions remain project-owned and do not expand Blueprint Owner/Editor/Reviewer/Viewer authority."
    })
  ]),
  gaps: Object.freeze([
    Object.freeze({
      id: "G1",
      label: "Structured Reference Case provenance",
      classification: "Import tooling contract",
      owner: "P8-005",
      decision: "Solve with a versioned import manifest; no Universal Core expansion."
    }),
    Object.freeze({
      id: "G2",
      label: "External semantic aliases",
      classification: "Reference import tooling",
      owner: "P8-005",
      decision: "Keep source vocabulary namespaced and machine-map classifications."
    }),
    Object.freeze({
      id: "G3",
      label: "External source drift",
      classification: "Reference lifecycle tooling",
      owner: "P8-005",
      decision: "Create immutable observations; never rewrite the imported snapshot."
    }),
    Object.freeze({
      id: "G4",
      label: "Pattern promotion workflow",
      classification: "Knowledge governance",
      owner: "Future Knowledge work",
      decision: "Require review evidence before publishing Pattern records."
    }),
    Object.freeze({
      id: "G5",
      label: "Reference Case detail UX",
      classification: "Product UX",
      owner: "P8-004",
      decision: "Expose provenance first and keep mapping/gaps progressively disclosed."
    })
  ]),
  conclusion:
    "The Bauman case is expressible at Blueprint OS engineering-governance level without a Universal Core schema expansion."
});

const projections = new Map<string, ReferenceCaseProjection>([
  [baumanNextgenV1.caseId, baumanNextgenV1]
]);

export function findReferenceCaseProjection(
  caseId: string
): ReferenceCaseProjection | null {
  return projections.get(caseId) ?? null;
}
