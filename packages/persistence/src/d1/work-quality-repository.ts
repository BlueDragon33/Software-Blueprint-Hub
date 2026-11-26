// Candidate adapter derived from 6ecb0c8602d80c157f408cf99312a1b3b3647852; not yet runtime-admitted.
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

import { D1DomainStore } from "../../../../experiments/d1-publication/d1-domain-store";

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

function asJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

export class D1WorkQualityRepository implements WorkQualityRepository {
  constructor(private readonly store: D1DomainStore) {}

  async createWorkPackage(workPackage: WorkPackage): Promise<WorkPackage> {
    assertValid<WorkPackage>("WorkPackage", workPackage);
    await this.store.create("WorkPackage", {
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
    const row = await this.store.findUnique("WorkPackage", { where: { id } });
    if (!row) return null;
    assertValid<WorkPackage>("WorkPackage", row.document);
    return row.document;
  }

  async listWorkPackagesByProject(
    projectId: string
  ): Promise<readonly WorkPackage[]> {
    const rows = await this.store.findMany("WorkPackage", {
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

    const result = await this.store.updateMany("WorkPackage", {
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
    await this.store.create("QualityGate", {
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
    const row = await this.store.findUnique("QualityGate", { where: { id } });
    if (!row) return null;
    assertValid<QualityGate>("QualityGate", row.document);
    return row.document;
  }

  async listQualityGatesByProject(
    projectId: string
  ): Promise<readonly QualityGate[]> {
    const rows = await this.store.findMany("QualityGate", {
      where: { projectId },
      orderBy: { id: "asc" }
    });
    return rows.map((row) => {
      assertValid<QualityGate>("QualityGate", row.document);
      return row.document;
    });
  }

  async listQualityGateEvidenceByProject(
    projectId: string
  ) {
    const rows = await this.store.findMany("QualityGate", {
      where: { projectId },
      orderBy: { id: "asc" },
      include: {
        evidence: {
          orderBy: [{ createdAt: "desc" }, { id: "asc" }]
        }
      }
    });

    return rows.map((row) => {
      assertValid<QualityGate>("QualityGate", row.document);
      const evidence = row.evidence.map((item) => {
        assertValid<GateEvidence>("GateEvidence", item.document);
        return item.document;
      });
      return Object.freeze({
        gate: row.document,
        evidence: Object.freeze(evidence)
      });
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

    const result = await this.store.updateMany("QualityGate", {
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
    await this.store.create("GateEvidence", {
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
    const row = await this.store.findUnique("GateEvidence", { where: { id } });
    if (!row) return null;
    assertValid<GateEvidence>("GateEvidence", row.document);
    return row.document;
  }

  async listGateEvidenceByGate(
    gateId: string
  ): Promise<readonly GateEvidence[]> {
    const rows = await this.store.findMany("GateEvidence", {
      where: { gateId },
      orderBy: { id: "asc" }
    });
    return rows.map((row) => {
      assertValid<GateEvidence>("GateEvidence", row.document);
      return row.document;
    });
  }
}
