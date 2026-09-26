import type {
  GateEvidence,
  QualityGate,
  ReleaseRecord,
  WorkPackage
} from "@blueprint-os/contracts";

export type QualityEvidenceNodeKind =
  | "work-package"
  | "quality-gate"
  | "gate-evidence"
  | "release";

export type QualityEvidenceEdgeKind =
  | "depends-on"
  | "requires-gate"
  | "supported-by"
  | "release-evidence";

export interface QualityEvidenceGraphNode {
  readonly id: string;
  readonly kind: QualityEvidenceNodeKind;
  readonly label: string;
  readonly status: string | null;
  readonly revision: string | null;
  readonly source: string | null;
}

export interface QualityEvidenceGraphEdge {
  readonly from: string;
  readonly to: string;
  readonly kind: QualityEvidenceEdgeKind;
  readonly explanation: string;
}

export interface QualityEvidenceGraphProjection {
  readonly projectionKind: "quality-evidence-provenance-graph";
  readonly projectId: string;
  readonly canonicalMutationAllowed: false;
  readonly qualityGateMutationAllowed: false;
  readonly releaseAuthority: false;
  readonly syntheticReadinessAllowed: false;
  readonly nodes: readonly QualityEvidenceGraphNode[];
  readonly edges: readonly QualityEvidenceGraphEdge[];
  readonly summary: {
    readonly workPackages: number;
    readonly qualityGates: number;
    readonly evidenceRecords: number;
    readonly releases: number;
    readonly edges: number;
  };
  readonly boundaryNote: string;
}

export interface QualityEvidenceGraphInput {
  readonly projectId: string;
  readonly workPackages: readonly WorkPackage[];
  readonly qualityGates: readonly QualityGate[];
  readonly evidence: readonly GateEvidence[];
  readonly releases: readonly ReleaseRecord[];
}

function assertProjectIdentity(input: QualityEvidenceGraphInput): void {
  const projectId = input.projectId;

  for (const work of input.workPackages) {
    if (work.projectId !== projectId) {
      throw new TypeError(
        `WorkPackage ${work.id} belongs to another project`
      );
    }
  }
  for (const gate of input.qualityGates) {
    if (gate.projectId !== projectId) {
      throw new TypeError(
        `QualityGate ${gate.id} belongs to another project`
      );
    }
  }
  for (const release of input.releases) {
    if (release.projectId !== projectId) {
      throw new TypeError(
        `ReleaseRecord ${release.id} belongs to another project`
      );
    }
  }
}

function assertUniqueIds(input: QualityEvidenceGraphInput): void {
  const ids = new Set<string>();
  for (const item of [
    ...input.workPackages,
    ...input.qualityGates,
    ...input.evidence,
    ...input.releases
  ]) {
    if (ids.has(item.id)) {
      throw new TypeError(`Quality evidence graph contains duplicate id ${item.id}`);
    }
    ids.add(item.id);
  }
}

export function buildQualityEvidenceGraph(
  input: QualityEvidenceGraphInput
): QualityEvidenceGraphProjection {
  assertProjectIdentity(input);
  assertUniqueIds(input);

  const workById = new Map(input.workPackages.map((item) => [item.id, item]));
  const gateById = new Map(input.qualityGates.map((item) => [item.id, item]));
  const evidenceById = new Map(input.evidence.map((item) => [item.id, item]));

  for (const evidence of input.evidence) {
    if (!gateById.has(evidence.gateId)) {
      throw new TypeError(
        `GateEvidence ${evidence.id} references unknown QualityGate ${evidence.gateId}`
      );
    }
  }

  const edges: QualityEvidenceGraphEdge[] = [];

  for (const work of input.workPackages) {
    for (const dependencyId of work.dependencies) {
      if (!workById.has(dependencyId)) {
        throw new TypeError(
          `WorkPackage ${work.id} references unknown dependency ${dependencyId}`
        );
      }
      edges.push({
        from: work.id,
        to: dependencyId,
        kind: "depends-on",
        explanation: `${work.id} depends on canonical WorkPackage ${dependencyId}`
      });
    }

    for (const gateId of work.qualityGateIds) {
      if (!gateById.has(gateId)) {
        throw new TypeError(
          `WorkPackage ${work.id} references unknown QualityGate ${gateId}`
        );
      }
      edges.push({
        from: work.id,
        to: gateId,
        kind: "requires-gate",
        explanation: `${work.id} requires QualityGate ${gateId}`
      });
    }
  }

  for (const gate of input.qualityGates) {
    for (const evidenceId of gate.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        throw new TypeError(
          `QualityGate ${gate.id} references unknown GateEvidence ${evidenceId}`
        );
      }
      if (evidence.gateId !== gate.id) {
        throw new TypeError(
          `GateEvidence ${evidenceId} belongs to ${evidence.gateId}, not ${gate.id}`
        );
      }
      edges.push({
        from: gate.id,
        to: evidenceId,
        kind: "supported-by",
        explanation: `${gate.id} links revision-specific evidence ${evidenceId}`
      });
    }
  }

  for (const release of input.releases) {
    for (const evidenceId of release.gateEvidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) {
        throw new TypeError(
          `ReleaseRecord ${release.id} references unknown GateEvidence ${evidenceId}`
        );
      }
      edges.push({
        from: release.id,
        to: evidenceId,
        kind: "release-evidence",
        explanation:
          `${release.id} cites ${evidenceId} for release revision ${release.revision}`
      });
    }
  }

  const nodes: QualityEvidenceGraphNode[] = [
    ...input.workPackages.map((item) => ({
      id: item.id,
      kind: "work-package" as const,
      label: item.title,
      status: item.status,
      revision: null,
      source: null
    })),
    ...input.qualityGates.map((item) => ({
      id: item.id,
      kind: "quality-gate" as const,
      label: item.name,
      status: item.status,
      revision: null,
      source: null
    })),
    ...input.evidence.map((item) => ({
      id: item.id,
      kind: "gate-evidence" as const,
      label: item.kind,
      status: null,
      revision: item.revision,
      source: item.source
    })),
    ...input.releases.map((item) => ({
      id: item.id,
      kind: "release" as const,
      label: item.version,
      status: item.status,
      revision: item.revision,
      source: item.artifactSource
    }))
  ];

  const sortedNodes = Object.freeze(
    nodes.sort(
      (a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id)
    ).map((item) => Object.freeze(item))
  );
  const sortedEdges = Object.freeze(
    edges.sort(
      (a, b) =>
        a.kind.localeCompare(b.kind) ||
        a.from.localeCompare(b.from) ||
        a.to.localeCompare(b.to)
    ).map((item) => Object.freeze(item))
  );

  return Object.freeze({
    projectionKind: "quality-evidence-provenance-graph",
    projectId: input.projectId,
    canonicalMutationAllowed: false,
    qualityGateMutationAllowed: false,
    releaseAuthority: false,
    syntheticReadinessAllowed: false,
    nodes: sortedNodes,
    edges: sortedEdges,
    summary: Object.freeze({
      workPackages: input.workPackages.length,
      qualityGates: input.qualityGates.length,
      evidenceRecords: input.evidence.length,
      releases: input.releases.length,
      edges: sortedEdges.length
    }),
    boundaryNote:
      "This graph explains recorded provenance links only. It does not calculate readiness, promote Quality Gates to PASS or authorize a release."
  });
}
