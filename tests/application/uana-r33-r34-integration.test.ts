import { describe, expect, it } from "vitest";
import { buildNextActionBlueprintCandidate } from "../../packages/application/src/next-action-blueprint.candidate";
import { createUanaProposal, type UanaSource } from "../../packages/application/src/universal-active-next-action";

const projectId = "project:blueprint-os";
const gitHeadSha = "b".repeat(40);
const canonicalSourceRevision = "sha256:" + "c".repeat(64);
const r33 = {
  projectId, profileVersion: 7, actionKind: "review-candidate" as const,
  actionLabel: "Review isolated candidate", reason: "Integration QA pending",
  readinessState: "blocked" as const, evidenceFreshness: "recorded-unverified" as const,
};
const uana: UanaSource = {
  projectId, projectName: "Blueprint Hub OS", constitutionVersion: "1.3.0",
  sourceRevision: canonicalSourceRevision, projectionRevision: canonicalSourceRevision,
  projectionId: "projection:hub-qa", headSha: gitHeadSha,
  repository: "BlueDragon33/Software-Blueprint-Hub",
  workPackages: [{ projectId, id: "R2-R3", title: "Integration QA",
    status: "blocked", dependencies: [], qualityGateIds: [] }],
  gates: [], requiredGateIds: [],
};

describe("R2-R3 source contract interoperability: fail closed, no authority bridge", () => {
  it("keeps Git HEAD and projection digest in distinct fields", () => {
    const legacy = buildNextActionBlueprintCandidate({ ...r33, sourceRevision: gitHeadSha });
    const proposal = createUanaProposal(uana)!;
    expect(legacy.sourceRevision).toBe(gitHeadSha);
    expect(proposal.context.sourceRevision).toBe(canonicalSourceRevision);
    expect(proposal.context.headSha).toBe(gitHeadSha);
    expect(proposal.candidateOnly).toBe(true);
    expect(proposal.requiresOwnerSend).toBe(true);
    expect(proposal.qualityGatePassed).toBe(false);
    expect(proposal.productionAuthorized).toBe(false);
  });

  it("rejects a Git SHA in UANA's canonical digest field", () => {
    expect(() => createUanaProposal({ ...uana,
      sourceRevision: gitHeadSha, projectionRevision: gitHeadSha,
    })).toThrow(/canonical source revision/);
  });

  it("does not treat the projection digest as an R33 Git revision", () => {
    const legacy = buildNextActionBlueprintCandidate({ ...r33,
      sourceRevision: canonicalSourceRevision,
    });
    expect(legacy.sourceRevision).toBe("UNVERIFIED");
    expect(legacy.sourceTrust).toBe("source-revision-unverified");
  });

  it("rejects stale projection digest, fake Git HEAD, and foreign project Work Package", () => {
    expect(() => createUanaProposal({ ...uana,
      projectionRevision: "sha256:" + "d".repeat(64),
    })).toThrow(/stale prompt projection/);
    expect(() => createUanaProposal({ ...uana, headSha: "sha256:" + "e".repeat(64) }))
      .toThrow(/Git HEAD/);
    expect(() => createUanaProposal({ ...uana,
      workPackages: [{ ...uana.workPackages[0]!, projectId: "project:foreign" }],
    })).toThrow(/cross-project/);
  });

  it("keeps every UANA proposal advisory when no Quality Gate evidence exists", () => {
    const proposal = createUanaProposal(uana)!;
    expect(proposal.options.find(o => o.id === "continue")?.isReviewOnly).toBe(true);
    expect(proposal.options.some(o => o.id === "extend")).toBe(false);
  });
});
