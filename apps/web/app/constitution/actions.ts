"use server";

import type {
  ConstitutionAmendmentDraftInput,
  ConstitutionRatificationSubmission,
  ConstitutionStageEvidenceInput
} from "@blueprint-os/application";
import { revalidatePath } from "next/cache";

import { resolveWebActor } from "../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../src/server/runtime";

export type ConstitutionCommandResult =
  | Readonly<{ ok: true; message: string }>
  | Readonly<{ ok: false; message: string }>;

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

function failure(error: unknown): ConstitutionCommandResult {
  const code = errorCode(error);
  if (code === "CONSTITUTIONAL_AUTHORITY_DENIED") {
    return Object.freeze({
      ok: false,
      message:
        "This action requires authenticated System Owner Constitutional Authority."
    });
  }
  if (code === "CONSTITUTION_RECORD_VERSION_CONFLICT") {
    return Object.freeze({
      ok: false,
      message:
        "This amendment changed after the screen loaded. Reload before continuing."
    });
  }
  return Object.freeze({
    ok: false,
    message:
      error instanceof Error
        ? error.message
        : "The constitutional command could not be completed."
  });
}

async function actorOrFailure() {
  const actor = await resolveWebActor();
  return actor;
}

export async function createConstitutionAmendmentAction(
  input: ConstitutionAmendmentDraftInput
): Promise<ConstitutionCommandResult> {
  const actor = await actorOrFailure();
  if (!actor) {
    return Object.freeze({
      ok: false,
      message: "Sign in as the System Owner before creating an amendment."
    });
  }

  try {
    await getBlueprintServerRuntime().constitutionAuthority.createDraft(
      actor,
      input,
      new Date().toISOString()
    );
    revalidatePath("/constitution");
    return Object.freeze({
      ok: true,
      message: "Canonical amendment draft created."
    });
  } catch (error) {
    return failure(error);
  }
}

export async function recordConstitutionStageEvidenceAction(
  input: ConstitutionStageEvidenceInput
): Promise<ConstitutionCommandResult> {
  const actor = await actorOrFailure();
  if (!actor) {
    return Object.freeze({
      ok: false,
      message: "Sign in as the System Owner before recording evidence."
    });
  }

  try {
    await getBlueprintServerRuntime().constitutionAuthority.recordStageEvidence(
      actor,
      input,
      new Date().toISOString()
    );
    revalidatePath("/constitution");
    return Object.freeze({
      ok: true,
      message:
        input.kind === "impact"
          ? "Impact evidence recorded; amendment advanced to impact-reviewed."
          : "Migration evidence recorded; amendment advanced to migration-ready."
    });
  } catch (error) {
    return failure(error);
  }
}

export async function openConstitutionRatificationAction(input: {
  readonly amendmentId: string;
  readonly expectedRecordVersion: number;
}): Promise<ConstitutionCommandResult> {
  const actor = await actorOrFailure();
  if (!actor) {
    return Object.freeze({
      ok: false,
      message: "Sign in as the System Owner before opening ratification."
    });
  }

  try {
    await getBlueprintServerRuntime().constitutionAuthority.openRatification(
      actor,
      input.amendmentId,
      input.expectedRecordVersion,
      new Date().toISOString()
    );
    revalidatePath("/constitution");
    return Object.freeze({
      ok: true,
      message:
        "Amendment is ratification-ready. No decision has been made yet."
    });
  } catch (error) {
    return failure(error);
  }
}

export async function submitConstitutionRatificationAction(
  input: ConstitutionRatificationSubmission
): Promise<ConstitutionCommandResult> {
  const actor = await actorOrFailure();
  if (!actor) {
    return Object.freeze({
      ok: false,
      message: "Sign in as the System Owner before ratification."
    });
  }

  try {
    await getBlueprintServerRuntime().constitutionAuthority.ratify(
      actor,
      input,
      new Date().toISOString()
    );
    revalidatePath("/constitution");
    return Object.freeze({
      ok: true,
      message:
        input.decision === "approve"
          ? "Human ratification recorded. Publication remains a separate future action."
          : "Human rejection recorded. The amendment cannot proceed to publication."
    });
  } catch (error) {
    return failure(error);
  }
}
