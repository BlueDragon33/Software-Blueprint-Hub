"use server";

import {
  p9019ProfessionalReviewCandidate,
  type HumanProfessionalReviewDecisionKind,
  type RecordedHumanProfessionalReviewDecision
} from "@blueprint-os/application";
import { revalidatePath } from "next/cache";

import { resolveWebActor } from "../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../src/server/runtime";

export interface SubmitProfessionalReviewInput {
  readonly decision: HumanProfessionalReviewDecisionKind;
  readonly note: string;
  readonly candidateReviewedRevision: string;
  readonly candidateEvidenceDigest: string;
  readonly acknowledgedFindingIds: readonly string[];
}

export type SubmitProfessionalReviewResult =
  | {
      readonly ok: true;
      readonly decision: RecordedHumanProfessionalReviewDecision;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

function errorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return null;
}

export async function submitProfessionalReviewAction(
  input: SubmitProfessionalReviewInput
): Promise<SubmitProfessionalReviewResult> {
  const actor = await resolveWebActor();
  if (!actor) {
    return {
      ok: false,
      message: "Sign in before recording a professional review decision."
    };
  }

  if (
    input.candidateReviewedRevision !==
      p9019ProfessionalReviewCandidate.reviewedRevision ||
    input.candidateEvidenceDigest !==
      p9019ProfessionalReviewCandidate.evidenceArtifact.digest
  ) {
    return {
      ok: false,
      message:
        "This review screen is stale. Reload before making a decision."
    };
  }

  try {
    const decision = await getBlueprintServerRuntime().professionalReview.record(
      actor,
      input,
      new Date().toISOString()
    );
    revalidatePath("/professional-review");
    revalidatePath("/compass");
    return { ok: true, decision };
  } catch (error) {
    if (errorCode(error) === "AUTHORIZATION_DENIED") {
      return {
        ok: false,
        message:
          "Your account does not have PROJECT_REVIEW authority for Blueprint OS."
      };
    }
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "The professional review decision could not be recorded."
    };
  }
}
