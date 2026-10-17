"use server";

import { preflightUnifiedNextAction } from "@blueprint-os/application";
import { redirect } from "next/navigation";
import { loadProjectWorkspace } from "../../../src/server/project-workspace";

type NextActionKind = Parameters<typeof preflightUnifiedNextAction>[0]["actionKind"];

/** Server-authenticated preflight for the single Next Action CTA.
 * Never starts execution, issues grants, approves gates, or dispatches workers.
 * Next.js Server Actions enforce Origin/Host integrity at the framework layer.
 */
export async function continueCanonicalNextAction(
  projectId: string,
  displayedProfileVersion: number,
  displayedActionKind: NextActionKind
): Promise<never> {
  // Bound inputs are UI intent, NOT identity, grant, or permission.
  if (!/^project:[a-z0-9][a-z0-9-]{0,158}$/.test(projectId)) {
    redirect("/");
  }
  const home = `/projects/${encodeURIComponent(projectId)}`;
  const workspace = await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state !== "ready") {
    // Do not reveal whether the private project exists when access is lost.
    redirect(home);
  }

  // loadProjectWorkspace re-resolves the authenticated server actor and
  // rechecks PROJECT_READ through the canonical ProjectProfile service.
  // Readiness performs an additional PROJECT_READ check against the live DB.
  const latest = await workspace.runtime.readiness.read(
    workspace.actor, workspace.projectId,
    workspace.project.blueprint.requiredGates
  );
  const checked = preflightUnifiedNextAction({
    projectId,
    profileVersion: displayedProfileVersion,
    actionKind: displayedActionKind
  }, {
    projectId: latest.projectId,
    profileVersion: workspace.project.profile.meta.recordVersion,
    nextAction: latest.nextAction
  });

  // A stale action is never silently redirected to a DIFFERENT action.
  // Operator must inspect the current canonical blocker and choose again.
  if (checked.state !== "current") {
    redirect(home + "?nextAction=changed");
  }
  redirect(checked.href);
}
