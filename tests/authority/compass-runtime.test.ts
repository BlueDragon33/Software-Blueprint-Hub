import { beforeEach, describe, expect, it, vi } from "vitest";
import { p9019ProfessionalReviewCandidate } from "../../packages/application/src";

const services = vi.hoisted(() => ({
  can: vi.fn(), decision: vi.fn(), profile: vi.fn(), gates: vi.fn(), runtime: vi.fn(), actor: vi.fn()
}));
vi.mock("../../apps/web/src/server/runtime", () => ({ getBlueprintServerRuntime: services.runtime }));
vi.mock("../../apps/web/src/auth/server-actor", () => ({ resolveWebActor: services.actor }));
import { loadCompassProjection } from "../../apps/web/src/server/compass-projection";

beforeEach(() => {
  vi.clearAllMocks();
  services.runtime.mockReturnValue({ authority: { can: services.can },
    professionalReview: { currentDecision: services.decision },
    profiles: { read: services.profile }, workQuality: { listQualityGates: services.gates } });
  services.actor.mockResolvedValue({ principalId: "principal:test" });
  services.can.mockResolvedValue(true);
  services.profile.mockResolvedValue(null);
  services.gates.mockResolvedValue([]);
  services.decision.mockResolvedValue({ decision: "approve", humanSignoff: true,
    p9020TransitionAllowed: true, productionReleaseAuthority: false, blockers: [],
    candidateReviewedRevision: p9019ProfessionalReviewCandidate.reviewedRevision,
    candidateEvidenceDigest: p9019ProfessionalReviewCandidate.evidenceArtifact.digest });
});

describe("authority-filtered canonical Compass reader", () => {
  it("returns the same current review state for any surface using the reader", async () => {
    expect((await loadCompassProjection()).activeWork.id).toBe("P9-020");
  });
  it("keeps signed-out and non-review readers on the public baseline", async () => {
    services.actor.mockResolvedValue(null);
    expect((await loadCompassProjection()).activeWork.id).toBe("P9-019");
    expect(services.runtime).not.toHaveBeenCalled();
    services.actor.mockResolvedValue({ principalId: "principal:no-review" });
    services.can.mockResolvedValue(false);
    expect((await loadCompassProjection()).activeWork.id).toBe("P9-019");
    expect(services.decision).not.toHaveBeenCalled();
    expect(services.gates).not.toHaveBeenCalled();
  });
  it("does not convert a canonical read failure into baseline success", async () => {
    services.gates.mockRejectedValue(new Error("Database unavailable"));
    await expect(loadCompassProjection()).rejects.toThrow("Database unavailable");
  });
});
