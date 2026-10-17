"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { executeBoundedWorkflowNode } from "@blueprint-os/application";
import { ScopedGitHubReadExecutor } from "@blueprint-os/runtime";
import { resolveGitHubPublicationToken } from "../../../src/auth/server-actor";
import { readVerifiedContinuousExecutionOffer } from "../../../src/server/continuous-execution-offer";
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


/** Opt-in genuine signed discovery. POST never trusts a browser-provided grant. */
export async function executeSignedContinuousDiscovery(
  projectId:string,expectedProfileVersion:number,
  expectedCanonicalRevision:string,expectedAppHead:string
):Promise<void> {
  if (!/^project:[a-z][a-z0-9-]+$/.test(projectId) ||
      !Number.isInteger(expectedProfileVersion) || expectedProfileVersion<1 ||
      !/^sha256:[a-f0-9]{64}$/.test(expectedCanonicalRevision) ||
      !/^[a-f0-9]{40}$/.test(expectedAppHead)) {
    throw new Error("Malformed source-bound execution request.");
  }
  const workspace=await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state!=="ready" || workspace.projectId!==projectId ||
      workspace.project.profile.meta.recordVersion!==expectedProfileVersion) {
    throw new Error("Authentication or canonical Profile changed.");
  }
  await workspace.runtime.authority.require(workspace.actor,projectId,"PROJECT_MUTATE");
  const preflight=await readAuthenticatedContinuousPreflight(workspace);
  if (preflight.canonicalRevision!==expectedCanonicalRevision ||
      preflight.appHead!==expectedAppHead ||
      preflight.profileVersion!==expectedProfileVersion ||
      preflight.assessment.state!=="READY_WORK_FOUND") {
    throw new Error("Preflight/HEAD changed; no signed execution permitted.");
  }
  const offer=await readVerifiedContinuousExecutionOffer(workspace,preflight);
  if (!offer) throw new Error("No verified signed continuous-execution grant.");
  const runner=new ScopedGitHubReadExecutor({
    repository:offer.context.repository,
    tokenProvider:async()=>await resolveGitHubPublicationToken() ??
      process.env.WORKFLOW_RECEIPT_GITHUB_READ_TOKEN?.trim() ?? null
  });
  const freshness={
    assertCurrent:async ()=>{
      const latest=await loadProjectWorkspace(encodeURIComponent(projectId));
      if (latest.state!=="ready" || latest.actor.principalId!==workspace.actor.principalId ||
          latest.project.profile.meta.recordVersion!==expectedProfileVersion) {
        throw new Error("Project actor/profile changed before execution.");
      }
      const actual=await readAuthenticatedContinuousPreflight(latest);
      if (actual.appHead!==offer.context.appHead ||
          actual.canonicalRevision!==offer.context.canonicalDigest ||
          actual.assessment.state!=="READY_WORK_FOUND" ||
          actual.assessment.nextWorkId!==offer.workId) {
        throw new Error("Canonical state or READY task drifted before execution.");
      }
    }
  };
  const report=await executeBoundedWorkflowNode(
    offer.grant,offer.manifest,offer.context,offer.plan,offer.authority,
    workspace.runtime.workflowExecutionJournal,runner,freshness
  );
  const path="/projects/"+encodeURIComponent(projectId);
  revalidatePath(path);
  // A successfully observed inspection only submits a QA candidate. It
  // NEVER completes the Work Package or passes a Quality Gate.
  redirect(path+"?continuous="+
    (report.status==="submitted-for-verification" ? "submitted-for-qa" : "task-stopped"));
}


/** User-approved, project-scoped initialization. PLANNED is never READY. */
export async function confirmCreatePlannedWorkPackage(
  projectId: string,expectedProfileVersion:number,
  expectedCanonicalRevision:string,expectedAppHead:string,
  formData:FormData
):Promise<void> {
  if (!/^project:[a-z][a-z0-9-]+$/.test(projectId) ||
      !Number.isInteger(expectedProfileVersion) || expectedProfileVersion<1 ||
      !/^sha256:[a-f0-9]{64}$/.test(expectedCanonicalRevision) ||
      !/^[a-f0-9]{40}$/.test(expectedAppHead) ||
      formData.get("confirmPlannedWork")!=="on") {
    throw new Error("A source-bound explicit PLANNED work confirmation is required.");
  }
  const title=String(formData.get("workTitle")??"").trim();
  const purpose=String(formData.get("workPurpose")??"").trim();
  const acceptance=String(formData.get("workAcceptance")??"").trim();
  if (title.length<5 || title.length>120 ||
      purpose.length<20 || purpose.length>600 ||
      acceptance.length<15 || acceptance.length>600) {
    throw new Error("Provide meaningful work title, purpose and measurable acceptance.");
  }
  const workspace=await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state!=="ready" || workspace.projectId!==projectId ||
      workspace.project.profile.meta.recordVersion!==expectedProfileVersion) {
    throw new Error("Changed or unauthorized canonical project.");
  }
  await workspace.runtime.authority.require(workspace.actor,projectId,"PROJECT_MUTATE");
  const snapshot=await readAuthenticatedContinuousPreflight(workspace);
  if (snapshot.canonicalRevision!==expectedCanonicalRevision ||
      snapshot.appHead!==expectedAppHead ||
      !snapshot.recoveryActions.some(action=>action.kind==="human-confirm-work")) {
    throw new Error("Work Package initiation is no longer applicable.");
  }
  const now=new Date().toISOString();
  const workId="work:continuous-"+randomUUID();
  await workspace.runtime.workQuality.createWorkPackage(workspace.actor,{
    id:workId,projectId,title,purpose,
    dependencies:[],acceptanceCriteria:[acceptance],qualityGateIds:[],
    status:"planned",meta:{
      schemaVersion:"1.0.0",recordVersion:1,createdAt:now,updatedAt:now
    }
  });
  const items=await workspace.runtime.workQuality.listWorkPackages(
    workspace.actor,projectId);
  if (!items.some(item=>item.id===workId && item.status==="planned")) {
    throw new Error("PLANNED Work Package cannot be confirmed from canonical readback.");
  }
  const path="/projects/"+encodeURIComponent(projectId);
  revalidatePath(path);
  revalidatePath(path+"/roadmap");
  redirect(path+"?continuous=work-recorded");
}


/**
 * Exact-CAS transition approved by the authenticated project Editor/Owner.
 * Only a genuinely dependency-satisfied PLANNED package can become READY.
 * READY never equals executed, reviewed, QA PASS or released.
 */
export async function confirmPromotePlannedWorkToReady(
  projectId:string,expectedProfileVersion:number,
  expectedCanonicalRevision:string,expectedAppHead:string,
  workId:string,formData:FormData
):Promise<void> {
  if (!/^project:[a-z][a-z0-9-]+$/.test(projectId) ||
      !Number.isInteger(expectedProfileVersion) || expectedProfileVersion<1 ||
      !/^sha256:[a-f0-9]{64}$/.test(expectedCanonicalRevision) ||
      !/^[a-f0-9]{40}$/.test(expectedAppHead) ||
      !/^work:[a-zA-Z0-9_.:-]{3,120}$/.test(workId) ||
      formData.get("confirmReadyNotDone")!=="on") {
    throw new Error("Explicit source-bound READY confirmation is required.");
  }
  const workspace=await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state!=="ready" || workspace.projectId!==projectId ||
      workspace.project.profile.meta.recordVersion!==expectedProfileVersion) {
    throw new Error("Canonical project/actor or profile changed.");
  }
  await workspace.runtime.authority.require(workspace.actor,projectId,"PROJECT_MUTATE");
  const snapshot=await readAuthenticatedContinuousPreflight(workspace);
  if (snapshot.canonicalRevision!==expectedCanonicalRevision ||
      snapshot.appHead!==expectedAppHead ||
      !snapshot.recoveryActions.some(action=>
        action.kind==="human-confirm-ready" && action.id===workId)) {
    throw new Error("Work readiness preconditions changed; no promotion.");
  }
  const items=await workspace.runtime.workQuality.listWorkPackages(
    workspace.actor,projectId);
  const item=items.find(row=>row.id===workId);
  if (!item || item.status!=="planned" || !item.acceptanceCriteria.length) {
    throw new Error("Work Package is no longer an eligible PLANNED item.");
  }
  const dependency=await workspace.runtime.workQuality.readiness(
    workspace.actor,workId);
  if (!dependency || dependency.state!=="ready") {
    throw new Error("Canonical dependency graph is not READY.");
  }
  const gateRows=await workspace.runtime.workQuality.listQualityGates(
    workspace.actor,projectId);
  const byId=new Map(gateRows.map(row=>[row.gate.id,row.gate]));
  const required=new Set([...workspace.project.blueprint.requiredGates,...item.qualityGateIds]);
  if ([...required].some(id=>!byId.has(id) || byId.get(id)?.status==="fail")) {
    throw new Error("Unresolved required gate blocks readiness.");
  }
  const updated=await workspace.runtime.workQuality.updateWorkPackage(
    workspace.actor,{
      ...item,status:"ready",
      meta:{...item.meta,recordVersion:item.meta.recordVersion+1,
        updatedAt:new Date().toISOString()}
    },
    item.meta.recordVersion
  );
  if (updated.id!==workId || updated.status!=="ready") {
    throw new Error("Canonical READY update was not confirmed.");
  }
  const readback=await workspace.runtime.workQuality.listWorkPackages(
    workspace.actor,projectId);
  if (!readback.some(row=>row.id===workId && row.status==="ready" &&
      row.meta.recordVersion===item.meta.recordVersion+1)) {
    throw new Error("READY work update could not be verified by canonical readback.");
  }
  const path="/projects/"+encodeURIComponent(projectId);
  revalidatePath(path);
  revalidatePath(path+"/roadmap");
  redirect(path+"?continuous=work-ready");
}


/**
 * Owner-only, explicit eight-factor engineering preflight attestation/revoke.
 * The client provides NO evidence, checklist statuses, issuer key or grant.
 */
export async function confirmContinuousPreflightDecision(
  projectId:string,expectedProfileVersion:number,
  expectedCanonicalDigest:string,expectedHead:string,workId:string,
  expectedSequence:number,decision:"attest"|"revoke",formData:FormData
):Promise<void> {
  if (!/^project:[a-z][a-z0-9-]+$/.test(projectId) ||
      !Number.isInteger(expectedProfileVersion) || expectedProfileVersion<1 ||
      !/^sha256:[a-f0-9]{64}$/.test(expectedCanonicalDigest) ||
      !/^[a-f0-9]{40}$/.test(expectedHead) ||
      !/^work:[a-zA-Z0-9_.:-]{3,120}$/.test(workId) ||
      !Number.isInteger(expectedSequence) || expectedSequence<0 ||
      !["attest","revoke"].includes(decision) ||
      formData.get("confirmPreflightScope")!=="on") {
    throw new Error("Owner must explicitly confirm an exact scoped decision.");
  }
  const note=String(formData.get("ownerPreflightNote")??"").trim();
  if (note.length<25 || note.length>900) {
    throw new Error("Explain the real evidence, residual risks and human boundaries.");
  }
  const workspace=await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state!=="ready" || workspace.projectId!==projectId ||
      workspace.project.profile.meta.recordVersion!==expectedProfileVersion) {
    throw new Error("Stale or unauthorized canonical project Profile.");
  }
  await workspace.runtime.authority.require(workspace.actor,projectId,"PROJECT_ADMIN");
  const verified=await readAuthenticatedContinuousPreflight(workspace);
  if (!verified.preflightBinding ||
      verified.preflightBinding.workId!==workId ||
      verified.canonicalRevision!==expectedCanonicalDigest ||
      verified.appHead!==expectedHead ||
      verified.preflightSequence!==expectedSequence) {
    throw new Error("Current source, selected work or preflight sequence has drifted.");
  }
  if (decision==="attest" && verified.assessment.state!=="READY_WORK_FOUND") {
    throw new Error("Cannot attest without verified independent READY work.");
  }
  await workspace.runtime.continuousPreflight.append(
    workspace.actor,verified.preflightBinding,decision,expectedSequence,note);
  const path="/projects/"+encodeURIComponent(projectId);
  revalidatePath(path);
  redirect(path+"?continuous="+
    (decision==="attest"?"preflight-attested":"preflight-revoked"));
}
