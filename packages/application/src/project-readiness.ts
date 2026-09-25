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

    const [workPackages, qualityGates] = await Promise.all([
      this.repository.listWorkPackagesByProject(projectId),
      this.repository.listQualityGatesByProject(projectId)
    ]);

    const evidencePairs = await Promise.all(
      qualityGates.map(async (gate) =>
        [
          gate.id,
          await this.repository.listGateEvidenceByGate(gate.id)
        ] as const
      )
    );

    return summarizeProjectReadiness({
      projectId,
      requiredGateIds,
      workPackages,
      qualityGates,
      evidenceByGate: new Map(evidencePairs)
    });
  }
}
