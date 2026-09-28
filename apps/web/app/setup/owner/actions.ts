"use server";

import { revalidatePath } from "next/cache";

import { resolveWebIdentity } from "../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../src/server/runtime";

export type BootstrapOwnerResult =
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

export async function bootstrapOwnerAction(): Promise<BootstrapOwnerResult> {
  const identity = await resolveWebIdentity();
  if (!identity) {
    return Object.freeze({
      ok: false,
      message: "Sign in before initializing the Blueprint OS System Owner."
    });
  }

  try {
    await getBlueprintServerRuntime().authority.bootstrapOwner(identity);
    revalidatePath("/setup/owner");
    revalidatePath("/professional-review");
    revalidatePath("/compass");

    return Object.freeze({
      ok: true,
      message:
        "System Owner initialized for this authenticated account. Production authority was not granted."
    });
  } catch (error) {
    if (errorCode(error) === "OWNER_BOOTSTRAP_CONFLICT") {
      return Object.freeze({
        ok: false,
        message:
          "Blueprint OS already has a System Owner. Existing authority was not changed."
      });
    }

    return Object.freeze({
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "System Owner initialization could not be completed."
    });
  }
}
