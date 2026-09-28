import { createHash } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  ConstitutionAuthorityApplicationService,
  type ConstitutionLifecycleAttestationVerifier,
  type ConstitutionPublicationAttestationVerifier
} from "../../packages/application/src";
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
    await prisma.constitutionPublication.deleteMany();
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


  function stable(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => [key, stable(child)])
      );
    }
    return value;
  }

  function sha(value: string): string {
    return "sha256:" + createHash("sha256").update(value).digest("hex");
  }

  function authoritySetAttestation() {
    const policyVersion = "1.2.0";
    const components = [
      {
        id: "normative-document" as const,
        path: "docs/UNIVERSAL-CONSTITUTION.md",
        version: policyVersion,
        digest: sha("normative")
      },
      {
        id: "machine-contract" as const,
        path: "control/universal-constitution.contract.json",
        version: policyVersion,
        digest: sha("contract")
      },
      {
        id: "universal-template" as const,
        path: "packages/application/src/foundation-templates.ts",
        version: policyVersion,
        digest: sha("template")
      },
      {
        id: "policy-version" as const,
        path: "packages/application/src/constitution-authority.ts",
        version: policyVersion,
        digest: sha("policy")
      }
    ].sort((a, b) => a.id.localeCompare(b.id));
    return {
      schemaVersion: "1.0.0" as const,
      source: "trusted-ci-attestation" as const,
      policyId: "blueprint-os:universal-century-grade",
      policyVersion,
      sourceRevision: "c".repeat(40),
      ciRunId: "36365074322",
      components,
      authoritySetDigest: sha(
        JSON.stringify(
          stable({
            policyId: "blueprint-os:universal-century-grade",
            policyVersion,
            components
          })
        )
      ),
      productionReleaseAuthority: false as const
    };
  }

  function lifecycleVerifier(): ConstitutionLifecycleAttestationVerifier {
    return {
      id: "test:postgres-lifecycle-verifier",
      verifyPropagation: async () => true,
      verifyVerification: async () => true
    };
  }

  async function createRatifiedAmendment(
    app: ConstitutionAuthorityApplicationService,
    actor: { principalId: string }
  ) {
    const draft = await app.createDraft(
      actor,
      {
        targetPolicyVersion: "1.2.0",
        title: "Atomic publication amendment",
        problem: "Constitution authority files must publish as one exact set.",
        rationale: "Partial publication would create conflicting law sources.",
        affectedPillarIds: ["architectural-longevity"],
        affectedRequirementIds: ["module:governance:architectural-longevity"],
        compatibilityRisk: "high",
        migrationRequired: true
      },
      "2026-09-28T02:30:00.000Z"
    );
    await app.recordStageEvidence(
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
      "2026-09-28T02:31:00.000Z"
    );
    await app.recordStageEvidence(
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
      "2026-09-28T02:32:00.000Z"
    );
    await app.openRatification(
      actor,
      draft.proposal.id,
      3,
      "2026-09-28T02:33:00.000Z"
    );
    return app.ratify(
      actor,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 4,
        decision: "approve",
        note: "Exact human ratification."
      },
      "2026-09-28T02:34:00.000Z"
    );
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
  it("publishes one immutable Constitution authority set atomically", async () => {
    const actor = await owner();
    const verifier: ConstitutionPublicationAttestationVerifier = {
      id: "test:postgres-ci-verifier",
      verify: async () => true
    };
    const publicationService = new ConstitutionAuthorityApplicationService(
      repository,
      authority,
      verifier
    );
    const ratified = await createRatifiedAmendment(
      publicationService,
      actor
    );

    const result = await publicationService.publishFromTrustedAttestation(
      actor,
      {
        amendmentId: ratified.proposal.id,
        expectedRecordVersion: ratified.recordVersion,
        attestation: authoritySetAttestation(),
        note: "Publish exact CI-attested authority set."
      },
      "2026-09-28T02:35:00.000Z"
    );

    expect(result.amendment.state).toBe("published");
    expect(result.amendment.recordVersion).toBe(6);
    expect(result.amendment.productionReleaseAuthority).toBe(false);
    expect(result.publication.productionReleaseAuthority).toBe(false);

    const publications = await prisma.constitutionPublication.findMany({
      where: { amendmentId: ratified.proposal.id }
    });
    expect(publications).toHaveLength(1);
    expect(publications[0]).toMatchObject({
      amendmentRecordVersion: 5,
      policyVersion: "1.2.0",
      sourceRevision: "c".repeat(40),
      ciRunId: "36365074322",
      authoritySetDigest: authoritySetAttestation().authoritySetDigest,
      productionReleaseAuthority: false
    });

    const storedPublication =
      await repository.findPublicationByAmendmentId(ratified.proposal.id);
    expect(storedPublication?.id).toBe(result.publication.id);
    expect(storedPublication?.productionReleaseAuthority).toBe(false);

    const evidenceRows = await prisma.constitutionEvidence.findMany({
      where: {
        amendmentId: ratified.proposal.id,
        kind: "publication"
      }
    });
    expect(evidenceRows).toHaveLength(1);

    const revisions = await prisma.constitutionAmendmentRevision.findMany({
      where: { amendmentId: ratified.proposal.id },
      orderBy: { recordVersion: "asc" }
    });
    expect(revisions.map((row) => row.state)).toEqual([
      "draft",
      "impact-reviewed",
      "migration-ready",
      "ratification-ready",
      "ratified",
      "published"
    ]);

    await expect(
      publicationService.publishFromTrustedAttestation(
        actor,
        {
          amendmentId: ratified.proposal.id,
          expectedRecordVersion: 5,
          attestation: authoritySetAttestation(),
          note: "Duplicate publication must fail."
        },
        "2026-09-28T02:36:00.000Z"
      )
    ).rejects.toThrow(/stale/i);
  });


  it("persists the exact post-publication lifecycle through verified with append-only evidence", async () => {
    const actor = await owner();
    const publicationVerifier: ConstitutionPublicationAttestationVerifier = {
      id: "test:postgres-ci-verifier",
      verify: async () => true
    };
    const lifecycle = lifecycleVerifier();
    const lifecycleService = new ConstitutionAuthorityApplicationService(
      repository,
      authority,
      publicationVerifier,
      lifecycle
    );
    const ratified = await createRatifiedAmendment(lifecycleService, actor);
    const published = await lifecycleService.publishFromTrustedAttestation(
      actor,
      {
        amendmentId: ratified.proposal.id,
        expectedRecordVersion: ratified.recordVersion,
        attestation: authoritySetAttestation(),
        note: "Publish before proving propagation and verification."
      },
      "2026-09-28T02:35:00.000Z"
    );

    const propagating =
      await lifecycleService.beginPropagationFromTrustedAttestation(
        actor,
        {
          amendmentId: published.amendment.proposal.id,
          expectedRecordVersion: published.amendment.recordVersion,
          attestation: {
            schemaVersion: "1.0.0",
            kind: "constitution-propagation-attestation",
            source: "trusted-constitution-lifecycle-attestation",
            policyId: "blueprint-os:universal-century-grade",
            policyVersion: "1.2.0",
            amendmentId: published.amendment.proposal.id,
            publicationId: published.publication.id,
            sourceRevision: "d".repeat(40),
            workflowRunId: "36390000011",
            snapshotDigest: sha("postgres-propagation-snapshot"),
            totalRepositories: 2,
            currentRepositories: 1,
            migrationRequiredRepositories: 1,
            blockedRepositories: 0,
            exactReleaseRevisionCertified: false,
            productionReleaseAuthority: false
          },
          note: "Persist exact propagation snapshot evidence."
        },
        "2026-09-28T02:36:00.000Z"
      );

    expect(propagating.state).toBe("propagating");
    expect(propagating.recordVersion).toBe(7);

    const verified = await lifecycleService.verifyFromTrustedAttestation(
      actor,
      {
        amendmentId: propagating.proposal.id,
        expectedRecordVersion: propagating.recordVersion,
        attestation: {
          schemaVersion: "1.0.0",
          kind: "constitution-verification-attestation",
          source: "trusted-constitution-lifecycle-attestation",
          policyId: "blueprint-os:universal-century-grade",
          policyVersion: "1.2.0",
          amendmentId: propagating.proposal.id,
          publicationId: published.publication.id,
          sourceRevision: "e".repeat(40),
          workflowRunId: "36390000012",
          matrixDigest: sha("postgres-compliance-matrix"),
          totalRepositories: 2,
          compliantRepositories: 2,
          nonCompliantRepositories: 0,
          unverifiedRepositories: 0,
          migrationRequiredRepositories: 0,
          blockedRepositories: 0,
          exactReleaseRevisionCertified: false,
          productionReleaseAuthority: false
        },
        note: "Persist exact all-compliant verification evidence."
      },
      "2026-09-28T02:37:00.000Z"
    );

    expect(verified.state).toBe("verified");
    expect(verified.recordVersion).toBe(8);
    expect(verified.productionReleaseAuthority).toBe(false);

    const lifecycleEvidence = await prisma.constitutionEvidence.findMany({
      where: {
        amendmentId: ratified.proposal.id,
        kind: { in: ["propagation", "verification"] }
      },
      orderBy: { createdAt: "asc" }
    });
    expect(lifecycleEvidence.map((row) => row.kind)).toEqual([
      "propagation",
      "verification"
    ]);
    expect(
      lifecycleEvidence.every((row) => row.recordedByActorId === actor.principalId)
    ).toBe(true);

    const revisions = await prisma.constitutionAmendmentRevision.findMany({
      where: { amendmentId: ratified.proposal.id },
      orderBy: { recordVersion: "asc" }
    });
    expect(revisions.map((row) => row.state)).toEqual([
      "draft",
      "impact-reviewed",
      "migration-ready",
      "ratification-ready",
      "ratified",
      "published",
      "propagating",
      "verified"
    ]);
    expect(revisions.map((row) => row.recordVersion)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8
    ]);
  });

});
