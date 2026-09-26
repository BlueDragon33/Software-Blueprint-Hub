import type {
  GateEvidence,
  QualityGate,
  WorkPackage
} from "../../packages/contracts/src";
import {
  AuthorityService,
  AuthorizationDeniedError,
  type AuthenticatedIdentity,
  type AuthorityAuditInput,
  type AuthorityRepository,
  type PrincipalRecord,
  type ProjectRole,
  type ProjectRoleAssignment,
  type WorkQualityRepository
} from "../../packages/core/src";
import { ProjectReadinessApplicationService } from "../../packages/application/src";
import { describe, expect, it } from "vitest";

const projectId = "project:p6-readiness-app";

class MemoryAuthority implements AuthorityRepository {
  readonly roles: ProjectRoleAssignment[] = [];

  async resolvePrincipal(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return {
      id: `principal:${identity.providerSubject}`,
      provider: identity.provider,
      providerSubject: identity.providerSubject,
      email: identity.email ?? null
    };
  }

  async bootstrapOwner(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return this.resolvePrincipal(identity);
  }

  async isSystemOwner(): Promise<boolean> {
    return false;
  }

  async findProjectRole(
    targetProjectId: string,
    principalId: string
  ): Promise<ProjectRole | null> {
    return (
      this.roles.find(
        (item) =>
          item.projectId === targetProjectId &&
          item.principalId === principalId
      )?.role ?? null
    );
  }

  async listProjectRolesForPrincipal(
    principalId: string
  ): Promise<readonly ProjectRoleAssignment[]> {
    return this.roles.filter((item) => item.principalId === principalId);
  }

  async setProjectRole(
    assignment: ProjectRoleAssignment,
    _audit: AuthorityAuditInput
  ): Promise<ProjectRoleAssignment> {
    this.roles.push(assignment);
    return assignment;
  }
}

class MemoryWorkQuality implements WorkQualityRepository {
  work: WorkPackage[] = [];
  gates: QualityGate[] = [];
  evidence: GateEvidence[] = [];
  batchEvidenceReads = 0;
  perGateEvidenceReads = 0;

  async createWorkPackage(value: WorkPackage): Promise<WorkPackage> {
    this.work.push(value);
    return value;
  }

  async findWorkPackageById(id: string): Promise<WorkPackage | null> {
    return this.work.find((item) => item.id === id) ?? null;
  }

  async listWorkPackagesByProject(id: string): Promise<readonly WorkPackage[]> {
    return this.work.filter((item) => item.projectId === id);
  }

  async updateWorkPackage(value: WorkPackage): Promise<WorkPackage> {
    return value;
  }

  async createQualityGate(value: QualityGate): Promise<QualityGate> {
    this.gates.push(value);
    return value;
  }

  async findQualityGateById(id: string): Promise<QualityGate | null> {
    return this.gates.find((item) => item.id === id) ?? null;
  }

  async listQualityGatesByProject(id: string): Promise<readonly QualityGate[]> {
    return this.gates.filter((item) => item.projectId === id);
  }

  async updateQualityGate(value: QualityGate): Promise<QualityGate> {
    return value;
  }

  async listQualityGateEvidenceByProject(id: string) {
    this.batchEvidenceReads += 1;
    return this.gates
      .filter((gate) => gate.projectId === id)
      .map((gate) => ({
        gate,
        evidence: this.evidence.filter((item) => item.gateId === gate.id)
      }));
  }

  async createGateEvidence(value: GateEvidence): Promise<GateEvidence> {
    this.evidence.push(value);
    return value;
  }

  async findGateEvidenceById(id: string): Promise<GateEvidence | null> {
    return this.evidence.find((item) => item.id === id) ?? null;
  }

  async listGateEvidenceByGate(gateId: string): Promise<readonly GateEvidence[]> {
    this.perGateEvidenceReads += 1;
    return this.evidence.filter((item) => item.gateId === gateId);
  }
}

describe("ProjectReadinessApplicationService", () => {
  it("enforces PROJECT_READ before aggregating readiness", async () => {
    const authorityRepository = new MemoryAuthority();
    const workQuality = new MemoryWorkQuality();
    const service = new ProjectReadinessApplicationService(
      workQuality,
      new AuthorityService(authorityRepository)
    );

    await expect(
      service.read(
        { principalId: "principal:viewer" },
        projectId,
        ["gate:quality:evidence"]
      )
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);

    authorityRepository.roles.push({
      projectId,
      principalId: "principal:viewer",
      role: "VIEWER"
    });

    const result = await service.read(
      { principalId: "principal:viewer" },
      projectId,
      ["gate:quality:evidence"]
    );

    expect(result.projectId).toBe(projectId);
    expect(result.gateSummary.missingRequired).toBe(1);
    expect(workQuality.batchEvidenceReads).toBe(1);
    expect(workQuality.perGateEvidenceReads).toBe(0);
  });
});
