// Candidate adapter derived from 8cc23a81c486c9708f977fc340e91f0493c44e76; not yet runtime-admitted.
import type { ProjectProfile } from "@blueprint-os/contracts";
import { validateProjectProfile } from "@blueprint-os/contracts";
import {
  RecordVersionConflictError,
  type ProjectProfileRepository
} from "@blueprint-os/core";

import { D1DomainStore, type DocumentRow } from "../../../../experiments/d1-publication/d1-domain-store";

function assertValidProfile(profile: unknown): asserts profile is ProjectProfile {
  const result = validateProjectProfile(profile);

  if (!result.valid) {
    const details = result.errors
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new TypeError(`Invalid ProjectProfile: ${details}`);
  }
}

function asJson(profile: ProjectProfile): unknown {
  return JSON.parse(JSON.stringify(profile));
}

function fromJson(document: unknown): ProjectProfile {
  assertValidProfile(document);
  return document;
}

function fromRow(row: DocumentRow): ProjectProfile {
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

export class D1ProjectProfileRepository
  implements ProjectProfileRepository
{
  constructor(private readonly store: D1DomainStore) {}

  async createProjectWithProfile(
    profile: ProjectProfile
  ): Promise<ProjectProfile> {
    assertValidProfile(profile);

    await this.store.createProjectWithProfile(profile.projectId, {
      id: profile.id,
      projectId: profile.projectId,
      schemaVersion: profile.meta.schemaVersion,
      recordVersion: profile.meta.recordVersion,
      document: asJson(profile)
    });

    return profile;
  }

  async findProfileByProjectId(
    projectId: string
  ): Promise<ProjectProfile | null> {
    const row = await this.store.findUnique("ProjectProfile", {
      where: { projectId }
    });

    return row ? fromRow(row) : null;
  }

  async listProfiles(): Promise<readonly ProjectProfile[]> {
    const rows = await this.store.findMany("ProjectProfile", {
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

    const rows = await this.store.findMany("ProjectProfile", {
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

    const result = await this.store.updateMany("ProjectProfile", {
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
