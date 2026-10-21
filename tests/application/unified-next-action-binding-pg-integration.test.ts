import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {AuthorityService} from "../../packages/core/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresNextActionWorkBindingRepository,
  PostgresWorkflowExecutionAuthorityRepository
} from "../../packages/persistence/src";

const db=process.env.DATABASE_URL;
const suite=process.env.BLUEPRINT_QA_DB_INTEGRATION==="true" && db
  ? describe : describe.skip;

suite("P2 canonical WorkPackage ↔ adopted workflow ↔ SHA PostgreSQL binding",()=>{
  const prisma=createPrismaClient(db!);
  const auth=new AuthorityService(new PostgresAuthorityRepository(prisma));
  const repo=new PostgresNextActionWorkBindingRepository(prisma);
  const adoptions=new PostgresWorkflowExecutionAuthorityRepository(prisma);
  const projectId="project:p2-next-action-binding";
  const workflowId="binding-inspection";
  const workflowDigest="sha256:"+"a".repeat(64);
  const appHead="b".repeat(40);
  const policyVersion="1.3.0";
  let owner="";
  let outsider="";

  const scope=(id:string)=>({
    projectId,workPackageId:id,workPackageRecordVersion:1,
    workflowId,workflowDigest,appHead,policyVersion
  });
  async function work(id:string){
    await prisma.workPackage.create({data:{
      id,projectId,schemaVersion:"1.0.0",recordVersion:1,status:"ready",
      document:{id,projectId,status:"ready",meta:{recordVersion:1},
        qualityGateIds:[],dependencies:[]}
    }});
    return scope(id);
  }
  beforeAll(async()=>{
    const p=await auth.bootstrapOwner({
      provider:"github",providerSubject:"p2-next-action-owner"
    });
    owner=p.id;
    outsider=(await auth.resolveIdentity({
      provider:"github",providerSubject:"p2-next-action-viewer"
    })).id;
    await prisma.project.create({data:{id:projectId}});
    await adoptions.recordAdoption({
      projectId,workflowId,workflowDigest,policyVersion,
      decision:"adopt",actorPrincipalId:owner
    });
  });
  afterAll(async()=>{await prisma.$disconnect()});

  it("refuses unsigned role input and binds only for actual System Owner, with atomic audit",async()=>{
    const target=await work("work:p2-binding-owner");
    await expect(repo.record({...target,decision:"bind",actorPrincipalId:outsider}))
      .rejects.toThrow(/System Owner/);
    expect(await prisma.nextActionWorkBindingDecision.count({
      where:{workPackageId:target.workPackageId}
    })).toBe(0);
    await expect(repo.assertCurrent(target)).rejects.toThrow(/BINDING_DENIED/);
    await repo.record({...target,decision:"bind",actorPrincipalId:owner});
    await expect(repo.assertCurrent(target)).resolves.toBeUndefined();
    const rows=await prisma.nextActionWorkBindingDecision.findMany({
      where:{workPackageId:target.workPackageId}
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.productionReleaseAuthority).toBe(false);
    const audits=await prisma.authorityAuditEvent.findMany({
      where:{projectId,action:"NEXT_ACTION_WORKFLOW_BINDING_DECISION"}
    });
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits.some(x=>x.actorPrincipalId===owner)).toBe(true);
    expect(audits.every(x=>x.actorPrincipalId!==outsider)).toBe(true);
  });

  it("rejects same project with wrong workflow, digest, SHA or policy",async()=>{
    const target=await work("work:p2-binding-pinned");
    await repo.record({...target,decision:"bind",actorPrincipalId:owner});
    for(const altered of [
      {...target,workflowId:"other-workflow"},
      {...target,workflowDigest:"sha256:"+"c".repeat(64)},
      {...target,appHead:"d".repeat(40)},
      {...target,policyVersion:"1.4.0"}
    ]) {
      await expect(repo.assertCurrent(altered)).rejects.toThrow(/BINDING_DENIED/);
    }
    await expect(repo.assertCurrent(target)).resolves.toBeUndefined();
  });

  it("fails closed immediately when WorkPackage recordVersion changes",async()=>{
    const target=await work("work:p2-binding-version");
    await repo.record({...target,decision:"bind",actorPrincipalId:owner});
    await prisma.workPackage.update({
      where:{id:target.workPackageId},
      data:{recordVersion:2,status:"in-progress"}
    });
    await expect(repo.assertCurrent(target)).rejects.toThrow(/BINDING_DENIED/);
    await expect(repo.record({...target,decision:"bind",actorPrincipalId:owner}))
      .rejects.toThrow(/recordVersion mismatch/);
  });

  it("latest owner revocation blocks the binding while preserving append-only history",async()=>{
    const target=await work("work:p2-binding-revoke");
    await repo.record({...target,decision:"bind",actorPrincipalId:owner});
    await repo.record({...target,decision:"revoke",actorPrincipalId:owner});
    await expect(repo.assertCurrent(target)).rejects.toThrow(/BINDING_DENIED/);
    const rows=await prisma.nextActionWorkBindingDecision.findMany({
      where:{workPackageId:target.workPackageId}
    });
    expect(rows.map(x=>x.decision)).toContain("bind");
    expect(rows.map(x=>x.decision)).toContain("revoke");
    await expect(prisma.nextActionWorkBindingDecision.update({
      where:{id:rows[0]!.id},data:{decision:"bind"}
    })).rejects.toThrow(/append-only/);
    await expect(prisma.nextActionWorkBindingDecision.delete({
      where:{id:rows[0]!.id}
    })).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe('TRUNCATE TABLE "NextActionWorkBindingDecision"'))
      .rejects.toThrow(/append-only/);
  });

  it("orders bind/revoke decisions by monotonic sequence, not UUID or timestamp",async()=>{
    const target=await work("work:p2-binding-sequence");
    await repo.record({...target,decision:"bind",actorPrincipalId:owner});
    await repo.record({...target,decision:"revoke",actorPrincipalId:owner});
    const rows=await prisma.nextActionWorkBindingDecision.findMany({
      where:{workPackageId:target.workPackageId},
      orderBy:{decisionSequence:"asc"}
    });
    expect(rows.map(x=>x.decision)).toEqual(["bind","revoke"]);
    expect(rows).toHaveLength(2);
    expect(rows[1]!.decisionSequence>rows[0]!.decisionSequence).toBe(true);
    await expect(repo.assertCurrent(target)).rejects.toThrow(/BINDING_DENIED/);
    // No human authority was created: these are isolated CI owner fixtures.
    expect(rows.every(x=>x.productionReleaseAuthority===false)).toBe(true);
  });

  it("concurrent owner decisions either serialize or fail closed; latest committed ledger wins",async()=>{
    const target=await work("work:p2-binding-race");
    const outcomes=await Promise.allSettled([
      repo.record({...target,decision:"bind",actorPrincipalId:owner}),
      repo.record({...target,decision:"revoke",actorPrincipalId:owner})
    ]);
    expect(outcomes.some(x=>x.status==="fulfilled")).toBe(true);
    const records=await prisma.nextActionWorkBindingDecision.findMany({
      where:{workPackageId:target.workPackageId},
      orderBy:{decisionSequence:"asc"}
    });
    expect(records.length).toBe(outcomes.filter(x=>x.status==="fulfilled").length);
    expect(records.every(x=>x.productionReleaseAuthority===false)).toBe(true);
    const latest=records.at(-1);
    if(latest?.decision==="bind"){
      await expect(repo.assertCurrent(target)).resolves.toBeUndefined();
    } else {
      await expect(repo.assertCurrent(target)).rejects.toThrow(/BINDING_DENIED/);
    }
  });

  it("revoked workflow adoption invalidates binding without editing binding history",async()=>{
    const target=await work("work:p2-binding-adoption");
    await repo.record({...target,decision:"bind",actorPrincipalId:owner});
    await adoptions.recordAdoption({
      projectId,workflowId,workflowDigest,policyVersion,
      decision:"revoke",actorPrincipalId:owner
    });
    await expect(repo.assertCurrent(target)).rejects.toThrow(/BINDING_DENIED/);
    await expect(repo.record({...target,decision:"bind",actorPrincipalId:owner}))
      .rejects.toThrow(/adopted workflow/);
  });

  it("refuses tied-timestamp adopt/revoke even if UUID ordering incorrectly favors adopt",async()=>{
    const target=await work("work:p2-binding-adoption-tie");
    const workflowId="binding-same-tick";
    const tieScope={...target,workflowId};
    const decidedAt=new Date("2026-10-17T00:00:00.000Z");
    // Entirely disposable CI-only fixture; not a human decision or live
    // issuer. The adoption repository orders by timestamp then UUID, so the
    // deliberate synthetic IDs prove that tie-breaking is NOT revocation-safe.
    await prisma.workflowExecutionAdoptionDecision.create({
      data:{
        id:"workflow-adoption:zzz-tie",projectId,workflowId,workflowDigest,
        policyVersion,decision:"adopt",decidedByPrincipalId:owner,
        decidedAt,productionReleaseAuthority:false
      }
    });
    await repo.record({...tieScope,decision:"bind",actorPrincipalId:owner});
    await expect(repo.assertCurrent(tieScope)).resolves.toBeUndefined();
    await prisma.workflowExecutionAdoptionDecision.create({
      data:{
        id:"workflow-adoption:aaa-tie",projectId,workflowId,workflowDigest,
        policyVersion,decision:"revoke",decidedByPrincipalId:owner,
        decidedAt,productionReleaseAuthority:false
      }
    });
    const uuidBased=await prisma.workflowExecutionAdoptionDecision.findFirst({
      where:{projectId,workflowId,workflowDigest},
      orderBy:[{decidedAt:"desc"},{id:"desc"}]
    });
    expect(uuidBased?.decision).toBe("adopt");
    await expect(repo.assertCurrent(tieScope)).rejects.toThrow(/BINDING_DENIED/);
    await expect(repo.record({...tieScope,decision:"bind",actorPrincipalId:owner}))
      .rejects.toThrow(/unambiguous adopted workflow/);
  });

  it("refuses cross-project and stale WorkPackage binding attempts",async()=>{
    const target=await work("work:p2-binding-cross-project");
    await expect(repo.record({
      ...target,projectId:"project:other",decision:"bind",actorPrincipalId:owner
    })).rejects.toThrow(/project or recordVersion mismatch/);
    expect(await prisma.nextActionWorkBindingDecision.count({
      where:{workPackageId:target.workPackageId}
    })).toBe(0);
  });
});
