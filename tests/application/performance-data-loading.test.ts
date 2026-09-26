import type {
  GateEvidence,
  ProjectProfile,
  QualityGate,
  ResolvedBlueprint,
  WorkPackage
} from "../../packages/contracts/src";
import {
  AuthorityService,
  type AuthenticatedIdentity,
  type AuthorityAuditInput,
  type AuthorityRepository,
  type PrincipalRecord,
  type ProjectRole,
  type ProjectRoleAssignment,
  type WorkQualityRepository
} from "../../packages/core/src";
import {
  ProjectReadinessApplicationService,
  PromptProjectionApplicationService,
  WorkQualityApplicationService,
  type ProjectProfileReader
} from "../../packages/application/src";
import { describe, expect, it } from "vitest";

const projectId = "project:p7-005-performance";

const meta = {
  schemaVersion: "1.0.0" as const,
  recordVersion: 1,
  createdAt: "2026-09-26T06:00:00Z",
  updatedAt: "2026-09-26T06:00:00Z"
};

const profile: ProjectProfile = {
  id: "profile:p7-005-performance",
  projectId,
  meta,
  name: "P7-005 Performance",
  projectType: "web-application",
  blueprintLevel: "B3",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Avoid N+1 canonical reads."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  deploymentTarget: "managed-web",
  expectedLifetime: "long-lived"
};

const blueprint: ResolvedBlueprint = {
  resolutionId: "resolution:p7-005-performance",
  resolverVersion: "1.0.0",
  inputFingerprint: "0123456789abcdef0123456789abcdef",
  projectId,
  profileRecordVersion: 1,
  activatedTemplates: [
    {
      id: "template:constitution:base",
      version: "1.0.0",
      authorityLayer: "constitution"
    }
  ],
  requiredModules: ["module:quality:evidence"],
  requiredGates: ["gate:p7-005-performance"],
  dependencyEdges: [],
  rationale: [
    {
      targetId: "gate:p7-005-performance",
      sourceId: "template:constitution:base",
      reason: "Performance regression requires evidence."
    }
  ]
};

const workPackage: WorkPackage = {
  id: "work-package:p7-005-performance",
  projectId,
  title: "Batch gate evidence reads",
  purpose: "Remove project-wide Gate Evidence N+1 reads.",
  dependencies: [],
  acceptanceCriteria: ["Project-wide consumers use one batch contract."],
  qualityGateIds: ["gate:p7-005-performance"],
  status: "testing",
  meta
};

const gate: QualityGate = {
  id: "gate:p7-005-performance",
  projectId,
  name: "Performance data-loading gate",
  requirements: ["Batch evidence loading is used."],
  status: "candidate",
  evidenceIds: ["evidence:p7-005-performance"],
  meta
};

const evidence: GateEvidence = {
  id: "evidence:p7-005-performance",
  gateId: gate.id,
  kind: "test",
  source: "vitest:p7-005-performance",
  revision: "revision:p7-005-performance",
  createdAt: "2026-09-26T06:01:00Z"
};

class OwnerAuthorityRepository implements AuthorityRepository {
  async resolvePrincipal(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return {
      id: "principal:p7-005-owner",
      provider: identity.provider,
      providerSubject: identity.providerSubject,
      email: identity.email ?? null
    };
  }

  async bootstrapOwner(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return this.resolvePrincipal(identity);
  }

  async isSystemOwner(): Promise<boolean> {
    return true;
  }

  async findProjectRole(): Promise<ProjectRole | null> {
    return null;
  }

  async listProjectRolesForPrincipal(): Promise<readonly ProjectRoleAssignment[]> {
    return [];
  }

  async setProjectRole(
    assignment: ProjectRoleAssignment,
    _audit: AuthorityAuditInput
  ): Promise<ProjectRoleAssignment> {
    return assignment;
  }
}

class CountingWorkQualityRepository implements WorkQualityRepository {
  batchReads = 0;
  perGateEvidenceReads = 0;
  gateListReads = 0;

  async createWorkPackage(value: WorkPackage): Promise<WorkPackage> {
    return value;
  }

  async findWorkPackageById(id: string): Promise<WorkPackage | null> {
    return id === workPackage.id ? workPackage : null;
  }

  async listWorkPackagesByProject(id: string): Promise<readonly WorkPackage[]> {
    return id === projectId ? [workPackage] : [];
  }

  async updateWorkPackage(value: WorkPackage): Promise<WorkPackage> {
    return value;
  }

  async createQualityGate(value: QualityGate): Promise<QualityGate> {
    return value;
  }

  async findQualityGateById(id: string): Promise<QualityGate | null> {
    return id === gate.id ? gate : null;
  }

  async listQualityGatesByProject(id: string): Promise<readonly QualityGate[]> {
    this.gateListReads += 1;
    return id === projectId ? [gate] : [];
  }

  async listQualityGateEvidenceByProject(id: string) {
    this.batchReads += 1;
    return id === projectId
      ? [{ gate, evidence: [evidence] }]
      : [];
  }

  async updateQualityGate(value: QualityGate): Promise<QualityGate> {
    return value;
  }

  async createGateEvidence(value: GateEvidence): Promise<GateEvidence> {
    return value;
  }

  async findGateEvidenceById(id: string): Promise<GateEvidence | null> {
    return id === evidence.id ? evidence : null;
  }

  async listGateEvidenceByGate(id: string): Promise<readonly GateEvidence[]> {
    this.perGateEvidenceReads += 1;
    return id === gate.id ? [evidence] : [];
  }
}

const profileReader: ProjectProfileReader = {
  async read() {
    return {
      profile,
      blueprint,
      templateVersions: [
        { id: "template:constitution:base", version: "1.0.0" }
      ]
    };
  }
};

describe("P7-005 performance data-loading contract", () => {
  it("keeps Quality, Readiness and Prompt on the batch gate/evidence path", async () => {
    const repository = new CountingWorkQualityRepository();
    const authority = new AuthorityService(new OwnerAuthorityRepository());
    const actor = { principalId: "principal:p7-005-owner" };

    const quality = new WorkQualityApplicationService(repository, authority);
    const readiness = new ProjectReadinessApplicationService(
      repository,
      authority
    );
    const prompts = new PromptProjectionApplicationService(
      authority,
      profileReader,
      repository,
      { now: () => "2026-09-26T06:02:00Z" }
    );

    const gateModels = await quality.listQualityGates(actor, projectId);
    const snapshot = await readiness.read(
      actor,
      projectId,
      blueprint.requiredGates
    );
    const revision = await prompts.currentSourceRevision(actor, projectId);

    expect(gateModels[0]?.evidence[0]?.id).toBe(evidence.id);
    expect(snapshot.activeGates[0]?.id).toBe(gate.id);
    expect(revision).toMatch(/^sha256:[a-f0-9]{64}$/);

    expect(repository.batchReads).toBe(3);
    expect(repository.perGateEvidenceReads).toBe(0);
    expect(repository.gateListReads).toBe(0);
  });
});
