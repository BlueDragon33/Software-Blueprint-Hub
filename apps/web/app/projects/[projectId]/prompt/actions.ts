"use server";

import { revalidatePath } from "next/cache";

import { resolveWebActor } from "../../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../../src/server/runtime";

export type PromptRegenerationResult =
  | Readonly<{ ok: true; projectionId: string }>
  | Readonly<{ ok: false; message: string }>;

export async function regeneratePromptAction(
  projectId: string
): Promise<PromptRegenerationResult> {
  const actor = await resolveWebActor();
  if (!actor) {
    return Object.freeze({
      ok: false,
      message: "Sign in before generating a canonical Prompt Projection."
    });
  }

  try {
    const runtime = getBlueprintServerRuntime();
    const projection = await runtime.prompts.generateAndRecord(actor, projectId);
    revalidatePath(
      `/projects/${encodeURIComponent(projectId)}/prompt`
    );
    return Object.freeze({ ok: true, projectionId: projection.id });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The trusted server could not generate the Prompt Projection.";
    return Object.freeze({ ok: false, message });
  }
}
