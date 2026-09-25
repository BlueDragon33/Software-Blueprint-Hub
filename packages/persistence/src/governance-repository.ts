import type {
  ArchitectureDecision,
  Risk,
  TechnicalDebt
} from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import {
  RecordVersionConflictError,
  type GovernanceRepository
} from "@blueprint-os/core";

import type { BlueprintPrismaClient } from "./client";
import { Prisma } from "./generated/prisma/client";

type GovernanceContractName =
  | "ArchitectureDecision"
  | "Risk"
  | "TechnicalDebt";

function assertValid<T>(
  name: GovernanceContractName,
  value: unknown
): asserts value is T {
  const result = validateContract(name, value);
  if (!result.valid) {
    const details = result.errors
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new TypeError(`Invalid ${name}: ${details}`);
  }
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function assertNextVersion(
  entityName: string,
  recordVersion: number,
  expectedRecordVersion: number
): void {
  if (recordVersion !== expectedRecordVersion + 1) {
    throw new TypeError(
      `Updated ${entityName} recordVersion must increment exactly by one`
    );
  }
}

export class PostgresGovernanceRepository implements GovernanceRepository {
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  async createArchitectureDecision(
    value: ArchitectureDecision
  ): Promise<ArchitectureDecision> {
    assertValid<ArchitectureDecision>("ArchitectureDecision", value);
    await this.prisma.architectureDecision.create({
      data: {
        id: value.id,
        projectId: value.projectId,
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        status: value.status,
        document: asJson(value)
      }
    });
    return value;
  }

  async findArchitectureDecisionById(
    id: string
  ): Promise<ArchitectureDecision | null> {
    const row = await this.prisma.architectureDecision.findUnique({
      where: { id }
    });
    if (!row) return null;
    assertValid<ArchitectureDecision>("ArchitectureDecision", row.document);
    return row.document;
  }

  async listArchitectureDecisionsByProject(
    projectId: string
  ): Promise<readonly ArchitectureDecision[]> {
    const rows = await this.prisma.architectureDecision.findMany({
      where: { projectId },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }]
    });
    return rows.map((row) => {
      assertValid<ArchitectureDecision>("ArchitectureDecision", row.document);
      return row.document;
    });
  }

  async updateArchitectureDecision(
    value: ArchitectureDecision,
    expectedRecordVersion: number
  ): Promise<ArchitectureDecision> {
    assertValid<ArchitectureDecision>("ArchitectureDecision", value);
    assertNextVersion(
      "ArchitectureDecision",
      value.meta.recordVersion,
      expectedRecordVersion
    );

    const result = await this.prisma.architectureDecision.updateMany({
      where: {
        id: value.id,
        projectId: value.projectId,
        recordVersion: expectedRecordVersion
      },
      data: {
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        status: value.status,
        document: asJson(value)
      }
    });

    if (result.count !== 1) {
      throw new RecordVersionConflictError(
        value.projectId,
        expectedRecordVersion
      );
    }
    return value;
  }

  async createRisk(value: Risk): Promise<Risk> {
    assertValid<Risk>("Risk", value);
    await this.prisma.risk.create({
      data: {
        id: value.id,
        projectId: value.projectId,
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        likelihood: value.likelihood,
        impact: value.impact,
        status: value.status,
        document: asJson(value)
      }
    });
    return value;
  }

  async findRiskById(id: string): Promise<Risk | null> {
    const row = await this.prisma.risk.findUnique({ where: { id } });
    if (!row) return null;
    assertValid<Risk>("Risk", row.document);
    return row.document;
  }

  async listRisksByProject(projectId: string): Promise<readonly Risk[]> {
    const rows = await this.prisma.risk.findMany({
      where: { projectId },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }]
    });
    return rows.map((row) => {
      assertValid<Risk>("Risk", row.document);
      return row.document;
    });
  }

  async updateRisk(
    value: Risk,
    expectedRecordVersion: number
  ): Promise<Risk> {
    assertValid<Risk>("Risk", value);
    assertNextVersion("Risk", value.meta.recordVersion, expectedRecordVersion);

    const result = await this.prisma.risk.updateMany({
      where: {
        id: value.id,
        projectId: value.projectId,
        recordVersion: expectedRecordVersion
      },
      data: {
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        likelihood: value.likelihood,
        impact: value.impact,
        status: value.status,
        document: asJson(value)
      }
    });

    if (result.count !== 1) {
      throw new RecordVersionConflictError(
        value.projectId,
        expectedRecordVersion
      );
    }
    return value;
  }

  async createTechnicalDebt(
    value: TechnicalDebt
  ): Promise<TechnicalDebt> {
    assertValid<TechnicalDebt>("TechnicalDebt", value);
    await this.prisma.technicalDebt.create({
      data: {
        id: value.id,
        projectId: value.projectId,
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        severity: value.severity,
        status: value.status,
        document: asJson(value)
      }
    });
    return value;
  }

  async findTechnicalDebtById(
    id: string
  ): Promise<TechnicalDebt | null> {
    const row = await this.prisma.technicalDebt.findUnique({ where: { id } });
    if (!row) return null;
    assertValid<TechnicalDebt>("TechnicalDebt", row.document);
    return row.document;
  }

  async listTechnicalDebtByProject(
    projectId: string
  ): Promise<readonly TechnicalDebt[]> {
    const rows = await this.prisma.technicalDebt.findMany({
      where: { projectId },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }]
    });
    return rows.map((row) => {
      assertValid<TechnicalDebt>("TechnicalDebt", row.document);
      return row.document;
    });
  }

  async updateTechnicalDebt(
    value: TechnicalDebt,
    expectedRecordVersion: number
  ): Promise<TechnicalDebt> {
    assertValid<TechnicalDebt>("TechnicalDebt", value);
    assertNextVersion(
      "TechnicalDebt",
      value.meta.recordVersion,
      expectedRecordVersion
    );

    const result = await this.prisma.technicalDebt.updateMany({
      where: {
        id: value.id,
        projectId: value.projectId,
        recordVersion: expectedRecordVersion
      },
      data: {
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        severity: value.severity,
        status: value.status,
        document: asJson(value)
      }
    });

    if (result.count !== 1) {
      throw new RecordVersionConflictError(
        value.projectId,
        expectedRecordVersion
      );
    }
    return value;
  }
}
