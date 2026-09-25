import type {
  GateEvidence,
  QualityGate,
  WorkPackage
} from "@blueprint-os/contracts";

export interface WorkPackageBlocker {
  readonly dependencyId: string;
  readonly status: "missing" | WorkPackage["status"];
  readonly reason: string;
}

export interface WorkPackageReadiness {
  readonly state: "ready" | "blocked";
  readonly blockers: readonly WorkPackageBlocker[];
}

export class WorkPackageDependencyError extends Error {
  readonly code = "WORK_PACKAGE_DEPENDENCY_INVALID";

  constructor(readonly reasons: readonly string[]) {
    super(`Invalid WorkPackage dependency graph: ${reasons.join("; ")}`);
    this.name = "WorkPackageDependencyError";
  }
}

export class QualityGateEvidenceError extends Error {
  readonly code = "QUALITY_GATE_EVIDENCE_INVALID";

  constructor(readonly reasons: readonly string[]) {
    super(`Quality Gate evidence is insufficient: ${reasons.join("; ")}`);
    this.name = "QualityGateEvidenceError";
  }
}

export interface WorkQualityRepository {
  createWorkPackage(workPackage: WorkPackage): Promise<WorkPackage>;
  findWorkPackageById(id: string): Promise<WorkPackage | null>;
  listWorkPackagesByProject(projectId: string): Promise<readonly WorkPackage[]>;
  updateWorkPackage(
    workPackage: WorkPackage,
    expectedRecordVersion: number
  ): Promise<WorkPackage>;

  createQualityGate(gate: QualityGate): Promise<QualityGate>;
  findQualityGateById(id: string): Promise<QualityGate | null>;
  listQualityGatesByProject(projectId: string): Promise<readonly QualityGate[]>;
  updateQualityGate(
    gate: QualityGate,
    expectedRecordVersion: number
  ): Promise<QualityGate>;

  createGateEvidence(evidence: GateEvidence): Promise<GateEvidence>;
  findGateEvidenceById(id: string): Promise<GateEvidence | null>;
  listGateEvidenceByGate(gateId: string): Promise<readonly GateEvidence[]>;
}

function dependencyMap(
  packages: readonly WorkPackage[]
): ReadonlyMap<string, WorkPackage> {
  return new Map(packages.map((item) => [item.id, item]));
}

export function validateWorkPackageDependencies(
  candidate: WorkPackage,
  projectPackages: readonly WorkPackage[]
): void {
  const reasons: string[] = [];
  const byId = dependencyMap(projectPackages);
  const graph = new Map<string, readonly string[]>(
    projectPackages.map((item) => [item.id, item.dependencies])
  );
  graph.set(candidate.id, candidate.dependencies);

  for (const dependencyId of candidate.dependencies) {
    if (dependencyId === candidate.id) {
      reasons.push(`${candidate.id} cannot depend on itself`);
      continue;
    }

    const dependency = byId.get(dependencyId);
    if (!dependency) {
      reasons.push(`missing dependency ${dependencyId}`);
      continue;
    }

    if (dependency.projectId !== candidate.projectId) {
      reasons.push(`dependency ${dependencyId} belongs to another project`);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string, trail: readonly string[]): void {
    if (visiting.has(id)) {
      reasons.push(`dependency cycle: ${[...trail, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) return;

    visiting.add(id);
    for (const next of graph.get(id) ?? []) {
      if (graph.has(next)) {
        visit(next, [...trail, id]);
      }
    }
    visiting.delete(id);
    visited.add(id);
  }

  visit(candidate.id, []);

  if (reasons.length) {
    throw new WorkPackageDependencyError(Object.freeze([...new Set(reasons)]));
  }
}

export function explainWorkPackageReadiness(
  workPackage: WorkPackage,
  projectPackages: readonly WorkPackage[]
): WorkPackageReadiness {
  const byId = dependencyMap(projectPackages);
  const blockers: WorkPackageBlocker[] = [];

  for (const dependencyId of workPackage.dependencies) {
    const dependency = byId.get(dependencyId);
    if (!dependency) {
      blockers.push({
        dependencyId,
        status: "missing",
        reason: `Dependency ${dependencyId} does not exist in this project`
      });
      continue;
    }

    if (dependency.status !== "completed") {
      blockers.push({
        dependencyId,
        status: dependency.status,
        reason: `Dependency ${dependencyId} is ${dependency.status}, not completed`
      });
    }
  }

  return Object.freeze({
    state: blockers.length ? "blocked" : "ready",
    blockers: Object.freeze(blockers.map((blocker) => Object.freeze(blocker)))
  });
}

export function assertQualityGateCanPass(
  gate: QualityGate,
  evidence: readonly GateEvidence[]
): void {
  const reasons: string[] = [];
  const byId = new Map(evidence.map((item) => [item.id, item]));

  if (gate.evidenceIds.length === 0) {
    reasons.push("PASS requires at least one evidence ID");
  }

  for (const evidenceId of gate.evidenceIds) {
    const item = byId.get(evidenceId);
    if (!item) {
      reasons.push(`required evidence ${evidenceId} does not exist`);
      continue;
    }
    if (item.gateId !== gate.id) {
      reasons.push(`evidence ${evidenceId} belongs to ${item.gateId}`);
    }
    if (!item.source.trim() || !item.revision.trim()) {
      reasons.push(`evidence ${evidenceId} lacks source/revision provenance`);
    }
  }

  if (reasons.length) {
    throw new QualityGateEvidenceError(Object.freeze(reasons));
  }
}
