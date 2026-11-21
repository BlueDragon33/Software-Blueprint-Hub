import type { ProjectProfile, ResolvedBlueprint } from "../../packages/contracts/src";
import type { GraphIntelligenceInput } from "../../packages/application/src/graph-intelligence";

/** Synthetic fixture for tests only; never imported by the running application. */
export function graphFixture(): GraphIntelligenceInput {
  const meta = { schemaVersion: "1.0.0", recordVersion: 1,
    createdAt: "2026-11-17T12:00:00Z", updatedAt: "2026-11-17T12:00:00Z" } as const;
  const profile: ProjectProfile = { id: "profile:graph", projectId: "project:graph", meta,
    name: "Graph test project", projectType: "web-application", blueprintLevel: "B2",
    primaryUsers: ["builder"], jobsToBeDone: ["Trace evidence and independent constraints"],
    dataSensitivity: "internal", persistence: "local", authentication: "required",
    authorization: "role-based", deploymentTarget: "local", expectedLifetime: "years" };
  const blueprint: ResolvedBlueprint = { resolutionId: "resolution:graph", resolverVersion: "1.0.0",
    inputFingerprint: "sha256:" + "a".repeat(64), projectId: profile.projectId, profileRecordVersion: 1,
    activatedTemplates: [], requiredModules: ["module:graph:core"], requiredGates: ["gate:graph"],
    dependencyEdges: [], rationale: [] };
  return { projectId: profile.projectId, profile, blueprint, workflows: [], security: null, dataPolicy: null,
    sourceCodeRevision: "c".repeat(40),
    workPackages: [
      { id: "work:producer", projectId: profile.projectId, title: "Collect evidence", purpose: "Inspect bytes",
        dependencies: [], acceptanceCriteria: ["Evidence is traceable"], qualityGateIds: ["gate:graph"], status: "review", meta },
      { id: "work:consumer", projectId: profile.projectId, title: "Use evidence", purpose: "Check independent constraints",
        dependencies: ["work:producer"], acceptanceCriteria: ["Separate approval"], qualityGateIds: ["gate:graph"], status: "planned", meta }
    ],
    qualityGates: [{ id: "gate:graph", projectId: profile.projectId, name: "Evidence Gate",
      requirements: ["Exact revision evidence"], status: "candidate", evidenceIds: ["evidence:graph"], meta }],
    evidence: [{ id: "evidence:graph", gateId: "gate:graph", kind: "test", source: "artifact:test-fixture",
      revision: "b".repeat(40), createdAt: meta.createdAt }],
    releases: [{ id: "release:graph", projectId: profile.projectId, version: "0.1.0", revision: "b".repeat(40),
      environment: "local", artifactSource: "artifact:test-fixture", status: "candidate",
      gateEvidenceIds: ["evidence:graph"], rollbackPlan: "Restore previous local artifact", meta }]
  };
}
