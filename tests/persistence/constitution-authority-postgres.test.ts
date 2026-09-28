import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ConstitutionAuthorityApplicationService } from "../../packages/application/src";
import {
  AuthorityService,
  ConstitutionRecordVersionConflictError
} from "../../packages/core/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresConstitutionAuthorityRepository
} from "../../packages/persistence/src";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;
const digest = "sha256:" + "b".repeat(64);

describePostgres("CA-002/CA-003 Constitution Authority PostgreSQL integration", () => {
  const prisma = createPrismaClient(databaseUrl!);
  const authorityRepository = new PostgresAuthorityRepository(prisma);
  const authority = new AuthorityService(authorityRepository);
  const repository = new PostgresConstitutionAuthorityRepository(prisma);
  const service = new ConstitutionAuthorityApplicationService(
    repository,
    authority
  );

  beforeEach(async () => {
    await prisma.constitutionRatificationDecision.deleteMany();
    await prisma.constitutionEvidence.deleteMany();
    await prisma.constitutionAmendmentRevision.deleteMany();
    await prisma.constitutionAmendment.deleteMany();
    await prisma.systemBootstrap.deleteMany();
    await prisma.authorityAuditEvent.deleteMany({
      where: {
        actor: { providerSubject: { startsWith: "ca002-" } }
      }
    });
    await prisma.principal.deleteMany({
      where: { providerSubject: { startsWith: "ca002-" } }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function owner() {
    const principal = await authority.bootstrapOwner({
      provider: "github",
      providerSubject: "ca002-owner"
    });
    return { principalId: principal.id };
  }

  it("persists append-only amendment revisions and evidence in one canonical flow", async () => {
    const actor = await owner();
    const draft = await service.createDraft(
      actor,
      {
        targetPolicyVersion: "1.2.0",
        title: "Durability evidence amendment",
        problem: "Upgrade ageing evidence is underspecified.",
        rationale: "Long-lived projects require repeatable ageing proof.",
        affectedPillarIds: ["long-term-durability"],
        affectedRequirementIds: ["gate:durability:ageing-regression"],
        compatibilityRisk: "medium",
        migrationRequired: true
      },
      "2026-09-28T02:00:00.000Z"
    );

    expect(
      await prisma.constitutionAmendmentRevision.count({
        where: { amendmentId: draft.proposal.id }
      })
    ).toBe(1);

    const impact = await service.recordStageEvidence(
      actor,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 1,
        kind: "impact",
        source: "github-actions:impact",
        revision: "revision:impact",
        digest,
        note: "Impact analysis covers all governed repositories."
      },
      "2026-09-28T02:01:00.000Z"
    );

    expect(impact.state).toBe("impact-reviewed");
    expect(
      await prisma.constitutionEvidence.count({
        where: { amendmentId: draft.proposal.id, kind: "impact" }
      })
    ).toBe(1);
    expect(
      await prisma.constitutionAmendmentRevision.count({
        where: { amendmentId: draft.proposal.id }
      })
    ).toBe(2);

    const rows = await prisma.constitutionAmendmentRevision.findMany({
      where: { amendmentId: draft.proposal.id },
      orderBy: { recordVersion: "asc" }
    });
    expect(rows.map((row) => row.recordVersion)).toEqual([1, 2]);
    expect(rows.map((row) => row.state)).toEqual(["draft", "impact-reviewed"]);
  });

  it("rejects stale optimistic updates at the PostgreSQL boundary", async () => {
    const actor = await owner();
    const draft = await service.createDraft(
      actor,
      {
        targetPolicyVersion: "1.2.0",
        title: "Concurrency amendment",
        problem: "Concurrent constitutional edits must not overwrite each other.",
        rationale: "A constitutional record requires exact revision protection.",
        affectedPillarIds: ["structural-capacity"],
        affectedRequirementIds: ["gate:architecture:future-scale"],
        compatibilityRisk: "high",
        migrationRequired: true
      },
      "2026-09-28T02:10:00.000Z"
    );

    const impact = await service.recordStageEvidence(
      actor,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 1,
        kind: "impact",
        source: "review",
        revision: "revision:impact",
        digest,
        note: "First writer advances the record."
      },
      "2026-09-28T02:11:00.000Z"
    );

    await expect(
      repository.updateAmendment(
        {
          ...impact,
          recordVersion: 2,
          updatedAt: "2026-09-28T02:12:00.000Z"
        },
        1,
        actor.principalId,
        "STALE_WRITE_TEST"
      )
    ).rejects.toBeInstanceOf(ConstitutionRecordVersionConflictError);
  });

  it("records one exact human ratification decision without granting Production authority", async () => {
    const actor = await owner();
    const draft = await service.createDraft(
      actor,
      {
        targetPolicyVersion: "1.2.0",
        title: "Ratification amendment",
        problem: "Constitution publication needs an authenticated human decision.",
        rationale: "AI and CI evidence cannot substitute for ratification.",
        affectedPillarIds: ["architectural-longevity"],
        affectedRequirementIds: ["module:governance:architectural-longevity"],
        compatibilityRisk: "medium",
        migrationRequired: true
      },
      "2026-09-28T02:20:00.000Z"
    );

    await service.recordStageEvidence(
      actor,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 1,
        kind: "impact",
        source: "review",
        revision: "revision:impact",
        digest,
        note: "Impact evidence."
      },
      "2026-09-28T02:21:00.000Z"
    );
    await service.recordStageEvidence(
      actor,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 2,
        kind: "migration",
        source: "migration-plan",
        revision: "revision:migration",
        digest,
        note: "Migration evidence."
      },
      "2026-09-28T02:22:00.000Z"
    );
    await service.openRatification(
      actor,
      draft.proposal.id,
      3,
      "2026-09-28T02:23:00.000Z"
    );

    const ratified = await service.ratify(
      actor,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 4,
        decision: "approve",
        note: "I reviewed the exact amendment and evidence."
      },
      "2026-09-28T02:24:00.000Z"
    );

    expect(ratified.state).toBe("ratified");
    expect(ratified.productionReleaseAuthority).toBe(false);

    const decisions = await prisma.constitutionRatificationDecision.findMany({
      where: { amendmentId: draft.proposal.id }
    });
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({
      amendmentRecordVersion: 4,
      reviewerActorId: actor.principalId,
      source: "authenticated-user-action",
      decision: "approve",
      humanRatification: true,
      productionReleaseAuthority: false
    });

    const workspace = await service.read(actor, draft.proposal.id);
    expect(workspace?.ratificationDecision?.id).toBe(
      ratified.ratificationDecisionId
    );

    await expect(
      service.ratify(
        actor,
        {
          amendmentId: draft.proposal.id,
          expectedRecordVersion: 4,
          decision: "approve",
          note: "A second decision for the stale revision must fail."
        },
        "2026-09-28T02:25:00.000Z"
      )
    ).rejects.toThrow(/stale/i);
  });
});
