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

    if (!row) {
      return null;
    }

    const profile = fromJson(row.document);

    if (
      profile.meta.schemaVersion !== row.schemaVersion ||
      profile.meta.recordVersion !== row.recordVersion
    ) {
      throw new Error(
        `Persistent profile metadata drift detected for project ${projectId}`
      );
    }

    return profile;
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
