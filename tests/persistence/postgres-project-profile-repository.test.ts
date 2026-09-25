import { readFile } from "node:fs/promises";

import type { ProjectProfile } from "@blueprint-os/contracts";
import { validateProjectProfile } from "@blueprint-os/contracts";
import { RecordVersionConflictError } from "@blueprint-os/core";
import {
  createPrismaClient,
  PostgresProjectProfileRepository
} from "@blueprint-os/persistence";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const connectionString = process.env["DATABASE_URL"];
const describePostgres = connectionString ? describe : describe.skip;

async function loadProfile(): Promise<ProjectProfile> {
  const url = new URL(
    "../contracts/fixtures/v1/project-profile.valid.json",
    import.meta.url
  );
  const value: unknown = JSON.parse(await readFile(url, "utf8"));
  const validation = validateProjectProfile(value);

  if (!validation.valid) {
    throw new Error("Integration fixture is not a valid ProjectProfile");
  }

  return value as ProjectProfile;
}

function withIdentity(
  profile: ProjectProfile,
  values: {
    id: string;
    projectId: string;
    name?: string;
  }
): ProjectProfile {
  return {
    ...profile,
    id: values.id,
    projectId: values.projectId,
    name: values.name ?? profile.name,
    meta: {
      ...profile.meta
    }
  };
}

function nextVersion(profile: ProjectProfile): ProjectProfile {
  return {
    ...profile,
    meta: {
      ...profile.meta,
      recordVersion: profile.meta.recordVersion + 1,
      updatedAt: "2026-09-25T09:00:00Z"
    }
  };
}

describePostgres("PostgresProjectProfileRepository", () => {
  const prisma = createPrismaClient(connectionString!);
  const repository = new PostgresProjectProfileRepository(prisma);

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.projectProfile.deleteMany();
    await prisma.project.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("round-trips a validated canonical ProjectProfile", async () => {
    const profile = await loadProfile();

    await repository.createProjectWithProfile(profile);
    const stored = await repository.findProfileByProjectId(profile.projectId);

    expect(stored).toEqual(profile);
  });

  it("rejects stale recordVersion updates without overwriting newer state", async () => {
    const initial = await loadProfile();
    const version2 = nextVersion(initial);
    const staleVersion2 = {
      ...version2,
      name: "Stale overwrite attempt"
    };

    await repository.createProjectWithProfile(initial);
    await repository.updateProfile(version2, 1);

    await expect(
      repository.updateProfile(staleVersion2, 1)
    ).rejects.toBeInstanceOf(RecordVersionConflictError);

    const stored = await repository.findProfileByProjectId(initial.projectId);
    expect(stored).toEqual(version2);
  });

  it("rolls back Project creation when profile insertion fails", async () => {
    const base = await loadProfile();
    const first = withIdentity(base, {
      id: "profile:shared-rollback-id",
      projectId: "project:rollback-source"
    });
    const second = withIdentity(base, {
      id: "profile:shared-rollback-id",
      projectId: "project:rollback-target",
      name: "Rollback target"
    });

    await repository.createProjectWithProfile(first);

    await expect(
      repository.createProjectWithProfile(second)
    ).rejects.toBeTruthy();

    const leakedProject = await prisma.project.findUnique({
      where: { id: second.projectId }
    });

    expect(leakedProject).toBeNull();
  });
});
