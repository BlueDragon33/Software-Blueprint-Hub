// D1 parity of tests/persistence/postgres-project-profile-repository.test.ts blob 8c7bc7c5bc0be7d4007756b1ba80a9f4b51b3360.
// Only fixture/provider setup differs. Original PostgreSQL tests remain unchanged.
import {newD1Fixture} from "../d1-fixture";
import { readFile } from "node:fs/promises";

import type { ProjectProfile } from "../../../packages/contracts/src/index";
import { validateProjectProfile } from "../../../packages/contracts/src/index";
import { RecordVersionConflictError } from "../../../packages/core/src/index";
import {D1ProjectProfileRepository} from "../../../packages/persistence/src/d1";
import { afterEach, beforeEach, describe, expect, it } from "vitest";


async function loadProfile(): Promise<ProjectProfile> {
  const url = new URL(
    "../../../tests/contracts/fixtures/v1/project-profile.valid.json",
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


describe("D1 actual workerd parity — project-profile",()=>{
  let f:Awaited<ReturnType<typeof newD1Fixture>>;
  
  let repository:D1ProjectProfileRepository;
  beforeEach(async()=>{f=await newD1Fixture();
    repository=new D1ProjectProfileRepository(f.domain);
  },15000);
  afterEach(async()=>{await f?.dispose();});
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

    const leakedProject=await f.db.prepare('SELECT id FROM "Project" WHERE id=?').bind(second.projectId).first();

    expect(leakedProject).toBeNull();
  });

  it("detects persisted profile identity drift between row and document", async () => {
    const profile = withIdentity(await loadProfile(), {
      id: "profile:identity-drift",
      projectId: "project:identity-drift"
    });

    await repository.createProjectWithProfile(profile);

    await f.db.prepare('UPDATE "ProjectProfile" SET document=? WHERE "projectId"=?').bind(JSON.stringify({...profile,id:"profile:forged-identity"}),profile.projectId).run();

    await expect(
      repository.findProfileByProjectId(profile.projectId)
    ).rejects.toThrow(/Persistent profile metadata drift detected/);
  });

});
