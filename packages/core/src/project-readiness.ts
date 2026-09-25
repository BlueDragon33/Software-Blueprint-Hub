import type {
  GateEvidence,
  QualityGate,
  WorkPackage
} from "@blueprint-os/contracts";

import { explainWorkPackageReadiness } from "./work-quality";

export type ReadinessState =
  | "blocked"
  | "attention"
  | "in-progress"
  | "gate-ready";

export type EvidenceFreshness =
  | "none"
  | "incomplete"
  | "recorded-unverified";

export interface ReadinessGateItem {
  readonly id: string;
  readonly name: string;
  readonly required: boolean;
  readonly status: "missing" | QualityGate["status"];
  readonly evidenceCount: number;
  readonly missingEvidenceIds: readonly string[];
  readonly latestEvidenceAt: string | null;
  readonly latestEvidenceSource: string | null;
  readonly latestEvidenceRevision: string | null;
  readonly evidenceFreshness: EvidenceFreshness;
}

export interface ReadinessWorkBlocker {
  readonly id: string;
  readonly title: string;
  readonly status: WorkPackage["status"];
  readonly blockers: readonly {
    readonly dependencyId: string;
    readonly status: string;
    readonly reason: string;
  }[];
}

export interface ProjectReadinessSnapshot {
  readonly projectId: string;
  readonly state: ReadinessState;
  readonly headline: string;
  readonly gateSummary: {
    readonly required: number;
    readonly trackedRequired: number;
    readonly passRequired: number;
    readonly missingRequired: number;
    readonly failedTracked: number;
    readonly candidateTracked: number;
    readonly notReadyTracked: number;
    readonly activeTracked: number;
  };
  readonly workSummary: {
    readonly total: number;
    readonly completed: number;
    readonly blocked: number;
    readonly active: number;
  };
  readonly evidenceSummary: {
    readonly linked: number;
    readonly missingReferences: number;
    readonly freshness: EvidenceFreshness;
  };
  readonly activeGates: readonly ReadinessGateItem[];
  readonly blockedWork: readonly ReadinessWorkBlocker[];
  readonly nextAction: {
    readonly kind:
      | "define-gate"
      | "resolve-failed-gate"
      | "unblock-work"
      | "review-candidate"
      | "prepare-gate"
      | "continue-work"
      | "verify-release";
    readonly label: string;
    readonly reason: string;
  };
}

export interface ProjectReadinessInput {
  readonly projectId: string;
  readonly requiredGateIds: readonly string[];
  readonly workPackages: readonly WorkPackage[];
  readonly qualityGates: readonly QualityGate[];
  readonly evidenceByGate: ReadonlyMap<string, readonly GateEvidence[]>;
}

function newestEvidence(
  evidence: readonly GateEvidence[]
): GateEvidence | null {
  return (
    [...evidence].sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) ||
        a.id.localeCompare(b.id)
    )[0] ?? null
  );
}

function gateItem(
  id: string,
  required: boolean,
  gate: QualityGate | undefined,
  evidence: readonly GateEvidence[]
): ReadinessGateItem {
  if (!gate) {
    return Object.freeze({
      id,
      name: id,
      required,
      status: "missing",
      evidenceCount: 0,
      missingEvidenceIds: Object.freeze([]),
      latestEvidenceAt: null,
      latestEvidenceSource: null,
      latestEvidenceRevision: null,
      evidenceFreshness: "none"
    });
  }

  const byId = new Map(evidence.map((item) => [item.id, item]));
  const linked = gate.evidenceIds
    .map((evidenceId) => byId.get(evidenceId))
    .filter((item): item is GateEvidence => Boolean(item));
  const missingEvidenceIds = gate.evidenceIds.filter(
    (evidenceId) => !byId.has(evidenceId)
  );
  const latest = newestEvidence(linked);

  const evidenceFreshness: EvidenceFreshness =
    gate.evidenceIds.length === 0
      ? "none"
      : missingEvidenceIds.length > 0
        ? "incomplete"
        : "recorded-unverified";

  return Object.freeze({
    id: gate.id,
    name: gate.name,
    required,
    status: gate.status,
    evidenceCount: linked.length,
    missingEvidenceIds: Object.freeze([...missingEvidenceIds]),
    latestEvidenceAt: latest?.createdAt ?? null,
    latestEvidenceSource: latest?.source ?? null,
    latestEvidenceRevision: latest?.revision ?? null,
    evidenceFreshness
  });
}

export function summarizeProjectReadiness(
  input: ProjectReadinessInput
): ProjectReadinessSnapshot {
  const requiredGateIds = [...new Set(input.requiredGateIds)].sort();
  const gateById = new Map(input.qualityGates.map((gate) => [gate.id, gate]));

  for (const workPackage of input.workPackages) {
    if (workPackage.projectId !== input.projectId) {
      throw new TypeError(
        `WorkPackage ${workPackage.id} belongs to another project`
      );
    }
  }

  for (const gate of input.qualityGates) {
    if (gate.projectId !== input.projectId) {
      throw new TypeError(`QualityGate ${gate.id} belongs to another project`);
    }
  }

  const requiredItems = requiredGateIds.map((id) =>
    gateItem(
      id,
      true,
      gateById.get(id),
      input.evidenceByGate.get(id) ?? []
    )
  );

  const additionalItems = input.qualityGates
    .filter((gate) => !requiredGateIds.includes(gate.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((gate) =>
      gateItem(
        gate.id,
        false,
        gate,
        input.evidenceByGate.get(gate.id) ?? []
      )
    );

  const allGateItems = [...requiredItems, ...additionalItems];
  const activeGates = allGateItems.filter((gate) => gate.status !== "pass");
  const missingRequired = requiredItems.filter(
    (gate) => gate.status === "missing"
  );
  const failedTracked = allGateItems.filter(
    (gate) => gate.status === "fail"
  );
  const candidateTracked = allGateItems.filter(
    (gate) => gate.status === "candidate"
  );
  const notReadyTracked = allGateItems.filter(
    (gate) => gate.status === "not-ready"
  );
  const passRequired = requiredItems.filter(
    (gate) => gate.status === "pass"
  ).length;

  const blockedWork = input.workPackages
    .map((workPackage) => ({
      workPackage,
      readiness: explainWorkPackageReadiness(
        workPackage,
        input.workPackages
      )
    }))
    .filter((item) => item.readiness.state === "blocked")
    .map((item) =>
      Object.freeze({
        id: item.workPackage.id,
        title: item.workPackage.title,
        status: item.workPackage.status,
        blockers: Object.freeze(
          item.readiness.blockers.map((blocker) =>
            Object.freeze({
              dependencyId: blocker.dependencyId,
              status: blocker.status,
              reason: blocker.reason
            })
          )
        )
      })
    );

  const completedWork = input.workPackages.filter(
    (workPackage) => workPackage.status === "completed"
  ).length;
  const activeWork = input.workPackages.length - completedWork;

  const linkedEvidence = allGateItems.reduce(
    (total, gate) => total + gate.evidenceCount,
    0
  );
  const missingEvidenceReferences = allGateItems.reduce(
    (total, gate) => total + gate.missingEvidenceIds.length,
    0
  );
  const evidenceFreshness: EvidenceFreshness =
    linkedEvidence === 0
      ? "none"
      : missingEvidenceReferences > 0
        ? "incomplete"
        : "recorded-unverified";

  let state: ReadinessState;
  let nextAction: ProjectReadinessSnapshot["nextAction"];

  if (missingRequired.length > 0) {
    state = "blocked";
    const gate = missingRequired[0]!;
    nextAction = {
      kind: "define-gate",
      label: `Define required gate ${gate.id}`,
      reason:
        "The resolved blueprint requires this gate, but no canonical QualityGate record exists yet."
    };
  } else if (failedTracked.length > 0) {
    state = "blocked";
    const gate = failedTracked[0]!;
    nextAction = {
      kind: "resolve-failed-gate",
      label: `Resolve failed gate: ${gate.name}`,
      reason:
        "A canonical QualityGate is in FAIL and must be resolved before readiness can advance."
    };
  } else if (blockedWork.length > 0) {
    state = "blocked";
    const work = blockedWork[0]!;
    nextAction = {
      kind: "unblock-work",
      label: `Unblock: ${work.title}`,
      reason:
        work.blockers[0]?.reason ??
        "A Work Package is blocked by an unresolved dependency."
    };
  } else if (candidateTracked.length > 0) {
    state = "attention";
    const gate = candidateTracked[0]!;
    nextAction = {
      kind: "review-candidate",
      label: `Review candidate gate: ${gate.name}`,
      reason:
        "Candidate status indicates evidence exists or review is underway, but PASS has not been established."
    };
  } else if (notReadyTracked.length > 0) {
    state = "in-progress";
    const gate = notReadyTracked[0]!;
    nextAction = {
      kind: "prepare-gate",
      label: `Prepare gate: ${gate.name}`,
      reason:
        gate.evidenceCount === 0
          ? "This gate has no linked evidence yet."
          : "This gate is still NOT READY despite recorded evidence."
    };
  } else if (activeWork > 0) {
    state = "in-progress";
    const work = input.workPackages
      .filter((item) => item.status !== "completed")
      .sort((a, b) => a.id.localeCompare(b.id))[0]!;
    nextAction = {
      kind: "continue-work",
      label: `Continue: ${work.title}`,
      reason:
        "Required gates are not currently blocking, but canonical work remains incomplete."
    };
  } else {
    state =
      requiredItems.length > 0 && passRequired === requiredItems.length
        ? "gate-ready"
        : "in-progress";
    nextAction = {
      kind: "verify-release",
      label: "Verify exact-revision release evidence",
      reason:
        state === "gate-ready"
          ? "All required gates currently PASS. Product or release readiness still requires exact-revision review."
          : "No active work or gate blocker is recorded; verify the resolved blueprint and release evidence before claiming readiness."
    };
  }

  const headline =
    state === "blocked"
      ? "Readiness is blocked by canonical engineering state."
      : state === "attention"
        ? "Evidence is ready for focused review."
        : state === "gate-ready"
          ? "Required gates currently PASS."
          : "Engineering work is still in progress.";

  return Object.freeze({
    projectId: input.projectId,
    state,
    headline,
    gateSummary: Object.freeze({
      required: requiredItems.length,
      trackedRequired: requiredItems.length - missingRequired.length,
      passRequired,
      missingRequired: missingRequired.length,
      failedTracked: failedTracked.length,
      candidateTracked: candidateTracked.length,
      notReadyTracked: notReadyTracked.length,
      activeTracked: activeGates.length
    }),
    workSummary: Object.freeze({
      total: input.workPackages.length,
      completed: completedWork,
      blocked: blockedWork.length,
      active: activeWork
    }),
    evidenceSummary: Object.freeze({
      linked: linkedEvidence,
      missingReferences: missingEvidenceReferences,
      freshness: evidenceFreshness
    }),
    activeGates: Object.freeze(activeGates),
    blockedWork: Object.freeze(blockedWork),
    nextAction: Object.freeze(nextAction)
  });
}
