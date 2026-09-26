import type { ProjectProfile } from "@blueprint-os/contracts";
import { validateProjectProfile } from "@blueprint-os/contracts";
import {
  RecordVersionConflictError,
  type ProjectProfileRepository
} from "@blueprint-os/core";

import type { BlueprintPrismaClient } from "./client";
import { Prisma } from "./generated/prisma/client";

function assertValidProfile(profile: unknown): asserts profile is ProjectProfile {
  const result = validateProjectProfile(profile);

  if (!result.valid) {
    const details = result.errors
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new TypeError(`Invalid ProjectProfile: ${details}`);
  }
}

function asJson(profile: ProjectProfile): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(profile)) as Prisma.InputJsonValue;
}

function fromJson(document: Prisma.JsonValue): ProjectProfile {
  assertValidProfile(document);
  return document;
}

function fromRow(row: {
  readonly id: string;
  readonly projectId: string;
  readonly schemaVersion: string;
  readonly recordVersion: number;
  readonly document: Prisma.JsonValue;
}): ProjectProfile {
  const profile = fromJson(row.document);

  if (
    profile.id !== row.id ||
    profile.projectId !== row.projectId ||
    profile.meta.schemaVersion !== row.schemaVersion ||
    profile.meta.recordVersion !== row.recordVersion
  ) {
    throw new Error(
      `Persistent profile metadata drift detected for project ${row.projectId}`
    );
  }

  return profile;
}

export class PostgresProjectProfileRepository
  implements ProjectProfileRepository
{
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  async createProjectWithProfile(
    profile: ProjectProfile
  ): Promise<ProjectProfile> {
    assertValidProfile(profile);

    await this.prisma.$transaction(async (tx) => {
      await tx.project.create({
        data: {
          id: profile.projectId
        }
      });

      await tx.projectProfile.create({
        data: {
          id: profile.id,
          projectId: profile.projectId,
          schemaVersion: profile.meta.schemaVersion,
          recordVersion: profile.meta.recordVersion,
          document: asJson(profile)
        }
      });
    });

    return profile;
  }

  async findProfileByProjectId(
    projectId: string
  ): Promise<ProjectProfile | null> {
    const row = await this.prisma.projectProfile.findUnique({
      where: { projectId }
    });

    return row ? fromRow(row) : null;
  }

  async listProfiles(): Promise<readonly ProjectProfile[]> {
    const rows = await this.prisma.projectProfile.findMany({
      orderBy: [{ updatedAt: "desc" }, { projectId: "asc" }]
    });

    return Object.freeze(rows.map(fromRow));
  }

  async listProfilesByProjectIds(
    projectIds: readonly string[]
  ): Promise<readonly ProjectProfile[]> {
    if (projectIds.length === 0) {
      return Object.freeze([]);
    }

    const rows = await this.prisma.projectProfile.findMany({
      where: {
        projectId: {
          in: [...new Set(projectIds)]
        }
      },
      orderBy: [{ updatedAt: "desc" }, { projectId: "asc" }]
    });

    return Object.freeze(rows.map(fromRow));
  }

  async updateProfile(
    profile: ProjectProfile,
    expectedRecordVersion: number
  ): Promise<ProjectProfile> {
    assertValidProfile(profile);

    if (profile.meta.recordVersion !== expectedRecordVersion + 1) {
      throw new TypeError(
        "Updated ProjectProfile recordVersion must increment exactly by one"
      );
    }

    const result = await this.prisma.projectProfile.updateMany({
      where: {
        projectId: profile.projectId,
        recordVersion: expectedRecordVersion
      },
      data: {
        schemaVersion: profile.meta.schemaVersion,
        recordVersion: profile.meta.recordVersion,
        document: asJson(profile)
      }
    });

    if (result.count !== 1) {
      throw new RecordVersionConflictError(
        profile.projectId,
        expectedRecordVersion
      );
    }

    return profile;
  }
}
