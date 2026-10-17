"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loadProjectWorkspace } from "../../../src/server/project-workspace";
import { readAuthenticatedContinuousPreflight } from "../../../src/server/continuous-execution-preflight";

/**
 * This button performs an ACTUAL authenticated canonical re-read, never starts
 * a workflow. POST parameters are consistency guards, not delegated authority.
 * Signed Gateway/Worker execution must be implemented and authorized separately.
 */
export async function recheckContinuousExecutionPreflight(
  projectId: string,
  expectedProfileVersion: number,
  expectedCanonicalRevision: string,
  expectedAppHead: string
): Promise<void> {
  if (!/^project:[a-z][a-z0-9-]+$/.test(projectId) ||
      !Number.isInteger(expectedProfileVersion) || expectedProfileVersion < 1 ||
      !expectedCanonicalRevision.trim() ||
      !/^[a-f0-9]{40}$/.test(expectedAppHead)) {
    throw new Error("Invalid project preflight binding");
  }
  const workspace = await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state !== "ready" || workspace.projectId !== projectId) {
    throw new Error("Project session or PROJECT_READ authority unavailable");
  }
  if (workspace.project.profile.meta.recordVersion !== expectedProfileVersion) {
    throw new Error("Project Profile changed: refresh before preflight");
  }
  const snapshot = await readAuthenticatedContinuousPreflight(workspace);
  if (snapshot.canonicalRevision !== expectedCanonicalRevision ||
      snapshot.profileVersion !== expectedProfileVersion ||
      snapshot.appHead !== expectedAppHead) {
    throw new Error("Canonical evidence or repository HEAD changed: refresh before proceeding");
  }
  const path = "/projects/" + encodeURIComponent(projectId);
  revalidatePath(path);
  redirect(path + "?continuous=checked");
}
