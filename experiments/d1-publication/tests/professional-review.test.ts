// D1 parity of tests/persistence/professional-review-postgres.test.ts blob 5fbebd854a4095902b02f1a9b1838d2c95e00043.
// Only fixture/provider setup differs. Original PostgreSQL tests remain unchanged.
import {newD1Fixture} from "../d1-fixture";
import {
  HumanProfessionalReviewApplicationService,
  p9019ProfessionalReviewCandidate
} from "../../../packages/application/src";
import {
  AuthorityService,
  AuthorizationDeniedError
} from "../../../packages/core/src";
import {D1HumanProfessionalReviewDecisionRepository} from "../../../packages/persistence/src/d1";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const projectId = p9019ProfessionalReviewCandidate.projectId;


describe("D1 actual workerd parity — professional-review",()=>{
  let f:Awaited<ReturnType<typeof newD1Fixture>>;
  let authority:AuthorityService;
  let service:HumanProfessionalReviewApplicationService;
  beforeEach(async()=>{f=await newD1Fixture();authority=f.authority;
    const repository=new D1HumanProfessionalReviewDecisionRepository(f.logs);
    service=new HumanProfessionalReviewApplicationService(repository,authority);
    await f.db.prepare('INSERT INTO "Project"(id) VALUES(?)').bind(projectId).run();
  },15000);
  afterEach(async()=>{await f?.dispose();});
  async function actor(
    subject: string,
    role: "REVIEWER" | "VIEWER"
  ): Promise<{ principalId: string }> {
    const principal = await authority.resolveIdentity({
      provider: "github",
      providerSubject: subject
    });
    await authority.grantProjectRole(f.admin,{projectId,principalId:principal.id,role});
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
