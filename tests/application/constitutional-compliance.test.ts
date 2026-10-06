import { readFileSync } from "node:fs";

import type {
  GateEvidence,
  QualityGate,
  ResolvedBlueprint
} from "@blueprint-os/contracts";
import type { QualityGateEvidenceBundle } from "@blueprint-os/core";
import { describe, expect, it } from "vitest";

import {
  centuryGradePillarDefinitions,
  evaluateConstitutionalCompliance
} from "../../packages/application/src";

const constitutionalGateIds = [
  "gate:quality:evidence",
  "gate:security:authority",
  "gate:ux:human-acceptance",
  "gate:architecture:future-scale",
  "gate:ux:commercial-quality",
  "gate:durability:ageing-regression",
  "gate:security:resilience-containment",
  "gate:operations:dependency-sovereignty"
] as const;

const constitutionalModuleIds = [
  "module:architecture:structural-capacity",
  "module:governance:architectural-longevity",
  "module:ux:product-elegance",
  "module:ux:premium-usability",
  "module:maintenance:long-term-durability",
  "module:security:fortress-resilience",
  "module:architecture:operational-sovereignty"
] as const;

function blueprint(): ResolvedBlueprint {
  return {
    resolutionId: "resolution:constitutional-self-test",
    resolverVersion: "test",
    inputFingerprint: "f".repeat(64),
    projectId: "project:blueprint-os",
    profileRecordVersion: 1,
    activatedTemplates: [],
    requiredModules: [...constitutionalModuleIds],
    requiredGates: [...constitutionalGateIds],
    dependencyEdges: [],
    rationale: [],
    warnings: []
  };
}

function bundle(
  gateId: string,
  status: QualityGate["status"] = "pass",
  options: { evidence?: boolean } = { evidence: true }
): QualityGateEvidenceBundle {
  const evidenceId = `evidence:${gateId.replaceAll(":", "-")}`;
  const evidence: GateEvidence = {
    id: evidenceId,
    gateId,
    kind: "test",
    source: "github-actions:constitutional-self-test",
    revision: "revision:constitutional-self-test",
    createdAt: "2026-09-27T14:30:00.000Z"
  };
  const gate: QualityGate = {
    id: gateId,
    projectId: "project:blueprint-os",
    name: gateId,
    requirements: ["Constitutional evidence is required."],
    status,
    evidenceIds: options.evidence === false ? [] : [evidenceId],
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: "2026-09-27T14:29:00.000Z",
      updatedAt: "2026-09-27T14:29:00.000Z"
    }
  };

  return {
    gate,
    evidence: options.evidence === false ? [] : [evidence]
  };
}

describe("Universal Constitution self-audit", () => {
  it("keeps the machine-readable Constitution contract aligned with code", () => {
    const contract = JSON.parse(
      readFileSync("control/universal-constitution.contract.json", "utf8")
    ) as {
      pillars: Array<{ id: string; requirementIds: string[] }>;
    };

    expect(
      contract.pillars.map((pillar) => ({
        id: pillar.id,
        requirementIds: pillar.requirementIds
      }))
    ).toEqual(
      centuryGradePillarDefinitions.map((pillar) => ({
        id: pillar.id,
        requirementIds: [...pillar.requirementIds]
      }))
    );
  });

  it("fails closed when a constitutional gate is missing", () => {
    const audit = evaluateConstitutionalCompliance({
      blueprint: blueprint(),
      gateBundles: constitutionalGateIds
        .filter((id) => id !== "gate:security:resilience-containment")
        .map((id) => bundle(id))
    });

    expect(audit.state).toBe("non-compliant");
    expect(audit.blockers).toContain(
      "constitution-canonical-gate-missing:gate:security:resilience-containment"
    );
    expect(audit.productionReleaseAuthority).toBe(false);
    expect(audit.exactReleaseRevisionCertified).toBe(false);
  });

  it("fails closed when a gate is not PASS or PASS lacks evidence", () => {
    const notPass = evaluateConstitutionalCompliance({
      blueprint: blueprint(),
      gateBundles: constitutionalGateIds.map((id) =>
        bundle(
          id,
          id === "gate:ux:commercial-quality" ? "candidate" : "pass"
        )
      )
    });
    expect(notPass.state).toBe("non-compliant");
    expect(notPass.blockers).toContain(
      "constitution-gate-not-pass:gate:ux:commercial-quality"
    );

    const noEvidence = evaluateConstitutionalCompliance({
      blueprint: blueprint(),
      gateBundles: constitutionalGateIds.map((id) =>
        id === "gate:durability:ageing-regression"
          ? bundle(id, "pass", { evidence: false })
          : bundle(id)
      )
    });
    expect(noEvidence.state).toBe("non-compliant");
    expect(noEvidence.blockers).toContain(
      "constitution-gate-evidence-missing:gate:durability:ageing-regression"
    );
  });

  it("becomes compliant only when every Universal gate is PASS and evidence-backed", () => {
    const audit = evaluateConstitutionalCompliance({
      blueprint: blueprint(),
      gateBundles: constitutionalGateIds.map((id) => bundle(id))
    });

    expect(audit.state).toBe("compliant");
    expect(audit.blockers).toEqual([]);
    expect(audit.pillars.every((pillar) => pillar.state === "compliant")).toBe(
      true
    );
    expect(audit.gates.every((gate) => gate.state === "pass")).toBe(true);
    expect(audit.productionReleaseAuthority).toBe(false);
    expect(audit.exactReleaseRevisionCertified).toBe(false);
  });
});
