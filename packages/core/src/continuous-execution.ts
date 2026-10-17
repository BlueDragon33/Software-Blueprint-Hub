import type { WorkPackage, QualityGate } from "@blueprint-os/contracts";

/**
 * Read-only engineering readiness. Canonical records are supplied only by a
 * server adapter after PROJECT_READ; this function never grants execution.
 * A signed issuer/workflow grant and re-check at POST are separate capabilities.
 */
export interface ContinuousProjectSnapshot {
  readonly projectId: string;
  readonly profileVersion: number;
  readonly canonicalRevision: string | null;
  readonly appHead: string | null;
  readonly canMutate: boolean;
  readonly requiredGateIds: readonly string[];
  readonly workPackages: readonly WorkPackage[];
  readonly gates: readonly QualityGate[];
}

export interface ContinuousExecutionAssessment {
  readonly state: "UNVERIFIED" | "BLOCKED" | "READ_ONLY" | "READY_WORK_FOUND";
  readonly nextWorkId: string | null;
  readonly nextWorkTitle: string | null;
  readonly reasons: readonly string[];
  readonly preflightEvidenceReady: boolean;
  readonly canDispatch: false;
}

const sha = (value: string | null): boolean =>
  typeof value === "string" && /^[a-f0-9]{40}$/.test(value);

export function assessCanonicalContinuousReadiness(
  input: ContinuousProjectSnapshot
): ContinuousExecutionAssessment {
  const reasons: string[] = [];
  const finish = (
    state: ContinuousExecutionAssessment["state"],
    work: WorkPackage | null = null
  ): ContinuousExecutionAssessment => Object.freeze({
    state, nextWorkId: work?.id ?? null, nextWorkTitle: work?.title ?? null,
    reasons: Object.freeze([...reasons]),
    preflightEvidenceReady: false,
    canDispatch: false as const
  });

  if (!/^project:[a-z][a-z0-9-]+$/.test(input.projectId) ||
      !Number.isInteger(input.profileVersion) || input.profileVersion < 1 ||
      !input.canonicalRevision?.trim() || !sha(input.appHead)) {
    reasons.push("Canonical project revision or verified repository HEAD is missing.");
    return finish("UNVERIFIED");
  }
  const workById = new Map<string, WorkPackage>();
  const gateById = new Map<string, QualityGate>();
  for (const w of input.workPackages) {
    if (w.projectId !== input.projectId || workById.has(w.id)) {
      reasons.push("Work identity is duplicated or belongs to a different project.");
      return finish("UNVERIFIED");
    }
    workById.set(w.id, w);
  }
  for (const g of input.gates) {
    if (g.projectId !== input.projectId || gateById.has(g.id)) {
      reasons.push("Gate identity is duplicated or belongs to a different project.");
      return finish("UNVERIFIED");
    }
    gateById.set(g.id, g);
  }
  for (const w of input.workPackages) {
    if (w.dependencies.some(dep => dep === w.id || !workById.has(dep))) {
      reasons.push("Work dependency is missing or self-referential.");
      return finish("UNVERIFIED");
    }
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const dep of workById.get(id)?.dependencies ?? []) {
      if (!visit(dep)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    return true;
  };
  if ([...workById.keys()].some(id => !visit(id))) {
    reasons.push("Cyclic work dependencies must be repaired.");
    return finish("UNVERIFIED");
  }
  // A missing gate is a real blocker, not permission to invent PASS.
  for (const id of input.requiredGateIds) {
    if (!gateById.has(id)) reasons.push("Required gate is missing: " + id);
  }
  for (const gate of gateById.values()) {
    if (gate.status === "fail") reasons.push("Recorded gate failed: " + gate.id);
    if (gate.status === "pass" && gate.evidenceIds.length === 0)
      reasons.push("Gate claims PASS without linked evidence: " + gate.id);
  }
  if (reasons.length) return finish("BLOCKED");
  if (!input.canMutate) {
    reasons.push("PROJECT_READ does not imply permission to change or execute work.");
    return finish("READ_ONLY");
  }
  const ready = input.workPackages
    .filter(w => w.status === "ready" &&
      w.acceptanceCriteria.length > 0 &&
      w.dependencies.every(dep => workById.get(dep)?.status === "completed") &&
      w.qualityGateIds.every(id => gateById.has(id) &&
        gateById.get(id)?.status !== "fail"))
    .sort((a,b) => a.id.localeCompare(b.id));
  if (!ready.length) {
    reasons.push("No dependency-satisfied canonical READY work exists.");
    return finish("BLOCKED");
  }
  // No automatic dispatch: an independently verified signed execution grant,
  // explicit owner adoption, trusted runner and POST-side readback are absent.
  reasons.push("Signed execution grant and live runner authorization remain separate.");
  return finish("READY_WORK_FOUND", ready[0]);
}
