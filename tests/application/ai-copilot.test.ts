import { describe, expect, it } from "vitest";

import { createAiCopilotProposal } from "../../packages/application/src/ai-copilot";

describe("P9-010 Bounded AI Copilot", () => {
  it("produces deterministic review-only proposals", () => {
    const request = {
      projectId: "project:blueprint-os",
      task: "draft" as const,
      actorId: "actor:maintainer",
      sourceRevision: "revision:565f05f",
      prompt: "Draft a dependency-safe Work Package.",
      context: { activeWorkPackage: "P9-010" }
    };

    const first = createAiCopilotProposal(request, "Draft proposal");
    const second = createAiCopilotProposal(request, "Draft proposal");

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      reviewState: "pending-human-review",
      canonicalMutationAllowed: false,
      qualityGateMutationAllowed: false,
      productionReleaseAllowed: false,
      requiresExplicitAcceptance: true
    });
  });

  it("binds proposals to the exact source revision", () => {
    const a = createAiCopilotProposal(
      {
        projectId: "project:blueprint-os",
        task: "analyze",
        actorId: "actor:maintainer",
        sourceRevision: "revision:a",
        prompt: "Analyze risk."
      },
      "Risk analysis"
    );
    const b = createAiCopilotProposal(
      {
        projectId: "project:blueprint-os",
        task: "analyze",
        actorId: "actor:maintainer",
        sourceRevision: "revision:b",
        prompt: "Analyze risk."
      },
      "Risk analysis"
    );

    expect(a.id).not.toBe(b.id);
    expect(a.sourceRevision).toBe("revision:a");
  });

  it("rejects secret-bearing AI context", () => {
    expect(() =>
      createAiCopilotProposal(
        {
          projectId: "project:blueprint-os",
          task: "summarize",
          actorId: "actor:maintainer",
          sourceRevision: "revision:abc",
          prompt: "Summarize provider state.",
          context: { apiKey: "forbidden" }
        },
        "summary"
      )
    ).toThrow(/secret-bearing key/i);

    expect(() =>
      createAiCopilotProposal(
        {
          projectId: "project:blueprint-os",
          task: "suggest",
          actorId: "actor:maintainer",
          sourceRevision: "revision:abc",
          prompt: "Suggest next action.",
          context: { note: "Bearer abcdefghijklmnop" }
        },
        "suggestion"
      )
    ).toThrow(/secret-like value/i);
  });

  it("fails closed on missing prompt/output/source revision", () => {
    expect(() =>
      createAiCopilotProposal(
        {
          projectId: "project:blueprint-os",
          task: "draft",
          actorId: "actor:maintainer",
          sourceRevision: "",
          prompt: "Draft"
        },
        "output"
      )
    ).toThrow(/Source revision/i);

    expect(() =>
      createAiCopilotProposal(
        {
          projectId: "project:blueprint-os",
          task: "draft",
          actorId: "actor:maintainer",
          sourceRevision: "revision:abc",
          prompt: "Draft"
        },
        ""
      )
    ).toThrow(/AI output/i);
  });
});
