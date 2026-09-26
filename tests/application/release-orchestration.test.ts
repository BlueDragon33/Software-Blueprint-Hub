import { describe, expect, it } from "vitest";

import type {
  GateEvidence,
  QualityGate,
  ReleaseRecord
} from "@blueprint-os/contracts";
import {
  buildReleasePromotionPlan,
  type ProviderBoundaryDescriptor
} from "../../packages/application/src";

const meta = {
  schemaVersion: "1.0.0",
  recordVersion: 1,
  createdAt: "2026-09-26T14:10:00.000Z",
  updatedAt: "2026-09-26T14:10:00.000Z"
} as const;

const evidence: GateEvidence = {
  id: "evidence:release",
  gateId: "gate:release",
  kind: "test",
  source: "release-gate:p9-013",
  revision: "revision:release",
  createdAt: "2026-09-26T14:10:00.000Z"
};

const gate: QualityGate = {
  id: "gate:release",
  projectId: "project:release",
  name: "Release Gate",
  requirements: ["Exact revision evidence passes."],
  status: "pass",
  evidenceIds: [evidence.id],
  meta
};

const release: ReleaseRecord = {
  id: "release:candidate",
  projectId: "project:release",
  version: "1.0.0",
  revision: "revision:release",
  environment: "preview",
  artifactSource: "artifact:build/revision-release",
  status: "candidate",
  gateEvidenceIds: [evidence.id],
  rollbackPlan: "Restore the prior released revision.",
  meta
};

const provider: ProviderBoundaryDescriptor = {
  id: "provider:deploy",
  version: "1.0.0",
  kind: "deployment",
  displayName: "Deployment Provider",
  allowedProjectIds: ["project:release"],
  credentialPolicy: {
    requiresCredentialReference: true,
    acceptedReferencePrefixes: ["credential-ref:"],
    rawSecretsAllowed: false
  },
  capabilities: [{
    id: "deployment:promote",
    mode: "mutate-external",
    description: "Promote an exact revision externally."
  }],
  productionReleaseAuthority: false,
  canonicalBlueprintMutationAuthority: false,
  qualityGateAuthority: false
};

describe("P9-013 Release Orchestration", () => {
  it("keeps merge/release evidence distinct from deployment when provider is absent", () => {
    const plan = buildReleasePromotionPlan({
      projectId: "project:release",
      release,
      qualityGates: [gate],
      evidence: [evidence],
      targetEnvironment: "production"
    });

    expect(plan.state).toBe("blocked");
    expect(plan.blockers).toContain("deployment-provider-missing");
    expect(plan.mergeIsDeployment).toBe(false);
    expect(plan.deploymentObserved).toBe(false);
    expect(plan.productionDeploymentAuthorized).toBe(false);
  });

  it("becomes ready for explicit external execution only with valid provider scope and capability", () => {
    const plan = buildReleasePromotionPlan({
      projectId: "project:release",
      release,
      qualityGates: [gate],
      evidence: [evidence],
      targetEnvironment: "production",
      deploymentProvider: provider,
      deploymentCapabilityId: "deployment:promote"
    });

    expect(plan.state).toBe("ready-for-explicit-execution");
    expect(plan.blockers).toEqual([]);
    expect(plan.passedGateIds).toEqual(["gate:release"]);
    expect(plan.requiresExplicitExecutionConfirmation).toBe(true);
    expect(plan.requiresExternalExecution).toBe(true);
    expect(plan.productionDeploymentAuthorized).toBe(false);
    expect(plan.auditFingerprint).toMatch(/^sha256:/);
  });

  it("fails closed on stale revision evidence", () => {
    expect(() =>
      buildReleasePromotionPlan({
        projectId: "project:release",
        release,
        qualityGates: [gate],
        evidence: [{ ...evidence, revision: "revision:stale" }],
        targetEnvironment: "production"
      })
    ).toThrow(/not release revision/i);
  });

  it("fails closed when gate status is not PASS", () => {
    expect(() =>
      buildReleasePromotionPlan({
        projectId: "project:release",
        release,
        qualityGates: [{ ...gate, status: "candidate" }],
        evidence: [evidence],
        targetEnvironment: "preview"
      })
    ).toThrow(/not PASS/i);
  });

  it("rejects provider authority leakage or wrong project scope", () => {
    expect(() =>
      buildReleasePromotionPlan({
        projectId: "project:release",
        release,
        qualityGates: [gate],
        evidence: [evidence],
        targetEnvironment: "production",
        deploymentProvider: {
          ...provider,
          allowedProjectIds: ["project:other"]
        },
        deploymentCapabilityId: "deployment:promote"
      })
    ).toThrow(/not scoped/i);
  });
});
