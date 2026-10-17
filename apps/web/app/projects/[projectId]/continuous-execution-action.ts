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


/** Safe, idempotent retry for transient canonical/GitHub reads. No state edits. */
export async function retryContinuousSourceRead(
  projectId: string,
  expectedProfileVersion: number
): Promise<void> {
  if (!/^project:[a-z][a-z0-9-]+$/.test(projectId) ||
      !Number.isInteger(expectedProfileVersion) || expectedProfileVersion < 1) {
    throw new Error("Invalid source-readback scope");
  }
  const workspace=await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state!=="ready" || workspace.projectId!==projectId ||
      workspace.project.profile.meta.recordVersion!==expectedProfileVersion) {
    throw new Error("Authenticated project/profile changed; reload the project.");
  }
  // This is a real read, not a fake auto-remediation receipt. Never imply it
  // made an unavailable repository available or resolved a human gate.
  await readAuthenticatedContinuousPreflight(workspace);
  const path="/projects/"+encodeURIComponent(projectId);
  revalidatePath(path);
  redirect(path+"?continuous=rechecked");
}

/**
 * Narrow, user-confirmed canonical *record* repair. The user supplies a real
 * acceptance requirement, and the role-scoped WorkQuality service always
 * inserts NOT_READY. A valid form is not approval, QA PASS or execution grant.
 */
export async function confirmCreateMissingQualityGate(
  projectId: string,
  expectedProfileVersion: number,
  expectedCanonicalRevision: string,
  expectedAppHead: string,
  gateId: string,
  formData: FormData
): Promise<void> {
  if (!/^project:[a-z][a-z0-9-]+$/.test(projectId) ||
      !Number.isInteger(expectedProfileVersion) || expectedProfileVersion < 1 ||
      !/^sha256:[a-f0-9]{64}$/.test(expectedCanonicalRevision) ||
      !/^[a-f0-9]{40}$/.test(expectedAppHead) ||
      !/^gate:[a-zA-Z0-9_.:-]{3,120}$/.test(gateId) ||
      formData.get("confirmCreateNotReady")!=="on") {
    throw new Error("Explicit NOT_READY project/gate confirmation is required.");
  }
  const name=String(formData.get("gateName")??"").trim();
  const requirement=String(formData.get("acceptanceRequirement")??"").trim();
  if (name.length<4 || name.length>120 ||
      requirement.length<12 || requirement.length>600) {
    throw new Error("Provide a specific gate name and measurable acceptance requirement.");
  }
  const workspace=await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state!=="ready" || workspace.projectId!==projectId) {
    throw new Error("Project actor/authority unavailable.");
  }
  await workspace.runtime.authority.require(workspace.actor,projectId,"PROJECT_MUTATE");
  if (workspace.project.profile.meta.recordVersion!==expectedProfileVersion ||
      !workspace.project.blueprint.requiredGates.includes(gateId)) {
    throw new Error("Changed or undelegated canonical gate scope.");
  }
  const snapshot=await readAuthenticatedContinuousPreflight(workspace);
  if (snapshot.canonicalRevision!==expectedCanonicalRevision ||
      snapshot.appHead!==expectedAppHead ||
      !snapshot.recoveryActions.some(action=>
        action.kind==="human-confirm-gate" && action.id===gateId)) {
    throw new Error("The missing-gate preflight is stale or no longer applicable.");
  }
  const now=new Date().toISOString();
  await workspace.runtime.workQuality.createQualityGate(workspace.actor,{
    id:gateId,projectId,name,requirements:[requirement],status:"not-ready",
    evidenceIds:[],
    meta:{schemaVersion:"1.0.0",recordVersion:1,createdAt:now,updatedAt:now}
  });
  // Durable read-back proves an actual canonical record, not a fake click.
  const rows=await workspace.runtime.workQuality.listQualityGates(
    workspace.actor,projectId);
  if (!rows.some(row=>row.gate.id===gateId &&
      row.gate.status==="not-ready" && row.gate.evidenceIds.length===0)) {
    throw new Error("NOT_READY gate write could not be verified by canonical readback.");
  }
  const path="/projects/"+encodeURIComponent(projectId);
  revalidatePath(path);
  revalidatePath(path+"/quality");
  redirect(path+"?continuous=gate-recorded");
}
