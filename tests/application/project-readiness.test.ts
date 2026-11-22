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
import { ProjectReadinessApplicationService, WorkQualityApplicationService } from "../../packages/application/src";
import { assessCanonicalContinuousReadiness } from "../../packages/core/src/continuous-execution";
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

describe("PROJECT_READ and PROJECT_MUTATE separation for continuous execution pilots", () => {
  const meta = {schemaVersion:"1.0.0" as const,recordVersion:1,
    createdAt:"2026-10-17T00:00:00Z",updatedAt:"2026-10-17T00:00:00Z"};
  const head = "f".repeat(40);
  it("an existing governed project's authenticated Viewer has no execution authority", async () => {
    const project="project:bauman-master-ai-system";
    const authorityRepository=new MemoryAuthority(), repo=new MemoryWorkQuality();
    repo.work.push({id:"work:prea0",projectId:project,title:"Offline Pre-A0",
      purpose:"Hear imitate record compare",dependencies:[],
      acceptanceCriteria:["Real offline learning loop"],qualityGateIds:["gate:prea0"],
      status:"ready",meta});
    repo.gates.push({id:"gate:prea0",projectId:project,name:"PreA0",
      requirements:["Offline evidence"],status:"not-ready",evidenceIds:[],meta});
    const service=new WorkQualityApplicationService(repo,new AuthorityService(authorityRepository));
    await expect(service.listWorkPackages(null,project))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    authorityRepository.roles.push({projectId:project,principalId:"principal:viewer",role:"VIEWER"});
    const actor={principalId:"principal:viewer"};
    const items=await service.listWorkPackages(actor,project);
    const bundles=await service.listQualityGates(actor,project);
    const projection=assessCanonicalContinuousReadiness({
      projectId:project,profileVersion:1,canonicalRevision:"source-v1",
      appHead:head,canMutate:false,requiredGateIds:["gate:prea0"],
      workPackages:items,gates:bundles.map(b=>b.gate)
    });
    expect(projection.state).toBe("READ_ONLY");
    expect(projection.canDispatch).toBe(false);
    await expect(service.listWorkPackages(actor,"project:unrelated"))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
  });
  it("a newly onboarded project remains closed until its own exact source and READY record exist", async () => {
    const project="project:new-offline-test-app";
    const authorityRepository=new MemoryAuthority(),repo=new MemoryWorkQuality();
    authorityRepository.roles.push({projectId:project,principalId:"principal:editor",role:"EDITOR"});
    const actor={principalId:"principal:editor"};
    const service=new WorkQualityApplicationService(repo,new AuthorityService(authorityRepository));
    const notYet=assessCanonicalContinuousReadiness({
      projectId:project,profileVersion:1,canonicalRevision:"new-app-record-v1",
      appHead:null,canMutate:true,requiredGateIds:["gate:new-qa"],
      workPackages:await service.listWorkPackages(actor,project),gates:[]
    });
    expect(notYet.state).toBe("UNVERIFIED");
    repo.work.push({id:"work:app-shell",projectId:project,title:"Local shell",
      purpose:"Build offline app",dependencies:[],
      acceptanceCriteria:["Cold launch offline"],qualityGateIds:["gate:new-qa"],
      status:"ready",meta});
    repo.gates.push({id:"gate:new-qa",projectId:project,name:"Offline QA",
      requirements:["Disconnected readback"],status:"not-ready",evidenceIds:[],meta});
    const items=await service.listWorkPackages(actor,project);
    const bundles=await service.listQualityGates(actor,project);
    const result=assessCanonicalContinuousReadiness({
      projectId:project,profileVersion:1,canonicalRevision:"new-app-record-v1",
      appHead:head,canMutate:true,requiredGateIds:["gate:new-qa"],
      workPackages:items,gates:bundles.map(b=>b.gate)
    });
    expect(result.state).toBe("READY_WORK_FOUND");
    expect(result.canDispatch).toBe(false);
  });
});
