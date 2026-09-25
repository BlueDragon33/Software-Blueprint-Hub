import type {
  GateEvidence,
  QualityGate,
  WorkPackage
} from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import {
  assertQualityGateCanPass,
  AuthorityService,
  explainWorkPackageReadiness,
  validateWorkPackageDependencies,
  type AuthenticatedActor,
  type WorkPackageReadiness,
  type WorkQualityRepository
} from "@blueprint-os/core";

function assertValid(
  name: "WorkPackage" | "QualityGate" | "GateEvidence",
  value: unknown
): void {
  const result = validateContract(name, value);
  if (!result.valid) {
    const details = result.errors
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new TypeError(`Invalid ${name}: ${details}`);
  }
}

export class WorkQualityApplicationService {
  constructor(
    private readonly repository: WorkQualityRepository,
    private readonly authority: AuthorityService
  ) {}

  async createWorkPackage(
    actor: AuthenticatedActor | null,
    workPackage: WorkPackage
  ): Promise<WorkPackage> {
    await this.authority.require(
      actor,
      workPackage.projectId,
      "PROJECT_MUTATE"
    );
    assertValid("WorkPackage", workPackage);

    const projectPackages =
      await this.repository.listWorkPackagesByProject(workPackage.projectId);
    validateWorkPackageDependencies(workPackage, projectPackages);

    return this.repository.createWorkPackage(workPackage);
  }

  async updateWorkPackage(
    actor: AuthenticatedActor | null,
    workPackage: WorkPackage,
    expectedRecordVersion: number
  ): Promise<WorkPackage> {
    await this.authority.require(
      actor,
      workPackage.projectId,
      "PROJECT_MUTATE"
    );
    assertValid("WorkPackage", workPackage);

    const projectPackages =
      await this.repository.listWorkPackagesByProject(workPackage.projectId);
    validateWorkPackageDependencies(workPackage, projectPackages);

    return this.repository.updateWorkPackage(
      workPackage,
      expectedRecordVersion
    );
  }

  async readiness(
    actor: AuthenticatedActor | null,
    workPackageId: string
  ): Promise<WorkPackageReadiness | null> {
    const workPackage =
      await this.repository.findWorkPackageById(workPackageId);
    if (!workPackage) return null;

    await this.authority.require(
      actor,
      workPackage.projectId,
      "PROJECT_READ"
    );
    const projectPackages =
      await this.repository.listWorkPackagesByProject(workPackage.projectId);

    return explainWorkPackageReadiness(workPackage, projectPackages);
  }

  async createQualityGate(
    actor: AuthenticatedActor | null,
    gate: QualityGate
  ): Promise<QualityGate> {
    await this.authority.require(actor, gate.projectId, "PROJECT_MUTATE");
    assertValid("QualityGate", gate);

    if (gate.status === "pass") {
      throw new TypeError("A newly created QualityGate cannot start at PASS");
    }

    return this.repository.createQualityGate(gate);
  }

  async addGateEvidence(
    actor: AuthenticatedActor | null,
    evidence: GateEvidence
  ): Promise<GateEvidence> {
    assertValid("GateEvidence", evidence);
    const gate = await this.repository.findQualityGateById(evidence.gateId);
    if (!gate) {
      throw new TypeError(`Unknown QualityGate ${evidence.gateId}`);
    }

    await this.authority.require(actor, gate.projectId, "PROJECT_REVIEW");
    return this.repository.createGateEvidence(evidence);
  }

  async updateQualityGate(
    actor: AuthenticatedActor | null,
    gate: QualityGate,
    expectedRecordVersion: number
  ): Promise<QualityGate> {
    await this.authority.require(actor, gate.projectId, "PROJECT_REVIEW");
    assertValid("QualityGate", gate);

    if (gate.status === "pass") {
      const evidence =
        await this.repository.listGateEvidenceByGate(gate.id);
      assertQualityGateCanPass(gate, evidence);
    }

    return this.repository.updateQualityGate(gate, expectedRecordVersion);
  }
}
