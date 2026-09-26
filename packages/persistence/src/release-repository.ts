import type {
  LessonLearned,
  ReleaseRecord
} from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import {
  RecordVersionConflictError,
  type ReleaseRepository
} from "@blueprint-os/core";

import type { BlueprintPrismaClient } from "./client";
import { Prisma } from "./generated/prisma/client";

type ReleaseContractName = "ReleaseRecord" | "LessonLearned";

function assertValid<T>(
  name: ReleaseContractName,
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

export class PostgresReleaseRepository implements ReleaseRepository {
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  async createRelease(value: ReleaseRecord): Promise<ReleaseRecord> {
    assertValid<ReleaseRecord>("ReleaseRecord", value);
    await this.prisma.releaseRecord.create({
      data: {
        id: value.id,
        projectId: value.projectId,
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        version: value.version,
        revision: value.revision,
        environment: value.environment,
        status: value.status,
        document: asJson(value)
      }
    });
    return value;
  }

  async findReleaseById(id: string): Promise<ReleaseRecord | null> {
    const row = await this.prisma.releaseRecord.findUnique({ where: { id } });
    if (!row) return null;
    assertValid<ReleaseRecord>("ReleaseRecord", row.document);
    return row.document;
  }

  async listReleasesByProject(
    projectId: string
  ): Promise<readonly ReleaseRecord[]> {
    const rows = await this.prisma.releaseRecord.findMany({
      where: { projectId },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }]
    });

    return rows.map((row) => {
      assertValid<ReleaseRecord>("ReleaseRecord", row.document);
      return row.document;
    });
  }

  async updateRelease(
    value: ReleaseRecord,
    expectedRecordVersion: number
  ): Promise<ReleaseRecord> {
    assertValid<ReleaseRecord>("ReleaseRecord", value);
    assertNextVersion(
      "ReleaseRecord",
      value.meta.recordVersion,
      expectedRecordVersion
    );

    const result = await this.prisma.releaseRecord.updateMany({
      where: {
        id: value.id,
        projectId: value.projectId,
        recordVersion: expectedRecordVersion
      },
      data: {
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        version: value.version,
        revision: value.revision,
        environment: value.environment,
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

  async createLesson(value: LessonLearned): Promise<LessonLearned> {
    assertValid<LessonLearned>("LessonLearned", value);
    await this.prisma.lessonLearned.create({
      data: {
        id: value.id,
        projectId: value.projectId,
        releaseId: value.releaseId ?? null,
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        category: value.category,
        document: asJson(value)
      }
    });
    return value;
  }

  async findLessonById(id: string): Promise<LessonLearned | null> {
    const row = await this.prisma.lessonLearned.findUnique({ where: { id } });
    if (!row) return null;
    assertValid<LessonLearned>("LessonLearned", row.document);
    return row.document;
  }

  async listLessonsByProject(
    projectId: string
  ): Promise<readonly LessonLearned[]> {
    const rows = await this.prisma.lessonLearned.findMany({
      where: { projectId },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }]
    });

    return rows.map((row) => {
      assertValid<LessonLearned>("LessonLearned", row.document);
      return row.document;
    });
  }

  async updateLesson(
    value: LessonLearned,
    expectedRecordVersion: number
  ): Promise<LessonLearned> {
    assertValid<LessonLearned>("LessonLearned", value);
    assertNextVersion(
      "LessonLearned",
      value.meta.recordVersion,
      expectedRecordVersion
    );

    const result = await this.prisma.lessonLearned.updateMany({
      where: {
        id: value.id,
        projectId: value.projectId,
        recordVersion: expectedRecordVersion
      },
      data: {
        releaseId: value.releaseId ?? null,
        schemaVersion: value.meta.schemaVersion,
        recordVersion: value.meta.recordVersion,
        category: value.category,
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
