// Candidate adapter derived from f9b6ef74822e5ed396f8ce607992d774c8e1d5ed; not yet runtime-admitted.
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

import { D1DomainStore } from "../../../../experiments/d1-publication/d1-domain-store";

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

function asJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
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

export class D1GovernanceRepository implements GovernanceRepository {
  constructor(private readonly store: D1DomainStore) {}

  async createArchitectureDecision(
    value: ArchitectureDecision
  ): Promise<ArchitectureDecision> {
    assertValid<ArchitectureDecision>("ArchitectureDecision", value);
    await this.store.create("ArchitectureDecision", {
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
    const row = await this.store.findUnique("ArchitectureDecision", {
      where: { id }
    });
    if (!row) return null;
    assertValid<ArchitectureDecision>("ArchitectureDecision", row.document);
    return row.document;
  }

  async listArchitectureDecisionsByProject(
    projectId: string
  ): Promise<readonly ArchitectureDecision[]> {
    const rows = await this.store.findMany("ArchitectureDecision", {
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

    const result = await this.store.updateMany("ArchitectureDecision", {
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
    await this.store.create("Risk", {
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
    const row = await this.store.findUnique("Risk", { where: { id } });
    if (!row) return null;
    assertValid<Risk>("Risk", row.document);
    return row.document;
  }

  async listRisksByProject(projectId: string): Promise<readonly Risk[]> {
    const rows = await this.store.findMany("Risk", {
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

    const result = await this.store.updateMany("Risk", {
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
    await this.store.create("TechnicalDebt", {
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
    const row = await this.store.findUnique("TechnicalDebt", { where: { id } });
    if (!row) return null;
    assertValid<TechnicalDebt>("TechnicalDebt", row.document);
    return row.document;
  }

  async listTechnicalDebtByProject(
    projectId: string
  ): Promise<readonly TechnicalDebt[]> {
    const rows = await this.store.findMany("TechnicalDebt", {
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

    const result = await this.store.updateMany("TechnicalDebt", {
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
