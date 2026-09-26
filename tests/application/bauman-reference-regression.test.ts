import { describe, expect, it } from "vitest";

import type {
  GateEvidence,
  ProjectProfile,
  QualityGate,
  ResolvedBlueprint,
  WorkPackage
} from "../../packages/contracts/src";
import {
  AuthorityService,
  type AuthenticatedIdentity,
  type AuthorityAuditInput,
  type AuthorityRepository,
  type PrincipalRecord,
  type ProjectProfileRepository,
  type ProjectRole,
  type ProjectRoleAssignment
} from "../../packages/core/src";
import {
  KnowledgeLibraryApplicationService,
  ProjectRegistryApplicationService,
  createPromptProjection,
  findReferenceImportManifest,
  listReferenceImportManifests,
  type PromptProjectionSource
} from "../../packages/application/src";

const projectId = "project:p8-regression-unrelated";

const profile: ProjectProfile = {
  id: "profile:p8-regression-unrelated",
  projectId,
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 4,
    createdAt: "2026-09-26T16:45:00+07:00",
    updatedAt: "2026-09-26T16:45:00+07:00"
  },
  name: "Unrelated Canonical Project",
  projectType: "web-application",
  blueprintLevel: "B3",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Remain isolated from Reference Case imports."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  deploymentTarget: "managed-web",
  expectedLifetime: "long-lived"
};

const blueprint: ResolvedBlueprint = {
  resolutionId: "resolution:p8-regression-unrelated",
  resolverVersion: "1.0.0",
  inputFingerprint: "abcdef1234567890abcdef1234567890",
  projectId,
  profileRecordVersion: 4,
  activatedTemplates: [
    {
      id: "template:level:b3",
      version: "3.0.0",
      authorityLayer: "blueprint-level"
    }
  ],
  requiredModules: ["module:architecture:context"],
  requiredGates: ["gate:p8-regression"],
  dependencyEdges: [],
  rationale: [
    {
      targetId: "module:architecture:context",
      sourceId: "template:level:b3",
      reason: "Regression fixture requires a stable architecture module."
    }
  ]
};

const work: WorkPackage = {
  id: "work-package:p8-regression",
  projectId,
  title: "Protect unrelated project state",
  purpose: "Prove Reference Case reads cannot mutate canonical project state.",
  dependencies: [],
  acceptanceCriteria: ["Canonical state remains unchanged."],
  qualityGateIds: ["gate:p8-regression"],
  status: "testing",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 2,
    createdAt: "2026-09-26T16:45:00+07:00",
    updatedAt: "2026-09-26T16:45:00+07:00"
  }
};

const gate: QualityGate = {
  id: "gate:p8-regression",
  projectId,
  name: "P8 regression quality gate",
  requirements: ["Exact unrelated-project evidence remains authoritative."],
  status: "pending",
  evidenceIds: ["evidence:p8-regression"],
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 2,
    createdAt: "2026-09-26T16:45:00+07:00",
    updatedAt: "2026-09-26T16:45:00+07:00"
  }
};

const evidence: GateEvidence = {
  id: "evidence:p8-regression",
  gateId: gate.id,
  kind: "test",
  source: "github-actions:p8-regression",
  revision: "unrelated-project-revision-001",
  createdAt: "2026-09-26T16:45:00+07:00"
};

class MemoryProfiles implements ProjectProfileRepository {
  constructor(private readonly values: readonly ProjectProfile[]) {}

  async createProjectWithProfile(value: ProjectProfile): Promise<ProjectProfile> {
    return value;
  }

  async findProfileByProjectId(id: string): Promise<ProjectProfile | null> {
    return this.values.find((item) => item.projectId === id) ?? null;
  }

  async listProfiles(): Promise<readonly ProjectProfile[]> {
    return this.values;
  }

  async listProfilesByProjectIds(ids: readonly string[]): Promise<readonly ProjectProfile[]> {
    return this.values.filter((item) => ids.includes(item.projectId));
  }

  async updateProfile(value: ProjectProfile): Promise<ProjectProfile> {
    return value;
  }
}

class MemoryAuthority implements AuthorityRepository {
  ownerId: string | null = null;
  readonly roles: ProjectRoleAssignment[] = [];

  async resolvePrincipal(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return {
      id: `principal:${identity.providerSubject}`,
      provider: identity.provider,
      providerSubject: identity.providerSubject,
      email: identity.email ?? null
    };
  }

  async bootstrapOwner(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    const principal = await this.resolvePrincipal(identity);
    this.ownerId = principal.id;
    return principal;
  }

  async isSystemOwner(principalId: string): Promise<boolean> {
    return principalId === this.ownerId;
  }

  async findProjectRole(
    targetProjectId: string,
    principalId: string
  ): Promise<ProjectRole | null> {
    return (
      this.roles.find(
        (item) =>
          item.projectId === targetProjectId && item.principalId === principalId
      )?.role ?? null
    );
  }

  async listProjectRolesForPrincipal(
    principalId: string
  ): Promise<readonly ProjectRoleAssignment[]> {
    return this.roles.filter((item) => item.principalId === principalId);
  }

  async setProjectRole(
    assignment: ProjectRoleAssignment,
    _audit: AuthorityAuditInput
  ): Promise<ProjectRoleAssignment> {
    this.roles.push(assignment);
    return assignment;
  }
}

function promptSource(): PromptProjectionSource {
  return {
    profile,
    blueprint,
    templateVersions: [{ id: "template:level:b3", version: "3.0.0" }],
    workPackages: [work],
    qualityGates: [gate],
    evidence: [evidence]
  };
}

describe("P8-006 Bauman Reference Case regression", () => {
  it("preserves exact frozen provenance while carrying zero project/release authority", () => {
    const manifest = findReferenceImportManifest("bauman-nextgen-v1");

    expect(manifest).not.toBeNull();
    expect(manifest?.source).toMatchObject({
      repository: "BlueDragon33/Bauman-master-ai-system",
      revision: "52b2a581a9c38a7060e95209e94c3087764f6d5f"
    });
    expect(manifest?.authority).toEqual({
      canonicalProjectState: false,
      qualityGateEvidence: false,
      releaseAuthority: false,
      accessAuthority: false
    });
    expect(manifest?.driftPolicy).toMatchObject({
      snapshotMode: "frozen",
      networkRequiredForCanonicalRead: false,
      updateMode: "new-observation"
    });
  });

  it("keeps Reference Case knowledge outside canonical Project and Quality state", () => {
    const library = new KnowledgeLibraryApplicationService();
    const item = library.find("knowledge:reference-case:bauman-nextgen-v1");

    expect(item).toMatchObject({
      kind: "reference-case",
      authorityLayer: "reference"
    });
    expect(item).not.toHaveProperty("projectId");
    expect(item).not.toHaveProperty("readiness");
    expect(item).not.toHaveProperty("gateStatus");
  });

  it("does not mutate or enumerate an unrelated canonical project through Reference Import reads", async () => {
    const authorityRepository = new MemoryAuthority();
    const authority = new AuthorityService(authorityRepository);
    const owner = await authority.bootstrapOwner({
      provider: "github",
      providerSubject: "p8-regression-owner"
    });
    const registry = new ProjectRegistryApplicationService(
      new MemoryProfiles([profile]),
      authority
    );

    const before = await registry.list({ principalId: owner.id });
    const canonicalBefore = structuredClone(profile);

    expect(listReferenceImportManifests()).toHaveLength(1);
    expect(findReferenceImportManifest("bauman-nextgen-v1")).not.toBeNull();

    const after = await registry.list({ principalId: owner.id });

    expect(after).toEqual(before);
    expect(profile).toEqual(canonicalBefore);
    expect(after).toHaveLength(1);
    expect(after[0]?.projectId).toBe(projectId);
    expect(after.some((item) => item.projectId.includes("bauman"))).toBe(false);
  });

  it("leaves unrelated Prompt and Quality evidence deterministic after Reference Case access", () => {
    const before = createPromptProjection(
      promptSource(),
      "2026-09-26T16:46:00+07:00"
    );

    findReferenceImportManifest("bauman-nextgen-v1");

    const after = createPromptProjection(
      promptSource(),
      "2026-09-26T16:47:00+07:00"
    );

    expect(after.sourceRevision).toBe(before.sourceRevision);
    expect(after.contentHash).toBe(before.contentHash);
    expect(after.content).toBe(before.content);
    expect(after.content).toContain(evidence.source);
    expect(after.content).toContain(evidence.revision);
    expect(after.content).not.toContain("bauman-nextgen");
    expect(after.content).not.toContain("52b2a581a9c38a7060e95209e94c3087764f6d5f");
  });
});
