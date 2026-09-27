import type {
  GateEvidence,
  QualityGate,
  ResolvedBlueprint
} from "@blueprint-os/contracts";
import type { QualityGateEvidenceBundle } from "@blueprint-os/core";

export type CenturyGradePillarId =
  | "structural-capacity"
  | "architectural-longevity"
  | "product-elegance"
  | "premium-usability"
  | "long-term-durability"
  | "fortress-security-disaster-resilience";

export interface CenturyGradePillarDefinition {
  readonly id: CenturyGradePillarId;
  readonly label: string;
  readonly requirementIds: readonly string[];
}

export const centuryGradePillarDefinitions: readonly CenturyGradePillarDefinition[] =
  Object.freeze([
    Object.freeze({
      id: "structural-capacity",
      label: "Structural Capacity",
      requirementIds: Object.freeze([
        "module:architecture:structural-capacity",
        "gate:architecture:future-scale"
      ])
    }),
    Object.freeze({
      id: "architectural-longevity",
      label: "Architectural Longevity",
      requirementIds: Object.freeze([
        "module:governance:architectural-longevity"
      ])
    }),
    Object.freeze({
      id: "product-elegance",
      label: "Product Elegance",
      requirementIds: Object.freeze([
        "module:ux:product-elegance",
        "gate:ux:commercial-quality"
      ])
    }),
    Object.freeze({
      id: "premium-usability",
      label: "Premium Usability",
      requirementIds: Object.freeze([
        "module:ux:premium-usability",
        "gate:ux:commercial-quality"
      ])
    }),
    Object.freeze({
      id: "long-term-durability",
      label: "Long-Term Durability",
      requirementIds: Object.freeze([
        "module:maintenance:long-term-durability",
        "gate:durability:ageing-regression"
      ])
    }),
    Object.freeze({
      id: "fortress-security-disaster-resilience",
      label: "Fortress Security & Disaster Resilience",
      requirementIds: Object.freeze([
        "module:security:fortress-resilience",
        "gate:security:resilience-containment"
      ])
    })
  ]);

export type ConstitutionalComplianceState = "compliant" | "non-compliant";

export interface ConstitutionalGateAudit {
  readonly id: string;
  readonly state: "pass" | "missing" | "not-pass" | "evidence-missing";
  readonly status: QualityGate["status"] | "missing";
  readonly evidenceIds: readonly string[];
  readonly evidenceRevisions: readonly string[];
}

export interface ConstitutionalPillarAudit {
  readonly id: CenturyGradePillarId;
  readonly label: string;
  readonly state: ConstitutionalComplianceState;
  readonly missingRequirementIds: readonly string[];
  readonly blockingGateIds: readonly string[];
}

export interface ConstitutionalComplianceAudit {
  readonly kind: "constitutional-compliance-audit";
  readonly projectId: string;
  readonly policyId: "blueprint-os:universal-century-grade";
  readonly policyVersion: "1.1.0";
  readonly state: ConstitutionalComplianceState;
  readonly pillars: readonly ConstitutionalPillarAudit[];
  readonly gates: readonly ConstitutionalGateAudit[];
  readonly blockers: readonly string[];
  readonly productionReleaseAuthority: false;
  readonly exactReleaseRevisionCertified: false;
  readonly boundaryNote: string;
}

const constitutionalGateIds = Object.freeze([
  "gate:quality:evidence",
  "gate:security:authority",
  "gate:ux:human-acceptance",
  "gate:architecture:future-scale",
  "gate:ux:commercial-quality",
  "gate:durability:ageing-regression",
  "gate:security:resilience-containment"
]);

function linkedEvidence(
  gate: QualityGate,
  evidence: readonly GateEvidence[]
): readonly GateEvidence[] {
  const byId = new Map(evidence.map((item) => [item.id, item] as const));
  return Object.freeze(
    gate.evidenceIds
      .map((id) => byId.get(id))
      .filter((item): item is GateEvidence => Boolean(item))
  );
}

export function evaluateConstitutionalCompliance(input: {
  readonly blueprint: ResolvedBlueprint;
  readonly gateBundles: readonly QualityGateEvidenceBundle[];
}): ConstitutionalComplianceAudit {
  const { blueprint } = input;
  const requiredModules = new Set(blueprint.requiredModules);
  const requiredGates = new Set(blueprint.requiredGates);
  const bundleByGate = new Map(
    input.gateBundles.map((bundle) => [bundle.gate.id, bundle] as const)
  );

  const blockers: string[] = [];
  const gateAudits: ConstitutionalGateAudit[] = [];

  for (const gateId of constitutionalGateIds) {
    if (!requiredGates.has(gateId)) {
      blockers.push(`constitution-blueprint-gate-missing:${gateId}`);
      gateAudits.push(
        Object.freeze({
          id: gateId,
          state: "missing" as const,
          status: "missing" as const,
          evidenceIds: Object.freeze([]),
          evidenceRevisions: Object.freeze([])
        })
      );
      continue;
    }

    const bundle = bundleByGate.get(gateId);
    if (!bundle) {
      blockers.push(`constitution-canonical-gate-missing:${gateId}`);
      gateAudits.push(
        Object.freeze({
          id: gateId,
          state: "missing" as const,
          status: "missing" as const,
          evidenceIds: Object.freeze([]),
          evidenceRevisions: Object.freeze([])
        })
      );
      continue;
    }

    const gate = bundle.gate;
    const linked = linkedEvidence(gate, bundle.evidence);
    const provenanceComplete =
      linked.length > 0 &&
      linked.every(
        (item) =>
          item.gateId === gate.id &&
          item.source.trim().length > 0 &&
          item.revision.trim().length > 0
      ) &&
      gate.evidenceIds.every((id) => linked.some((item) => item.id === id));

    if (gate.status !== "pass") {
      blockers.push(`constitution-gate-not-pass:${gateId}`);
    } else if (!provenanceComplete) {
      blockers.push(`constitution-gate-evidence-missing:${gateId}`);
    }

    gateAudits.push(
      Object.freeze({
        id: gateId,
        state:
          gate.status !== "pass"
            ? ("not-pass" as const)
            : provenanceComplete
              ? ("pass" as const)
              : ("evidence-missing" as const),
        status: gate.status,
        evidenceIds: Object.freeze(linked.map((item) => item.id).sort()),
        evidenceRevisions: Object.freeze(
          [...new Set(linked.map((item) => item.revision))].sort()
        )
      })
    );
  }

  const pillarAudits = centuryGradePillarDefinitions.map((pillar) => {
    const missingRequirementIds = pillar.requirementIds.filter((id) =>
      id.startsWith("module:")
        ? !requiredModules.has(id)
        : !requiredGates.has(id)
    );
    const pillarGateIds = pillar.requirementIds.filter((id) =>
      id.startsWith("gate:")
    );
    const blockingGateIds = pillarGateIds.filter(
      (id) => gateAudits.find((gate) => gate.id === id)?.state !== "pass"
    );

    for (const requirementId of missingRequirementIds) {
      blockers.push(
        `constitution-pillar-requirement-missing:${pillar.id}:${requirementId}`
      );
    }

    return Object.freeze({
      id: pillar.id,
      label: pillar.label,
      state:
        missingRequirementIds.length === 0 && blockingGateIds.length === 0
          ? ("compliant" as const)
          : ("non-compliant" as const),
      missingRequirementIds: Object.freeze([...missingRequirementIds]),
      blockingGateIds: Object.freeze([...blockingGateIds])
    });
  });

  const uniqueBlockers = Object.freeze([...new Set(blockers)].sort());

  return Object.freeze({
    kind: "constitutional-compliance-audit",
    projectId: blueprint.projectId,
    policyId: "blueprint-os:universal-century-grade",
    policyVersion: "1.1.0",
    state: uniqueBlockers.length === 0 ? "compliant" : "non-compliant",
    pillars: Object.freeze(pillarAudits),
    gates: Object.freeze(gateAudits),
    blockers: uniqueBlockers,
    productionReleaseAuthority: false,
    exactReleaseRevisionCertified: false,
    boundaryNote:
      "Constitutional compliance proves canonical adoption and evidence-backed PASS for Universal gates. It does not certify the exact final release revision, authorize Production, or replace P9-020 acceptance."
  });
}
