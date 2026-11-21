import { describe, expect, it } from "vitest";

import {
  createPatternPromotionProposal,
  reviewPatternPromotion,
  proposeReviewerCrossProjectLearning,
  suggestReviewerLearning,
  type ReviewerLearningCase,
  type ReviewerCaseVerification
} from "../../packages/application/src/pattern-governance";

const evidenceA = {
  projectId: "project:alpha",
  source: "release:alpha-v1",
  revision: "aaaaaaaa",
  observation: "A provenance-first registry prevented stale runtime state."
};

const evidenceB = {
  projectId: "project:beta",
  source: "release:beta-v2",
  revision: "bbbbbbbb",
  observation: "The same provenance-first registry prevented stale runtime state."
};

describe("P9-006 Pattern Promotion Governance", () => {
  it("fails closed when evidence comes from only one project", () => {
    const proposal = createPatternPromotionProposal({
      kind: "pattern",
      title: "Provenance-aware registry",
      summary: "Keep source revision and authority explicit.",
      evidence: [evidenceA]
    });

    expect(proposal.state).toBe("insufficient-evidence");
    expect(proposal.canonicalPublicationAllowed).toBe(false);
    expect(proposal.projectIds).toEqual(["project:alpha"]);
  });

  it("creates a review candidate only from distinct multi-project evidence", () => {
    const proposal = createPatternPromotionProposal({
      kind: "pattern",
      title: "Provenance-aware registry",
      summary: "Keep source revision and authority explicit.",
      evidence: [evidenceB, evidenceA, evidenceA]
    });

    expect(proposal.state).toBe("review-candidate");
    expect(proposal.projectIds).toEqual(["project:alpha", "project:beta"]);
    expect(proposal.evidence).toHaveLength(2);
    expect(proposal.requiresExplicitReview).toBe(true);
  });

  it("requires explicit approval before producing a publishable record", () => {
    const proposal = createPatternPromotionProposal({
      kind: "anti-pattern",
      title: "Green CI equals release readiness",
      summary: "Do not equate passing CI with Production authorization.",
      evidence: [evidenceA, evidenceB]
    });

    const rejected = reviewPatternPromotion(proposal, {
      reviewerId: "principal:reviewer",
      reviewedAt: "2026-09-26T18:20:00+07:00",
      source: "review:p9-006",
      decision: "reject",
      note: "Needs stronger evidence."
    });
    expect(rejected).toBeNull();

    const approved = reviewPatternPromotion(proposal, {
      reviewerId: "principal:reviewer",
      reviewedAt: "2026-09-26T18:21:00+07:00",
      source: "review:p9-006",
      decision: "approve",
      note: "Cross-project evidence is sufficient."
    });

    expect(approved).toMatchObject({
      kind: "anti-pattern",
      state: "approved-for-publication",
      projectIds: ["project:alpha", "project:beta"]
    });
    expect(approved?.provenanceHash).toMatch(/^sha256:/);
  });

  it("does not allow one-project evidence to bypass review governance", () => {
    const proposal = createPatternPromotionProposal({
      kind: "pattern",
      title: "Single-project shortcut",
      summary: "This must not publish.",
      evidence: [evidenceA]
    });

    expect(() =>
      reviewPatternPromotion(proposal, {
        reviewerId: "principal:reviewer",
        reviewedAt: "2026-09-26T18:22:00+07:00",
        source: "review:p9-006",
        decision: "approve",
        note: "Attempted approval."
      })
    ).toThrow(/multi-project evidence/i);
  });
});


describe("Reviewer cross-project learning — evidence-grounded candidate, never auto-published", () => {
  function caseFor(projectId: string, repoName: string, id: string): ReviewerLearningCase {
    return {
      caseId: "review-case:" + id,
      projectId, repository: "BlueDragon33/" + repoName,
      workPackageId: "review-case-work",
      sourceRevision: "1".repeat(40),
      fixRevision: "2".repeat(40),
      issueCode: "STALE_CAS",
      severity: "P1",
      outcome: "confirmed-repaired",
      reviewerA: {actorId: "principal:reviewer-a",
        credentialFingerprint: "sha256:" + "a".repeat(64), runId: "run-a-123"},
      reviewerB: {actorId: "principal:reviewer-b",
        credentialFingerprint: "sha256:" + "b".repeat(64), runId: "run-b-123"},
      bSourceDigest: "sha256:" + "c".repeat(64),
      bEvidenceDigest: "sha256:" + "d".repeat(64),
      evidenceRef: "https://github.com/BlueDragon33/" + repoName + "/pull/42",
      learning: "Recheck WorkPackage CAS and issuer freshness after async readback."
    };
  }
  function verifier(options: {stale?:boolean; forged?:boolean; unavailable?:boolean} = {}) {
    return {
      async verifyCase(item: ReviewerLearningCase): Promise<ReviewerCaseVerification | null> {
        if (options.unavailable) return null;
        return {
          caseId: item.caseId, sourceRevision: options.stale ? "f".repeat(40) : item.fixRevision,
          bSourceDigest: item.bSourceDigest, bEvidenceDigest: item.bEvidenceDigest,
          reviewerBActorId: options.forged ? item.reviewerA.actorId : item.reviewerB.actorId,
          signedAndIndependent: true, finalHeadVerified: true
        };
      }
    };
  }
  const cases = () => [
    caseFor("project:blueprint-os","Software-Blueprint-Hub","hub-cas"),
    caseFor("project:application-management","Application-Management","app-cas")
  ];
  const form = (items: readonly ReviewerLearningCase[] = cases()) => ({
    kind: "anti-pattern" as const,
    title: "Stale authority CAS after asynchronous inspection",
    summary: "A reviewer must reread canonical source and issuer state after an async review.",
    cases: items
  });
  it("admits only attested distinct-project cases into an advisory curation proposal", async () => {
    const result = await proposeReviewerCrossProjectLearning(form(),verifier());
    expect(result.kind).toBe("reviewer-learning-proposal");
    expect(result.pattern.state).toBe("review-candidate");
    expect(result.pattern.projectIds).toEqual([
      "project:application-management","project:blueprint-os"
    ]);
    expect(result.verifiedCaseIds).toEqual(["review-case:app-cas","review-case:hub-cas"]);
    expect(result.humanCurationRequired).toBe(true);
    expect(result.autoPublishAllowed).toBe(false);
    expect(result.canonicalMutationAllowed).toBe(false);
    expect(result.reviewerPermissionGranted).toBe(false);
  });
  it("denies missing verifier, unverified source, wrong B actor and stale final HEAD", async () => {
    const input=form();
    await expect(proposeReviewerCrossProjectLearning(input,null as never)).rejects.toThrow(/verifier/);
    await expect(proposeReviewerCrossProjectLearning(input,verifier({unavailable:true}))).rejects.toThrow(/verification missing/);
    await expect(proposeReviewerCrossProjectLearning(input,verifier({stale:true}))).rejects.toThrow(/verification missing/);
    await expect(proposeReviewerCrossProjectLearning(input,verifier({forged:true}))).rejects.toThrow(/verification missing/);
  });
  it("denies same A/B actor, credential fingerprint and execution run", async () => {
    for (const field of ["actorId","credentialFingerprint","runId"] as const) {
      const items=cases();items[0]={...items[0]!,reviewerB:{
        ...items[0]!.reviewerB,[field]:items[0]!.reviewerA[field]
      }};
      await expect(proposeReviewerCrossProjectLearning(form(items),verifier())).rejects.toThrow(/must be distinct/);
    }
  });
  it("denies duplicate cases and one project pretending to be two", async () => {
    const items=cases();items[1]={...items[1]!,caseId:items[0]!.caseId};
    await expect(proposeReviewerCrossProjectLearning(form(items),verifier())).rejects.toThrow(/duplicated case/);
    const sameProject=cases();sameProject[1]={...sameProject[1]!,projectId:sameProject[0]!.projectId};
    await expect(proposeReviewerCrossProjectLearning(form(sameProject),verifier())).rejects.toThrow(/distinct independently verified projects/);
  });
  it("denies fake repaired SHA, wrong repository evidence and oversized/unbounded memory", async () => {
    const items=cases();items[0]={...items[0]!,fixRevision:items[0]!.sourceRevision};
    await expect(proposeReviewerCrossProjectLearning(form(items),verifier())).rejects.toThrow(/distinct confirmed fix revision/);
    const foreign=cases();foreign[0]={...foreign[0]!,evidenceRef:"https://github.com/BlueDragon33/Other/pull/6"};
    await expect(proposeReviewerCrossProjectLearning(form(foreign),verifier())).rejects.toThrow(/bounded project case/);
    await expect(proposeReviewerCrossProjectLearning(form(Array.from({length:21},(_,i)=>caseFor(
      "project:blueprint-os","Software-Blueprint-Hub","extra-"+i
    ))),verifier())).rejects.toThrow(/bounded cross-project/);
  });
  it("retrieves approved historical patterns only as source-revalidation suggestions", () => {
    const proposal = createPatternPromotionProposal({
      kind:"anti-pattern",title:"Stale CAS review after asynchronous inspection",
      summary:"Revalidate issuer and canonical WorkPackage on final HEAD.",
      evidence:[evidenceA,evidenceB]
    });
    const approved = reviewPatternPromotion(proposal, {
      reviewerId:"principal:human-curator",reviewedAt:"2026-11-21T15:00:00.000Z",
      source:"canonical:owner-review",decision:"approve",note:"Corroborated across projects"
    });
    expect(approved).not.toBeNull();
    const result=suggestReviewerLearning([approved!],{projectId:"project:blueprint-os",text:"stale cas"});
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      recordId:approved!.id,useStatus:"REVALIDATE_CURRENT_SOURCE",
      autonomousFixAllowed:false
    });
    expect(suggestReviewerLearning([],{projectId:"project:blueprint-os",text:"stale cas"})).toEqual([]);
  });
});
