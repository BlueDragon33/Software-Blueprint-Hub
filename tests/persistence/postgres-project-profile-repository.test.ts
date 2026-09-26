import { readFile } from "node:fs/promises";

import type { ProjectProfile } from "../../packages/contracts/src/index";
import { validateProjectProfile } from "../../packages/contracts/src/index";
import { RecordVersionConflictError } from "../../packages/core/src/index";
import {
  createPrismaClient,
  PostgresProjectProfileRepository
} from "../../packages/persistence/src/index";
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
    await prisma.projectProfile.deleteMany({
      where: {
        projectId: {
          in: [
            "project:persistence-roundtrip",
            "project:persistence-version",
            "project:rollback-source",
            "project:rollback-target",
            "project:registry-a",
            "project:registry-b",
            "project:identity-drift"
          ]
        }
      }
    });
    await prisma.project.deleteMany({
      where: {
        id: {
          in: [
            "project:persistence-roundtrip",
            "project:persistence-version",
            "project:rollback-source",
            "project:rollback-target",
            "project:registry-a",
            "project:registry-b"
          ]
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("round-trips a validated canonical ProjectProfile", async () => {
    const profile = withIdentity(await loadProfile(), {
      id: "profile:persistence-roundtrip",
      projectId: "project:persistence-roundtrip"
    });

    await repository.createProjectWithProfile(profile);
    const stored = await repository.findProfileByProjectId(profile.projectId);

    expect(stored).toEqual(profile);
  });

  it("lists all profiles and filters by authorized project IDs", async () => {
    const base = await loadProfile();
    const first = withIdentity(base, {
      id: "profile:registry-a",
      projectId: "project:registry-a",
      name: "Registry A"
    });
    const second = withIdentity(base, {
      id: "profile:registry-b",
      projectId: "project:registry-b",
      name: "Registry B"
    });

    await repository.createProjectWithProfile(first);
    await repository.createProjectWithProfile(second);

    const all = await repository.listProfiles();
    const filtered = await repository.listProfilesByProjectIds([
      second.projectId
    ]);

    expect(all.map((item) => item.projectId)).toEqual(
      expect.arrayContaining([first.projectId, second.projectId])
    );
    expect(filtered).toEqual([second]);
  });

  it("rejects stale recordVersion updates without overwriting newer state", async () => {
    const initial = withIdentity(await loadProfile(), {
      id: "profile:persistence-version",
      projectId: "project:persistence-version"
    });
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

  it("detects persisted profile identity drift between row and document", async () => {
    const profile = withIdentity(await loadProfile(), {
      id: "profile:identity-drift",
      projectId: "project:identity-drift"
    });

    await repository.createProjectWithProfile(profile);

    await prisma.projectProfile.update({
      where: { projectId: profile.projectId },
      data: {
        document: {
          ...profile,
          id: "profile:forged-identity"
        }
      }
    });

    await expect(
      repository.findProfileByProjectId(profile.projectId)
    ).rejects.toThrow(/Persistent profile metadata drift detected/);
  });

});
