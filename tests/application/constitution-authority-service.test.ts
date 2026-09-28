import { describe, expect, it } from "vitest";

import {
  ConstitutionAuthorityApplicationService
} from "../../packages/application/src";
import {
  AuthorityService,
  ConstitutionalAuthorityDeniedError,
  type AuthorityRepository,
  type CanonicalConstitutionAmendmentRecord,
  type ConstitutionAuthorityRepository,
  type ConstitutionEvidenceRecord,
  type ConstitutionRatificationDecisionRecord,
  type PrincipalRecord,
  type ProjectRole,
  type ProjectRoleAssignment
} from "../../packages/core/src";

class FakeAuthorityRepository implements AuthorityRepository {
  async resolvePrincipal(): Promise<PrincipalRecord> {
    throw new Error("not used");
  }
  async bootstrapOwner(): Promise<PrincipalRecord> {
    throw new Error("not used");
  }
  async isSystemOwner(principalId: string): Promise<boolean> {
    return principalId === "principal:owner";
  }
  async findProjectRole(): Promise<ProjectRole | null> {
    return null;
  }
  async listProjectRolesForPrincipal(): Promise<readonly ProjectRoleAssignment[]> {
    return [];
  }
  async setProjectRole(): Promise<ProjectRoleAssignment> {
    throw new Error("not used");
  }
}

class FakeConstitutionRepository implements ConstitutionAuthorityRepository {
  record: CanonicalConstitutionAmendmentRecord | null = null;
  evidence: ConstitutionEvidenceRecord[] = [];
  decisions: ConstitutionRatificationDecisionRecord[] = [];

  async createAmendment(
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    this.record = record;
    return record;
  }

  async findAmendmentById(
    amendmentId: string
  ): Promise<CanonicalConstitutionAmendmentRecord | null> {
    return this.record?.proposal.id === amendmentId ? this.record : null;
  }

  async listAmendments(): Promise<readonly CanonicalConstitutionAmendmentRecord[]> {
    return this.record ? [this.record] : [];
  }

  async updateAmendment(
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    this.record = record;
    return record;
  }

  async appendEvidenceAndUpdate(
    evidence: ConstitutionEvidenceRecord,
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    this.evidence.push(evidence);
    this.record = record;
    return record;
  }

  async listEvidence(
    amendmentId: string
  ): Promise<readonly ConstitutionEvidenceRecord[]> {
    return this.evidence.filter((item) => item.amendmentId === amendmentId);
  }

  async appendRatificationDecisionAndUpdate(
    decision: ConstitutionRatificationDecisionRecord,
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    this.decisions.push(decision);
    this.record = record;
    return record;
  }

  async findRatificationDecision(
    amendmentId: string,
    amendmentRecordVersion: number
  ): Promise<ConstitutionRatificationDecisionRecord | null> {
    return (
      this.decisions.find(
        (item) =>
          item.amendmentId === amendmentId &&
          item.amendmentRecordVersion === amendmentRecordVersion
      ) ?? null
    );
  }

  async findRatificationDecisionById(
    decisionId: string
  ): Promise<ConstitutionRatificationDecisionRecord | null> {
    return this.decisions.find((item) => item.id === decisionId) ?? null;
  }
}

const owner = { principalId: "principal:owner" };
const intruder = { principalId: "principal:intruder" };
const now = "2026-09-28T01:00:00.000Z";
const digest = "sha256:" + "a".repeat(64);

function draftInput() {
  return {
    targetPolicyVersion: "1.2.0",
    title: "Strengthen long-term durability",
    problem: "Ageing evidence needs a stronger universal definition.",
    rationale: "Prevent build success from being treated as durability proof.",
    affectedPillarIds: ["long-term-durability"],
    affectedRequirementIds: ["gate:durability:ageing-regression"],
    compatibilityRisk: "medium" as const,
    migrationRequired: true
  };
}

function service() {
  const repository = new FakeConstitutionRepository();
  const authority = new AuthorityService(new FakeAuthorityRepository());
  return {
    repository,
    service: new ConstitutionAuthorityApplicationService(repository, authority)
  };
}

describe("CA-002/CA-003 Constitution Authority application service", () => {
  it("restricts global Constitutional Authority to the System Owner", async () => {
    const { service: app } = service();

    await expect(
      app.createDraft(intruder, draftInput(), now)
    ).rejects.toBeInstanceOf(ConstitutionalAuthorityDeniedError);
  });

  it("does not allow a target Constitution version to stay equal or move backwards", async () => {
    const { service: app } = service();

    await expect(
      app.createDraft(
        owner,
        { ...draftInput(), targetPolicyVersion: "1.1.0" },
        now
      )
    ).rejects.toThrow(/greater than the active Constitution version/i);
  });

  it("persists the gated path through human ratification without Production authority", async () => {
    const { service: app, repository } = service();

    const draft = await app.createDraft(owner, draftInput(), now);
    expect(draft.state).toBe("draft");
    expect(draft.recordVersion).toBe(1);

    const impact = await app.recordStageEvidence(
      owner,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 1,
        kind: "impact",
        source: "github-actions:impact-analysis",
        revision: "revision:impact-001",
        digest,
        note: "Impact review covers all governed repositories."
      },
      "2026-09-28T01:01:00.000Z"
    );
    expect(impact.state).toBe("impact-reviewed");
    expect(impact.recordVersion).toBe(2);
    expect(repository.evidence).toHaveLength(1);

    const migration = await app.recordStageEvidence(
      owner,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 2,
        kind: "migration",
        source: "blueprint-os:migration-plan",
        revision: "revision:migration-001",
        digest,
        note: "Migration waves preserve truthful non-compliance."
      },
      "2026-09-28T01:02:00.000Z"
    );
    expect(migration.state).toBe("migration-ready");
    expect(migration.recordVersion).toBe(3);

    const ready = await app.openRatification(
      owner,
      draft.proposal.id,
      3,
      "2026-09-28T01:03:00.000Z"
    );
    expect(ready.state).toBe("ratification-ready");
    expect(ready.recordVersion).toBe(4);

    const ratified = await app.ratify(
      owner,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 4,
        decision: "approve",
        note: "I reviewed the exact amendment, impact evidence and migration plan."
      },
      "2026-09-28T01:04:00.000Z"
    );

    expect(ratified.state).toBe("ratified");
    expect(ratified.recordVersion).toBe(5);
    expect(ratified.productionReleaseAuthority).toBe(false);
    expect(ratified.ratificationDecisionId).toMatch(
      /^constitution-ratification:/
    );
    expect(repository.decisions).toHaveLength(1);
    expect(repository.decisions[0]).toMatchObject({
      reviewerActorId: owner.principalId,
      source: "authenticated-user-action",
      decision: "approve",
      humanRatification: true,
      productionReleaseAuthority: false
    });

    const workspace = await app.read(owner, draft.proposal.id);
    expect(workspace?.ratificationDecision?.id).toBe(
      ratified.ratificationDecisionId
    );
  });

  it("rejects malformed evidence digests and stale amendment revisions", async () => {
    const { service: app } = service();
    const draft = await app.createDraft(owner, draftInput(), now);

    await expect(
      app.recordStageEvidence(
        owner,
        {
          amendmentId: draft.proposal.id,
          expectedRecordVersion: 1,
          kind: "impact",
          source: "review",
          revision: "revision:1",
          digest: "not-a-sha",
          note: "Invalid digest must not advance the amendment."
        },
        "2026-09-28T01:01:00.000Z"
      )
    ).rejects.toThrow(/sha256/i);

    await app.recordStageEvidence(
      owner,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 1,
        kind: "impact",
        source: "review",
        revision: "revision:1",
        digest,
        note: "Valid evidence."
      },
      "2026-09-28T01:01:00.000Z"
    );

    await expect(
      app.recordStageEvidence(
        owner,
        {
          amendmentId: draft.proposal.id,
          expectedRecordVersion: 1,
          kind: "impact",
          source: "review",
          revision: "revision:stale",
          digest,
          note: "Stale write."
        },
        "2026-09-28T01:02:00.000Z"
      )
    ).rejects.toThrow(/stale/i);
  });
});
