import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ProjectProfile, QualityGate, WorkPackage } from "../../packages/contracts/src";
import { AuthorityService, AuthorizationDeniedError } from "../../packages/core/src";
import { assessCanonicalContinuousReadiness, planContinuousRecovery } from "../../packages/core/src/continuous-execution";
import { WorkQualityApplicationService } from "../../packages/application/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresWorkQualityRepository,
  PostgresProjectProfileRepository,
  PostgresContinuousPreflightRepository,
  preflightGateDigest,
  CONTINUOUS_PREFLIGHT_CHECK_IDS,
  type PreflightBinding
} from "../../packages/persistence/src";

/**
 * Real migrated PostgreSQL/Prisma integration, not in-memory mock.
 * Identity in this suite is a TEST identity on an isolated, disposable DB:
 * never claim the actual user's GitHub/SSO login or real project admission.
 * Real GitHub HEAD and browser E2E must be verified separately.
 */
const url=process.env.DATABASE_URL;
const runnable=process.env.BLUEPRINT_QA_DB_INTEGRATION==="true" && !!url;
(runnable?describe:describe.skip)("continuous READY PostgreSQL (disposable two-project pilot)",()=>{
  const target=new URL(url ?? "postgresql://localhost/blueprint_qa_test");
  if (runnable) {
    if (!["localhost","127.0.0.1"].includes(target.hostname) ||
        target.pathname!=="/blueprint_qa_test") {
      throw new Error("Refuse non-disposable or remote database for continuous preflight integration");
    }
  }
  const prisma=createPrismaClient(url!);
  const authority=new AuthorityService(new PostgresAuthorityRepository(prisma));
  const store=new PostgresWorkQualityRepository(prisma);
  const quality=new WorkQualityApplicationService(store,authority);
  const profiles=new PostgresProjectProfileRepository(prisma);
  const existing="project:qa-existing-russian";
  const fresh="project:qa-new-offline-app";
  const actualHead="b".repeat(40); // fixture SHA, NOT a live GitHub read
  const now="2026-10-17T00:00:00Z";
  const meta=(version=1)=>({schemaVersion:"1.0.0" as const,
    recordVersion:version,createdAt:now,updatedAt:now});
  let owner:{principalId:string};
  let editor:{principalId:string};
  let viewer:{principalId:string};
  let reviewer:{principalId:string};
  function profile(id:string):ProjectProfile {
    return {
      id:"profile:"+id.slice("project:".length),projectId:id,meta:meta(),
      name:id===existing?"Russian course (isolated test)":"New offline app (isolated test)",
      projectType:"learning-app",blueprintLevel:"B4",
      primaryUsers:["Test learner"],jobsToBeDone:["Test a bounded offline product outcome"],
      dataSensitivity:"internal",persistence:"local",authentication:"required",
      authorization:"role-based",offlineRequirement:"read-write",
      expectedLifetime:"long-lived",deploymentTarget:"localhost"
    };
  }
  function gate(id:string,projectId:string):QualityGate {
    return {id,projectId,name:"Observed offline regression",
      requirements:["Actual disconnected source and packaged readback"],
      status:"not-ready",evidenceIds:[],meta:meta()};
  }
  function work(id:string,projectId:string,dependencies:string[]=[]):WorkPackage {
    return {id,projectId,title:"Bounded offline learner journey",
      purpose:"Run scoped engineering with source-pinned quality evidence",
      dependencies,acceptanceCriteria:["An independently tested learner-visible output"],
      qualityGateIds:[],status:"planned",meta:meta()};
  }
  async function read(projectId:string,actor:{principalId:string},appHead:string|null) {
    const [items,bundles,canMutate,found]=await Promise.all([
      quality.listWorkPackages(actor,projectId),quality.listQualityGates(actor,projectId),
      authority.can(actor,projectId,"PROJECT_MUTATE"),
      profiles.findProfileByProjectId(projectId)
    ]);
    if (!found) throw new Error("Missing real persisted ProjectProfile");
    return {projectId,profileVersion:found.meta.recordVersion,
      canonicalRevision:"sha256:"+"c".repeat(64),appHead,canMutate,
      requiredGateIds:["gate:pg-required-"+(projectId===existing?"existing":"new")],
      workPackages:items,gates:bundles.map(b=>b.gate),
      evidence:bundles.flatMap(b=>b.evidence)};
  }
  beforeAll(async()=>{
    const identity="pg-continuous-owner-"+randomUUID();
    const actor=await authority.bootstrapOwner({provider:"github",providerSubject:identity});
    owner={principalId:actor.id};
    editor={principalId:(await authority.resolveIdentity({
      provider:"github",providerSubject:"pg-continuous-editor-"+randomUUID()})).id};
    viewer={principalId:(await authority.resolveIdentity({
      provider:"github",providerSubject:"pg-continuous-viewer-"+randomUUID()})).id};
    reviewer={principalId:(await authority.resolveIdentity({
      provider:"github",providerSubject:"pg-continuous-reviewer-"+randomUUID()})).id};
    for (const id of [existing,fresh]) {
      await profiles.createProjectWithProfile(profile(id));
      for(const [actor,role] of [[editor,"EDITOR"],[viewer,"VIEWER"],
        [reviewer,"REVIEWER"]] as const) {
        await authority.grantProjectRole(owner,{
          projectId:id,principalId:actor.principalId,role});
      }
    }
  });
  afterAll(async()=>{await prisma.$disconnect()});
  it("existing project: Owner and Editor can prepare real NOT_READY Gate, Viewer/Reviewer cannot",async()=>{
    const gateId="gate:pg-required-existing";
    await expect(quality.createQualityGate(viewer,gate(gateId,existing)))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    await expect(quality.createQualityGate(reviewer,gate(gateId,existing)))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    await quality.createQualityGate(editor,gate(gateId,existing));
    const before=await read(existing,viewer,actualHead);
    expect(before.gates).toHaveLength(1);
    expect(before.gates[0]?.status).toBe("not-ready");
    expect(assessCanonicalContinuousReadiness(before).state).toBe("READ_ONLY");
    const record=work("work:pg-russian-slice",existing);
    await quality.createWorkPackage(owner,record);
    expect((await quality.listWorkPackages(viewer,existing))[0]?.status).toBe("planned");
    await expect(quality.updateWorkPackage(viewer,
      {...record,status:"ready",meta:meta(2)},1))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    const updated=await quality.updateWorkPackage(editor,
      {...record,status:"ready",meta:meta(2)},1);
    expect(updated.status).toBe("ready");
    await expect(quality.updateWorkPackage(editor,
      {...record,status:"ready",meta:meta(2)},1)).rejects.toThrow();
    const current=await read(existing,editor,actualHead);
    expect(assessCanonicalContinuousReadiness(current).state).toBe("READY_WORK_FOUND");
    expect(assessCanonicalContinuousReadiness(current).canDispatch).toBe(false);
    expect(planContinuousRecovery(current,assessCanonicalContinuousReadiness(current))
      .some(x=>x.kind==="authority-grant")).toBe(true);
    await expect(quality.createQualityGate(null,gate("gate:anon",existing)))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
  },30000);
  it("new project: absent source/Gate blocks, confirmation writes PLANNED then READY only by Editor",async()=>{
    const missing=await read(fresh,editor,null);
    expect(assessCanonicalContinuousReadiness(missing).state).toBe("UNVERIFIED");
    const missingGate=await read(fresh,editor,actualHead);
    expect(assessCanonicalContinuousReadiness(missingGate).state).toBe("BLOCKED");
    expect(planContinuousRecovery(missingGate,assessCanonicalContinuousReadiness(missingGate))
      .some(x=>x.kind==="human-confirm-gate")).toBe(true);
    const gateId="gate:pg-required-new";
    await quality.createQualityGate(owner,gate(gateId,fresh));
    const package0=work("work:pg-new-offline",fresh);
    await quality.createWorkPackage(editor,package0);
    const planned=await read(fresh,editor,actualHead);
    expect(assessCanonicalContinuousReadiness(planned).state).toBe("BLOCKED");
    expect(planContinuousRecovery(planned,assessCanonicalContinuousReadiness(planned))
      .some(x=>x.kind==="human-confirm-ready")).toBe(true);
    expect((await quality.readiness(editor,package0.id))?.state).toBe("ready");
    await quality.updateWorkPackage(editor,
      {...package0,status:"ready",meta:meta(2)},1);
    const ready=await read(fresh,editor,actualHead);
    expect(assessCanonicalContinuousReadiness(ready).state).toBe("READY_WORK_FOUND");
    expect(assessCanonicalContinuousReadiness(ready).preflightEvidenceReady).toBe(false);
    expect(assessCanonicalContinuousReadiness(ready).canDispatch).toBe(false);
    const stale={...ready,appHead:null};
    expect(assessCanonicalContinuousReadiness(stale).state).toBe("UNVERIFIED");
    const oldVersion={...ready,canonicalRevision:null};
    expect(assessCanonicalContinuousReadiness(oldVersion).state).toBe("UNVERIFIED");
  },30000);
  it("stores eight-factor Owner attestation and never treats Editor/Viewer/Reviewer as issuer",async()=>{
    const repository=new PostgresContinuousPreflightRepository(prisma,authority);
    const source=await read(existing,owner,actualHead);
    const item=source.workPackages.find(w=>w.status==="ready")!;
    const gateDigest=preflightGateDigest({
      bundles:(await quality.listQualityGates(owner,existing)).map(b=>({
        gate:b.gate,evidence:[...b.evidence].sort((a,b)=>a.id.localeCompare(b.id))
      })).sort((a,b)=>a.gate.id.localeCompare(b.gate.id)),
      risks:[],debts:[]
    });
    const binding:PreflightBinding={
      projectId:existing,workId:item.id,profileVersion:source.profileVersion,
      workVersion:item.meta.recordVersion,canonicalDigest:source.canonicalRevision,
      appHead:actualHead,gateDigest,policyVersion:"1.3.0",
      checks:CONTINUOUS_PREFLIGHT_CHECK_IDS.map(id=>({
        id,evidence:"canonical:attestation:"+id
      }))
    };
    const note="Scoped engineering preflight; unresolved independent QA and release authority remain blocked.";
    await expect(repository.append(editor,binding,"attest",0,note))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    await expect(repository.append(viewer,binding,"attest",0,note))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    await expect(repository.append(reviewer,binding,"attest",0,note))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    expect(await repository.latest(viewer,binding)).toBeNull();
    const first=await repository.append(owner,binding,"attest",0,note);
    expect(first).toMatchObject({sequence:1,decision:"attest",current:true});
    expect((await repository.latest(editor,binding))?.current).toBe(true);
    expect((await repository.latest(viewer,binding))?.current).toBe(true);
    expect((await repository.latest(owner,{...binding,appHead:"a".repeat(40)}))?.current)
      .toBe(false);
    expect((await repository.latest(owner,{...binding,canonicalDigest:"sha256:"+"a".repeat(64)}))?.current)
      .toBe(false);
    expect((await repository.latest(owner,{...binding,gateDigest:"sha256:"+"e".repeat(64)}))?.current)
      .toBe(false);
    expect((await repository.latest(owner,{...binding,workVersion:1}))?.current)
      .toBe(false);
    await expect(repository.append(owner,binding,"attest",0,note))
      .rejects.toThrow(/CAS|Unique|constraint|Transaction|write conflict/);
    const concurrent=await Promise.allSettled([
      repository.append(owner,binding,"revoke",1,note),
      repository.append(owner,binding,"revoke",1,note)
    ]);
    expect(concurrent.filter(r=>r.status==="fulfilled")).toHaveLength(1);
    expect((await repository.latest(owner,binding))?.current).toBe(false);
    expect((await repository.latest(owner,binding))?.sequence).toBe(2);
    const row=await prisma.continuousPreflightReceipt.findFirstOrThrow({
      where:{projectId:existing,workId:item.id},orderBy:{sequence:"asc"}});
    expect(row.productionReleaseAuthority).toBe(false);
    await expect(prisma.continuousPreflightReceipt.update({
      where:{id:row.id},data:{decision:"attest"}
    })).rejects.toThrow(/append-only/);
    await expect(prisma.continuousPreflightReceipt.delete({where:{id:row.id}}))
      .rejects.toThrow(/append-only/);
    const temporary=await authority.resolveIdentity({
      provider:"github",providerSubject:"pg-preflight-temporary-owner-"+randomUUID()
    });
    const temporaryActor={principalId:temporary.id};
    await authority.grantProjectRole(owner,{projectId:existing,
      principalId:temporary.id,role:"OWNER"});
    const temporarilyApproved=await repository.append(temporaryActor,binding,
      "attest",2,note);
    expect(temporarilyApproved.current).toBe(true);
    await authority.grantProjectRole(owner,{projectId:existing,
      principalId:temporary.id,role:"VIEWER"});
    expect((await repository.latest(owner,binding))?.current).toBe(false);
    // A new canonical critical risk invalidates even a replay of the
    // previously accepted eight-check/HEAD binding, independent of browser state.
    const riskId="risk:pg-new-critical";
    const riskRecord={
      id:riskId,projectId:existing,title:"New severe offline data-loss risk",
      description:"A newly observed unsafe failure must block fresh attestation.",
      likelihood:"high" as const,impact:"critical" as const,
      status:"open" as const,mitigation:"Repair and verify before proceeding",
      linkedWorkPackageIds:[item.id],source:"canonical:pg-isolated-fixture",
      meta:meta()
    };
    await prisma.risk.create({data:{
      id:riskId,projectId:existing,schemaVersion:"1.0.0",
      recordVersion:1,likelihood:"high",impact:"critical",status:"open",
      document:riskRecord
    }});
    await expect(repository.append(owner,binding,"attest",3,note))
      .rejects.toThrow(/PREFLIGHT_SOURCE_DRIFT/);
    const other={...binding,projectId:fresh};
    expect((await repository.latest(owner,other))).toBeNull();
  },30000);

  it("cross-project privilege cannot be inferred from one role or claimed by unauthenticated actor",async()=>{
    await expect(quality.createWorkPackage(viewer,work("work:pg-unauthorized",fresh)))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    await expect(quality.createWorkPackage(null,work("work:pg-anon",fresh)))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    await expect(quality.listWorkPackages(viewer,"project:nonexistent"))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
    await expect(authority.grantProjectRole(editor,
      {projectId:fresh,principalId:viewer.principalId,role:"OWNER"}))
      .rejects.toBeInstanceOf(AuthorizationDeniedError);
  });
});
