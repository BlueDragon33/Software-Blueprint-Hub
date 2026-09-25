import type {
  ArchitectureDecision,
  Risk,
  TechnicalDebt
} from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import {
  AuthorityService,
  type AuthenticatedActor,
  type GovernanceRepository,
  type WorkQualityRepository
} from "@blueprint-os/core";

function assertValid(
  name: "ArchitectureDecision" | "Risk" | "TechnicalDebt",
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

function sameStrings(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export class GovernanceApplicationService {
  constructor(
    private readonly repository: GovernanceRepository,
    private readonly workQuality: WorkQualityRepository,
    private readonly authority: AuthorityService
  ) {}

  async listArchitectureDecisions(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<readonly ArchitectureDecision[]> {
    await this.authority.require(actor, projectId, "PROJECT_READ");
    return this.repository.listArchitectureDecisionsByProject(projectId);
  }

  async createArchitectureDecision(
    actor: AuthenticatedActor | null,
    value: ArchitectureDecision
  ): Promise<ArchitectureDecision> {
    await this.authority.require(actor, value.projectId, "PROJECT_MUTATE");
    assertValid("ArchitectureDecision", value);

    if (value.meta.recordVersion !== 1) {
      throw new TypeError(
        "A new ArchitectureDecision must start at recordVersion 1"
      );
    }
    if (value.supersedesId === value.id) {
      throw new TypeError("ArchitectureDecision cannot supersede itself");
    }
    if (value.supersedesId) {
      const superseded =
        await this.repository.findArchitectureDecisionById(value.supersedesId);
      if (!superseded || superseded.projectId !== value.projectId) {
        throw new TypeError(
          `Superseded ArchitectureDecision ${value.supersedesId} is not in this project`
        );
      }
    }

    return this.repository.createArchitectureDecision(value);
  }

  async updateArchitectureDecision(
    actor: AuthenticatedActor | null,
    value: ArchitectureDecision,
    expectedRecordVersion: number
  ): Promise<ArchitectureDecision> {
    await this.authority.require(actor, value.projectId, "PROJECT_MUTATE");
    assertValid("ArchitectureDecision", value);

    const current =
      await this.repository.findArchitectureDecisionById(value.id);
    if (!current || current.projectId !== value.projectId) {
      throw new TypeError(`Unknown ArchitectureDecision ${value.id}`);
    }

    if (
      current.status === "accepted" &&
      (current.title !== value.title ||
        current.context !== value.context ||
        current.decision !== value.decision ||
        !sameStrings(current.consequences, value.consequences))
    ) {
      throw new TypeError(
        "Accepted ArchitectureDecision content is immutable; create a superseding decision instead"
      );
    }

    return this.repository.updateArchitectureDecision(
      value,
      expectedRecordVersion
    );
  }

  async listRisks(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<readonly Risk[]> {
    await this.authority.require(actor, projectId, "PROJECT_READ");
    return this.repository.listRisksByProject(projectId);
  }

  async createRisk(
    actor: AuthenticatedActor | null,
    value: Risk
  ): Promise<Risk> {
    await this.authority.require(actor, value.projectId, "PROJECT_MUTATE");
    assertValid("Risk", value);
    await this.assertWorkLinks(value.projectId, value.linkedWorkPackageIds);
    if (value.meta.recordVersion !== 1) {
      throw new TypeError("A new Risk must start at recordVersion 1");
    }
    return this.repository.createRisk(value);
  }

  async updateRisk(
    actor: AuthenticatedActor | null,
    value: Risk,
    expectedRecordVersion: number
  ): Promise<Risk> {
    await this.authority.require(actor, value.projectId, "PROJECT_MUTATE");
    assertValid("Risk", value);
    await this.assertWorkLinks(value.projectId, value.linkedWorkPackageIds);
    return this.repository.updateRisk(value, expectedRecordVersion);
  }

  async listTechnicalDebt(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<readonly TechnicalDebt[]> {
    await this.authority.require(actor, projectId, "PROJECT_READ");
    return this.repository.listTechnicalDebtByProject(projectId);
  }

  async createTechnicalDebt(
    actor: AuthenticatedActor | null,
    value: TechnicalDebt
  ): Promise<TechnicalDebt> {
    await this.authority.require(actor, value.projectId, "PROJECT_MUTATE");
    assertValid("TechnicalDebt", value);
    await this.assertWorkLinks(value.projectId, value.linkedWorkPackageIds);
    if (value.meta.recordVersion !== 1) {
      throw new TypeError(
        "A new TechnicalDebt record must start at recordVersion 1"
      );
    }
    return this.repository.createTechnicalDebt(value);
  }

  async updateTechnicalDebt(
    actor: AuthenticatedActor | null,
    value: TechnicalDebt,
    expectedRecordVersion: number
  ): Promise<TechnicalDebt> {
    await this.authority.require(actor, value.projectId, "PROJECT_MUTATE");
    assertValid("TechnicalDebt", value);
    await this.assertWorkLinks(value.projectId, value.linkedWorkPackageIds);
    return this.repository.updateTechnicalDebt(
      value,
      expectedRecordVersion
    );
  }

  private async assertWorkLinks(
    projectId: string,
    linkedWorkPackageIds: readonly string[]
  ): Promise<void> {
    if (linkedWorkPackageIds.length === 0) return;

    const projectWork =
      await this.workQuality.listWorkPackagesByProject(projectId);
    const ids = new Set(projectWork.map((item) => item.id));
    const missing = linkedWorkPackageIds.filter((id) => !ids.has(id));

    if (missing.length > 0) {
      throw new TypeError(
        `Linked Work Packages are not canonical in this project: ${missing.join(", ")}`
      );
    }
  }
}
