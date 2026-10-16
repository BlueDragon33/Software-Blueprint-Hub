"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { admitIssue115FromRuntime } from "@blueprint-os/runtime";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

/**
 * Narrow explicit owner/editor form action. The browser supplies no Work
 * Package, gate IDs, status, issuer or execution grant; those are pinned
 * inside the trusted runtime candidate and independently revalidated.
 */
export async function submitIssue115Intake(
  projectId: string,
  expectedProfileRecordVersion: number,
  formData: FormData
): Promise<void> {
  if (projectId !== "project:blueprint-os" ||
      formData.get("confirmBlockedIntake") !== "on") {
    throw new Error("Issue 115 requires exact project scope and explicit blocked-draft confirmation");
  }
  const workspace = await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state !== "ready") {
    throw new Error("Issue 115 canonical project session is unavailable or unauthorized");
  }
  // Role must be revalidated on each POST, not inferred from the GET page.
  await workspace.runtime.authority.require(workspace.actor, projectId, "PROJECT_MUTATE");
  const result = await admitIssue115FromRuntime(
    workspace.runtime, workspace.actor, projectId, expectedProfileRecordVersion
  );
  const path = `/projects/${encodeURIComponent(projectId)}/roadmap`;
  revalidatePath(path);
  redirect(path + "?issue115=" + result.state);
}
