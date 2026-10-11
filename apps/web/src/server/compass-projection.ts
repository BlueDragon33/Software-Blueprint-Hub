import {
  evaluateConstitutionalCompliance,
  getBlueprintCompassProjection,
  p9019ProfessionalReviewCandidate
} from "@blueprint-os/application";
import { resolveWebActor, type WebAuthenticatedActor } from "../auth/server-actor";
import { getBlueprintServerRuntime } from "./runtime";

// Home and Compass must read the same authority-filtered canonical state.
export async function loadCompassProjection(
  actor: WebAuthenticatedActor | null = null
) {
  const authenticatedActor = actor ?? await resolveWebActor();
  if (!authenticatedActor) return getBlueprintCompassProjection();

  const runtime = getBlueprintServerRuntime();
  const projectId = p9019ProfessionalReviewCandidate.projectId;
  if (!await runtime.authority.can(authenticatedActor, projectId, "PROJECT_REVIEW")) {
    return getBlueprintCompassProjection();
  }

  const [decision, project, gateBundles] = await Promise.all([
    runtime.professionalReview.currentDecision(authenticatedActor),
    runtime.profiles.read(authenticatedActor, projectId),
    runtime.workQuality.listQualityGates(authenticatedActor, projectId)
  ]);
  const constitutionAudit = project
    ? evaluateConstitutionalCompliance({ blueprint: project.blueprint, gateBundles })
    : null;

  return getBlueprintCompassProjection(decision, {
    revision: process.env.VERCEL_GIT_COMMIT_SHA?.trim().toLowerCase() ?? null,
    gateBundles,
    constitutionAudit
  });
}
