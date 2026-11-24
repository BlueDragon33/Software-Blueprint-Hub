import type { BlueprintServerRuntime } from "@blueprint-os/runtime";
import type { WebAuthenticatedActor } from "../auth/server-actor";

type ReviewReadRuntime = {
  readonly authority: Pick<BlueprintServerRuntime["authority"], "require" | "can">;
  readonly workQuality: Pick<BlueprintServerRuntime["workQuality"], "listQualityGates">;
};

/** Point-in-time read admission only. Never authorizes a later mutation or PASS. */
export async function readProjectQualityReview(
  runtime: ReviewReadRuntime,
  actor: WebAuthenticatedActor | null,
  projectId: string
) {
  await runtime.authority.require(actor, projectId, "PROJECT_READ");
  const gateModels = await runtime.workQuality.listQualityGates(actor, projectId);
  const seen = new Set<string>();
  for (const { gate, evidence } of gateModels) {
    if (
      gate.projectId !== projectId || !gate.id.trim() || seen.has(gate.id) ||
      !Number.isSafeInteger(gate.meta.recordVersion) || gate.meta.recordVersion < 1 ||
      evidence.some((item) => item.gateId !== gate.id)
    ) {
      throw new Error("Canonical quality register is inconsistent");
    }
    seen.add(gate.id);
  }
  const canReview = await runtime.authority.can(actor, projectId, "PROJECT_REVIEW");
  // A role may have been revoked while the register was loading.
  await runtime.authority.require(actor, projectId, "PROJECT_READ");
  return Object.freeze({ gateModels, canReview });
}
