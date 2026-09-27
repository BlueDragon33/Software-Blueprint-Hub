import {
  HumanProfessionalReviewApplicationService,
  p9019ProfessionalReviewCandidate
} from "../../packages/application/src";
import {
  AuthorityService,
  AuthorizationDeniedError
} from "../../packages/core/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresHumanProfessionalReviewDecisionRepository
} from "../../packages/persistence/src";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;
const projectId = p9019ProfessionalReviewCandidate.projectId;

describePostgres("P9-019 professional review PostgreSQL + authority integration", () => {
  const prisma = createPrismaClient(databaseUrl!);
  const authorityRepository = new PostgresAuthorityRepository(prisma);
  const authority = new AuthorityService(authorityRepository);
  const repository =
    new PostgresHumanProfessionalReviewDecisionRepository(prisma);
  const service = new HumanProfessionalReviewApplicationService(
    repository,
    authority
  );

  beforeEach(async () => {
    await prisma.humanProfessionalReviewDecision.deleteMany({
      where: { projectId }
    });
    await prisma.authorityAuditEvent.deleteMany({
      where: {
        OR: [
          { projectId },
          { actor: { providerSubject: { startsWith: "p9-019-" } } }
        ]
      }
    });
    await prisma.projectAuthority.deleteMany({ where: { projectId } });
    await prisma.principal.deleteMany({
      where: { providerSubject: { startsWith: "p9-019-" } }
    });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.project.create({ data: { id: projectId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function actor(
    subject: string,
    role: "REVIEWER" | "VIEWER"
  ): Promise<{ principalId: string }> {
    const principal = await authority.resolveIdentity({
      provider: "github",
      providerSubject: subject
    });
    await authorityRepository.setProjectRole(
      { projectId, principalId: principal.id, role },
      {
        actorPrincipalId: principal.id,
        targetPrincipalId: principal.id,
        projectId,
        action: "TEST_PROJECT_REVIEW_ROLE_SEEDED"
      }
    );
    return { principalId: principal.id };
  }

  it("persists one immutable approval for the exact candidate without Production authority", async () => {
    const reviewer = await actor("p9-019-reviewer", "REVIEWER");
    const decision = await service.record(
      reviewer,
      {
        decision: "approve",
        note: "Reviewed the exact refreshed candidate with no open findings.",
        candidateReviewedRevision:
          p9019ProfessionalReviewCandidate.reviewedRevision,
        candidateEvidenceDigest:
          p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
        acknowledgedFindingIds:
          p9019ProfessionalReviewCandidate.findings.map((finding) => finding.id)
      },
      "2026-09-27T06:00:00.000Z"
    );

    expect(decision.humanSignoff).toBe(true);
    expect(decision.p9020TransitionAllowed).toBe(true);
    expect(decision.productionReleaseAuthority).toBe(false);

    await expect(service.currentDecision(reviewer)).resolves.toMatchObject({
      decision: "approve",
      reviewerActorId: reviewer.principalId,
      productionReleaseAuthority: false
    });

    await expect(
      service.record(
        reviewer,
        {
          decision: "reject",
          note: "Attempt to rewrite the same exact candidate.",
          candidateReviewedRevision:
            p9019ProfessionalReviewCandidate.reviewedRevision,
          candidateEvidenceDigest:
            p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
          acknowledgedFindingIds: []
        },
        "2026-09-27T06:01:00.000Z"
      )
    ).rejects.toThrow(/already exists/);
  });

  it("denies VIEWER authority from reading or recording the review decision", async () => {
    const viewer = await actor("p9-019-viewer", "VIEWER");

    await expect(service.currentDecision(viewer)).rejects.toBeInstanceOf(
      AuthorizationDeniedError
    );
    await expect(
      service.record(
        viewer,
        {
          decision: "request-changes",
          note: "Viewer must not record review state.",
          candidateReviewedRevision:
            p9019ProfessionalReviewCandidate.reviewedRevision,
          candidateEvidenceDigest:
            p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
          acknowledgedFindingIds: []
        },
        "2026-09-27T06:02:00.000Z"
      )
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });
});
