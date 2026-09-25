import type {
  GateEvidence,
  QualityGate,
  WorkPackage
} from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import {
  RecordVersionConflictError,
  type WorkQualityRepository
} from "@blueprint-os/core";

import type { BlueprintPrismaClient } from "./client";
import { Prisma } from "./generated/prisma/client";

function assertValid<T>(
  name: "WorkPackage" | "QualityGate" | "GateEvidence",
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

export class PostgresWorkQualityRepository implements WorkQualityRepository {
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  async createWorkPackage(workPackage: WorkPackage): Promise<WorkPackage> {
    assertValid<WorkPackage>("WorkPackage", workPackage);
    await this.prisma.workPackage.create({
      data: {
        id: workPackage.id,
        projectId: workPackage.projectId,
        schemaVersion: workPackage.meta.schemaVersion,
        recordVersion: workPackage.meta.recordVersion,
        status: workPackage.status,
        document: asJson(workPackage)
      }
    });
    return workPackage;
  }

  async findWorkPackageById(id: string): Promise<WorkPackage | null> {
    const row = await this.prisma.workPackage.findUnique({ where: { id } });
    if (!row) return null;
    assertValid<WorkPackage>("WorkPackage", row.document);
    return row.document;
  }

  async listWorkPackagesByProject(
    projectId: string
  ): Promise<readonly WorkPackage[]> {
    const rows = await this.prisma.workPackage.findMany({
      where: { projectId },
      orderBy: { id: "asc" }
    });
    return rows.map((row) => {
      assertValid<WorkPackage>("WorkPackage", row.document);
      return row.document;
    });
  }

  async updateWorkPackage(
    workPackage: WorkPackage,
    expectedRecordVersion: number
  ): Promise<WorkPackage> {
    assertValid<WorkPackage>("WorkPackage", workPackage);
    if (workPackage.meta.recordVersion !== expectedRecordVersion + 1) {
      throw new TypeError(
        "Updated WorkPackage recordVersion must increment exactly by one"
      );
    }

    const result = await this.prisma.workPackage.updateMany({
      where: {
        id: workPackage.id,
        projectId: workPackage.projectId,
        recordVersion: expectedRecordVersion
      },
      data: {
        schemaVersion: workPackage.meta.schemaVersion,
        recordVersion: workPackage.meta.recordVersion,
        status: workPackage.status,
        document: asJson(workPackage)
      }
    });

    if (result.count !== 1) {
      throw new RecordVersionConflictError(
        workPackage.projectId,
        expectedRecordVersion
      );
    }
    return workPackage;
  }

  async createQualityGate(gate: QualityGate): Promise<QualityGate> {
    assertValid<QualityGate>("QualityGate", gate);
    await this.prisma.qualityGate.create({
      data: {
        id: gate.id,
        projectId: gate.projectId,
        schemaVersion: gate.meta.schemaVersion,
        recordVersion: gate.meta.recordVersion,
        status: gate.status,
        document: asJson(gate)
      }
    });
    return gate;
  }

  async findQualityGateById(id: string): Promise<QualityGate | null> {
    const row = await this.prisma.qualityGate.findUnique({ where: { id } });
    if (!row) return null;
    assertValid<QualityGate>("QualityGate", row.document);
    return row.document;
  }

  async listQualityGatesByProject(
    projectId: string
  ): Promise<readonly QualityGate[]> {
    const rows = await this.prisma.qualityGate.findMany({
      where: { projectId },
      orderBy: { id: "asc" }
    });
    return rows.map((row) => {
      assertValid<QualityGate>("QualityGate", row.document);
      return row.document;
    });
  }

  async updateQualityGate(
    gate: QualityGate,
    expectedRecordVersion: number
  ): Promise<QualityGate> {
    assertValid<QualityGate>("QualityGate", gate);
    if (gate.meta.recordVersion !== expectedRecordVersion + 1) {
      throw new TypeError(
        "Updated QualityGate recordVersion must increment exactly by one"
      );
    }

    const result = await this.prisma.qualityGate.updateMany({
      where: {
        id: gate.id,
        projectId: gate.projectId,
        recordVersion: expectedRecordVersion
      },
      data: {
        schemaVersion: gate.meta.schemaVersion,
        recordVersion: gate.meta.recordVersion,
        status: gate.status,
        document: asJson(gate)
      }
    });

    if (result.count !== 1) {
      throw new RecordVersionConflictError(
        gate.projectId,
        expectedRecordVersion
      );
    }
    return gate;
  }

  async createGateEvidence(evidence: GateEvidence): Promise<GateEvidence> {
    assertValid<GateEvidence>("GateEvidence", evidence);
    await this.prisma.gateEvidence.create({
      data: {
        id: evidence.id,
        gateId: evidence.gateId,
        kind: evidence.kind,
        source: evidence.source,
        revision: evidence.revision,
        document: asJson(evidence)
      }
    });
    return evidence;
  }

  async findGateEvidenceById(id: string): Promise<GateEvidence | null> {
    const row = await this.prisma.gateEvidence.findUnique({ where: { id } });
    if (!row) return null;
    assertValid<GateEvidence>("GateEvidence", row.document);
    return row.document;
  }

  async listGateEvidenceByGate(
    gateId: string
  ): Promise<readonly GateEvidence[]> {
    const rows = await this.prisma.gateEvidence.findMany({
      where: { gateId },
      orderBy: { id: "asc" }
    });
    return rows.map((row) => {
      assertValid<GateEvidence>("GateEvidence", row.document);
      return row.document;
    });
  }
}
