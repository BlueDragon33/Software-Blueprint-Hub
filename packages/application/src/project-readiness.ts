import {
  AuthorityService,
  summarizeProjectReadiness,
  type AuthenticatedActor,
  type ProjectReadinessSnapshot,
  type WorkQualityRepository
} from "@blueprint-os/core";

export class ProjectReadinessApplicationService {
  constructor(
    private readonly repository: WorkQualityRepository,
    private readonly authority: AuthorityService
  ) {}

  async read(
    actor: AuthenticatedActor | null,
    projectId: string,
    requiredGateIds: readonly string[]
  ): Promise<ProjectReadinessSnapshot> {
    await this.authority.require(actor, projectId, "PROJECT_READ");

    const [workPackages, gateBundles] = await Promise.all([
      this.repository.listWorkPackagesByProject(projectId),
      this.repository.listQualityGateEvidenceByProject(projectId)
    ]);

    return summarizeProjectReadiness({
      projectId,
      requiredGateIds,
      workPackages,
      qualityGates: gateBundles.map((item) => item.gate),
      evidenceByGate: new Map(
        gateBundles.map((item) => [item.gate.id, item.evidence] as const)
      )
    });
  }
}
