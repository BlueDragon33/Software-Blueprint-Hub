import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { ReviewerBSourceAdmissionService } from "../../packages/runtime/src/reviewer-b-source-admission";
import { reviewOrderKey, type ReviewWorkOrder } from "../../packages/application/src/reviewer-ab-contract.mjs";

import {
  executeBoundedWorkflowNode,
  executeEvidenceBoundWorkflowNode,
  verifyWorkflowExecutionGrant,
  verifyReviewSourceAdmission,
  workflowExecutionGrantSigningPayload,
  type WorkflowAttemptResult,
  type WorkflowExecutionGrantPayload,
  type WorkflowExecutionGrant
} from "../../packages/application/src/prompt-workflow-execution";
import {
  buildWorkflowReadiness,
  workflowManifestDigest
} from "../../packages/application/src/prompt-workflow-orchestration";

const candidate = JSON.parse(readFileSync(
  new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url),
  "utf8"
));
const approved = { ...candidate, status: "approved" };
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const publicPem = publicKey.export({ format: "pem", type: "spki" }).toString();
const context = {
  projectId: approved.project.id,
  repository: approved.project.repo,
  appHead: "a".repeat(40),
  canonicalDigest: "sha256:" + "b".repeat(64),
  policyVersion: "1.3.0"
};
const fixed = new Date("2026-10-13T03:05:00.000Z");
const receiptSource = { list: async () => [] };
const store = { publicKeyFor: () => null };
const evidence = { verify: async () => false };
const readiness = await buildWorkflowReadiness(approved, context, receiptSource, store, evidence);
const digest = workflowManifestDigest(approved);

function grant(nodeId = "inventory", extra: Partial<WorkflowExecutionGrantPayload> = {}): WorkflowExecutionGrant {
  const payload: WorkflowExecutionGrantPayload = {
    schemaVersion: "1.0.0",
    projectId: context.projectId,
    repository: context.repository,
    workflowId: approved.workflowId,
    workflowVersion: approved.workflowVersion,
    workflowDigest: digest,
    templateId: approved.templateId,
    nodeId,
    appHead: context.appHead,
    canonicalDigest: context.canonicalDigest,
    policyVersion: context.policyVersion,
    issuerId: "trusted-operator",
    nonce: "0123456789abcdef0123456789abcdef",
    issuedAt: "2026-10-13T03:00:00.000Z",
    expiresAt: "2026-10-13T03:10:00.000Z",
    mode: "inspect-scoped",
    allowedPaths: ["src/form"],
    maxAttempts: 2,
    maxFiles: 5,
    maxTokenEstimate: 6000,
    ...extra
  };
  return {
    ...payload,
    signature: sign(null, Buffer.from(workflowExecutionGrantSigningPayload(payload)),
      privateKey).toString("base64")
  };
}

const success = (opts: Partial<WorkflowAttemptResult> = {}): WorkflowAttemptResult => ({
  outcome: "succeeded",
  observationDigest: "sha256:" + "c".repeat(64),
  evidenceReferences: ["github:BlueDragon33/Application-Management@" + context.appHead + "#src/form/index.ts"],
  filesTouched: ["src/form/index.ts"],
  tokensUsed: 200,
  ...opts
});

function harness(config: {
  accepted?: boolean;
  adopted?: boolean;
  permitted?: boolean;
  runner?: (attempt: number) => Promise<WorkflowAttemptResult>;
  freshness?: () => Promise<void>;
  journalFailure?: boolean;
} = {}) {
  const claimed = new Set<string>();
  const journal = {
    claim: vi.fn(async (id: string) => {
      if (config.accepted === false || claimed.has(id)) return false;
      claimed.add(id); return true;
    }),
    append: vi.fn(async () => {
      if (config.journalFailure) throw new Error("durable journal unavailable");
    })
  };
  const execute = vi.fn(async (action: { attempt: number }) =>
    config.runner ? config.runner(action.attempt) : success());
  const authority = {
    publicKeyFor: vi.fn((_project: string, _issuer: string) => publicPem),
    assertAdopted: vi.fn(async () => {
      if (config.adopted === false) throw new Error("Canonical workflow adoption unavailable");
    }),
    assertMayExecute: vi.fn(async () => {
      if (config.permitted === false) throw new Error("Execution issuer has no scoped permission");
    })
  };
  const freshness = { assertCurrent: vi.fn(config.freshness ?? (async () => {})) };
  const run = (receipt: unknown = grant(), active = readiness, flow = approved) =>
    executeBoundedWorkflowNode(
      receipt, flow, context, active, authority, journal,
      { execute }, freshness, () => fixed
    );
  return { run, journal, execute, authority, freshness };
}

describe("Phase 5B opt-in bounded execution and recovery", () => {
  it("rejects unapproved candidate workflows even with a correctly signed grant", async () => {
    const h = harness();
    await expect(h.run(grant(), readiness, candidate)).rejects.toThrow("no approved execution status");
    expect(h.journal.claim).not.toHaveBeenCalled();
    expect(h.execute).not.toHaveBeenCalled();
  });

  it("requires an independent trusted adoption decision before claiming work", async () => {
    const h = harness({ adopted: false });
    await expect(h.run()).rejects.toThrow("Canonical workflow adoption unavailable");
    expect(h.journal.claim).not.toHaveBeenCalled();
  });

  it("requires an exact, short-lived signed binding; rejects tampering and replay", async () => {
    const h = harness();
    const mutated = { ...grant(), appHead: "d".repeat(40) };
    await expect(h.run(mutated)).rejects.toThrow("Stale or mismatched");
    await expect(h.run({ ...grant(), maxAttempts: 3 })).rejects.toThrow(/signature|budget/);
    await expect(h.run(grant("inventory", { expiresAt: "2026-10-13T03:04:00.000Z" })))
      .rejects.toThrow("expired");
    const valid = grant();
    await h.run(valid);
    await expect(h.run(valid)).rejects.toThrow("replay");
    expect(h.execute).toHaveBeenCalledTimes(1);
  });

  it("refuses self-granted or unscoped capabilities, traversal and extra keys", async () => {
    const h = harness();
    await expect(h.run(grant("inventory", { mode: "edit-scoped" })))
      .rejects.toThrow("capability");
    await expect(h.run(grant("inventory", { allowedPaths: ["src/../config"] })))
      .rejects.toThrow("Invalid signed");
    await expect(h.run(grant("inventory", { maxFiles: 31 })))
      .rejects.toThrow("Invalid signed");
    await expect(h.run({ ...grant(), superuser: true }))
      .rejects.toThrow("Invalid signed");
    await expect(h.run(grant("release-check")))
      .rejects.toThrow("Human/release");
    expect(h.execute).not.toHaveBeenCalled();
  });

  it("requires source-bound available readiness, not merely knowing a node ID", async () => {
    const h = harness();
    const wrong = {
      ...readiness,
      appHead: "e".repeat(40)
    };
    await expect(h.run(grant(), wrong)).rejects.toThrow("No verified source-bound");
    await expect(h.run(grant("reproduce"))).rejects.toThrow("No verified source-bound");
    expect(h.journal.claim).not.toHaveBeenCalled();
  });

  it("dispatches only typed/limited action, persists observations, and NEVER grants QA PASS", async () => {
    const h = harness();
    const report = await h.run();
    expect(report.status).toBe("submitted-for-verification");
    expect(report.attempts).toBe(1);
    expect(report.completionReceiptIssued).toBe(false);
    expect(report.qualityGatePassed).toBe(false);
    expect(report.productionAuthorized).toBe(false);
    expect(h.execute).toHaveBeenCalledWith(expect.objectContaining({
      appHead: context.appHead, mode: "inspect-scoped",
      allowedPaths: ["src/form"], maxFiles: 5, maxTokenEstimate: 6000, attempt: 1
    }));
    expect(h.journal.append).toHaveBeenCalledOnce();
    expect(h.freshness.assertCurrent).toHaveBeenCalledTimes(2);
  });

  it("does not repeatedly burn tokens on an identical failure fingerprint", async () => {
    const h = harness({ runner: async () => success({ outcome: "failed" }) });
    const result = await h.run();
    expect(result.status).toBe("needs-new-evidence");
    expect(result.attempts).toBe(2);
    expect(h.execute).toHaveBeenCalledTimes(2);
  });

  it("stops on budget exhaustion or changed verified HEAD before next attempt", async () => {
    const budget = harness({ runner: async () => success({ outcome: "failed", tokensUsed: 6000 }) });
    expect((await budget.run()).reason).toContain("Token budget exhausted");
    expect(budget.execute).toHaveBeenCalledTimes(1);

    let checked = 0;
    const drift = harness({
      runner: async () => success({ outcome: "failed" }),
      freshness: async () => { if (++checked === 3) throw new Error("HEAD moved"); }
    });
    const result = await drift.run();
    expect(result.status).toBe("stopped");
    expect(result.reason).toContain("changed");
    expect(drift.execute).toHaveBeenCalledTimes(1);
  });

  it("rejects out-of-scope file modifications, missing observations and invented evidence", async () => {
    for (const badResult of [
      success({ filesTouched: ["private/secret.ts"] }),
      success({ evidenceReferences: [] }),
      success({ observationDigest: "unverifiable" }),
      success({ tokensUsed: 9000 })
    ]) {
      const h = harness({ runner: async () => badResult });
      const result = await h.run();
      expect(result.status).toBe("stopped");
      expect(result.observations[0]?.outcome).toBe("invalid-result");
      expect(result.completionReceiptIssued).toBe(false);
    }
  });

  it("halts when the journal fails or the runner throws; no blind retry", async () => {
    const broken = harness({ journalFailure: true });
    await expect(broken.run()).rejects.toThrow("durable journal unavailable");
    expect(broken.execute).toHaveBeenCalledTimes(1);

    const runnerDown = harness({ runner: async () => { throw new Error("worker offline"); } });
    const result = await runnerDown.run();
    expect(result.status).toBe("stopped");
    expect(result.observations[0]?.outcome).toBe("runner-error");
    expect(runnerDown.execute).toHaveBeenCalledTimes(1);
  });

  it("blocks a trusted signing key without separate issuer-specific execution permission", async () => {
    const h = harness({ permitted: false });
    await expect(h.run()).rejects.toThrow("no scoped permission");
    expect(h.journal.claim).not.toHaveBeenCalled();
    expect(h.execute).not.toHaveBeenCalled();
  });

  it("recomputes evidence readiness through the trusted source before any real dispatch", async () => {
    const h = harness();
    const result = await executeEvidenceBoundWorkflowNode(grant(), approved, context, {
      source: { list: async () => [] },
      trust: store, verifier: evidence,
      authority: h.authority, journal: h.journal,
      runner: { execute: h.execute }, freshness: h.freshness,
      clock: () => fixed
    });
    expect(result.status).toBe("submitted-for-verification");
    expect(h.execute).toHaveBeenCalledTimes(1);

    const blocked = harness();
    await expect(executeEvidenceBoundWorkflowNode(grant(), approved, context, {
      source: { list: async () => { throw new Error("receipt backend failed"); } },
      trust: store, verifier: evidence,
      authority: blocked.authority, journal: blocked.journal,
      runner: { execute: blocked.execute }, freshness: blocked.freshness,
      clock: () => fixed
    })).rejects.toThrow("receipt backend failed");
    expect(blocked.execute).not.toHaveBeenCalled();
  });

  it("does not dispatch with an unavailable atomic journal or unknown signing issuer", async () => {
    const h = harness({ accepted: false });
    await expect(h.run()).rejects.toThrow("replay");
    expect(h.execute).not.toHaveBeenCalled();

    const authority = {
      publicKeyFor: () => null,
      assertAdopted: async () => {},
      assertMayExecute: async () => {}
    };
    await expect(verifyWorkflowExecutionGrant(grant(), approved, context, authority, fixed))
      .rejects.toThrow("No pinned issuer");
  });
});

describe("G3 read-only source admission (reuses real Ed25519 + WorkPackage CAS)",()=>{

  function orderPin(g = grant()) {
    return {
      policyVersion: "1.3.0" as const, projectId: context.projectId,
      repository: context.repository, workflowId: approved.workflowId,
      workflowNodeId: g.nodeId, workflowDigest: digest,
      sourceRevision: context.appHead, canonicalSourceRevision: context.canonicalDigest,
      issuerGrantDigest: "sha256:" + requireSha(g),
      workPackageId: "r2-r3-qa", workPackageRecordVersion: 4,
      expectedStateVersion: 4,
      scope: {allowedPaths:[...g.allowedPaths],maxFiles:g.maxFiles,
        maxAttempts:g.maxAttempts,maxTokensUsed:0 as const}
    };
  }
  const requireSha=(g:WorkflowExecutionGrant)=>
    createHash("sha256").update(JSON.stringify(stableGrant(g))).digest("hex");
  const stableGrant=(g:WorkflowExecutionGrant): Record<string, unknown>=>
    Object.fromEntries(Object.entries(g).sort(([a],[b])=>a.localeCompare(b)));
  const workRepo=(version=4,projectId=context.projectId)=>({
    findWorkPackageById:vi.fn(async(id:string)=>({
      id, projectId, meta:{recordVersion:version}
    }))
  });
  it("verifies existing Ed25519/adoption/issuer and canonical WorkPackage version without reviewer PASS",async()=>{
    const g=grant(),a=harness();
    const result=await verifyReviewSourceAdmission(
      orderPin(g),g,approved,context,a.authority,workRepo(),fixed);
    expect(result.sourceInspectionGrantVerified).toBe(true);
    expect(result.canonicalWorkPackageVersionVerified).toBe(true);
    expect(result.independentReviewerBVerified).toBe(false);
    expect(result.qualityGatePassed).toBe(false);
    expect(result.productionAuthorized).toBe(false);
  });
  it("rejects a revoked/unauthorized issuer (not just a string token)",async()=>{
    const g=grant(),a=harness({permitted:false});
    await expect(verifyReviewSourceAdmission(orderPin(g),g,approved,context,
      a.authority,workRepo(),fixed)).rejects.toThrow(/permission/);
  });
  it("rejects forged grant signature and stale SHA",async()=>{
    const g=grant(),a=harness();
    await expect(verifyReviewSourceAdmission(orderPin(g),{...g,appHead:"f".repeat(40)},
      approved,context,a.authority,workRepo(),fixed)).rejects.toThrow(/source|signature/);
  });
  it("rejects changed signed-grant digest without replacing review authority",async()=>{
    const g=grant(),a=harness();
    await expect(verifyReviewSourceAdmission({...orderPin(g),
      issuerGrantDigest:"sha256:"+"f".repeat(64)},g,approved,context,
      a.authority,workRepo(),fixed)).rejects.toThrow(/scope mismatch/);
  });
  it("rejects foreign/stale canonical WorkPackage and CAS",async()=>{
    const g=grant(),a=harness();
    for(const repo of [workRepo(5),workRepo(4,"project:other")]) {
      await expect(verifyReviewSourceAdmission(orderPin(g),g,approved,context,
        a.authority,repo,fixed)).rejects.toThrow(/canonical WorkPackage CAS/);
    }
    await expect(verifyReviewSourceAdmission({...orderPin(g),expectedStateVersion:5},
      g,approved,context,a.authority,workRepo(),fixed))
      .rejects.toThrow(/WorkPackage\/CAS/);
  });
  it("rejects attempts to widen source scope, paid token budget or impersonate a review node",async()=>{
    const g=grant(),a=harness();
    await expect(verifyReviewSourceAdmission({...orderPin(g),scope:{
      ...orderPin(g).scope,allowedPaths:["outside.ts"]}},g,approved,
      context,a.authority,workRepo(),fixed)).rejects.toThrow(/scope mismatch/);
    await expect(verifyReviewSourceAdmission({...orderPin(g),scope:{
      ...orderPin(g).scope,maxTokensUsed:1 as 0}},g,approved,
      context,a.authority,workRepo(),fixed)).rejects.toThrow(/WorkPackage\/CAS/);
    await expect(verifyReviewSourceAdmission(orderPin(grant("release-check")),
      grant("release-check"),approved,context,a.authority,workRepo(),fixed))
      .rejects.toThrow(/Human\/release/);
  });
});


describe("G3 canonical runtime source/QA journal wiring — no B-agent PASS", () => {
  const hash = (payload: string) => "sha256:" +
    createHash("sha256").update(payload).digest("hex");
  const observationDigest = "sha256:" + "c".repeat(64);
  const issuerRecord = {
    projectId: context.projectId,workflowId: approved.workflowId,
    issuerId:"trusted-operator",publicKeyPem:publicPem,
    policyVersion:"1.3.0",decision:"allow",decidedByPrincipalId:"owner",
    decidedAt:fixed
  };
  function contextFor(g = grant()) {
    const requestId = hash(workflowExecutionGrantSigningPayload(g));
    const fields = {
      schemaVersion:"1.0.0" as const,kind:"review-work-order" as const,
      policyVersion:"1.3.0" as const,projectId:context.projectId,
      repository:context.repository,pullRequestNumber:163,
      workPackageId:"r2-r3-qa",workPackageRecordVersion:4,
      workflowId:approved.workflowId,workflowNodeId:g.nodeId,
      workflowDigest:digest,sourceRevision:context.appHead,
      canonicalSourceRevision:context.canonicalDigest,expectedStateVersion:4,
      issuerGrantDigest:requestId,
      issuedAt:"2026-10-13T03:02:00.000Z",
      expiresAt:"2026-10-13T03:08:00.000Z",
      scope:{allowedPaths:[...g.allowedPaths],maxFiles:g.maxFiles,
        maxBytes:512000,maxAttempts:g.maxAttempts,maxTokensUsed:0 as const},
      orderKey:""
    };
    const order:ReviewWorkOrder={...fields,orderKey:reviewOrderKey({...fields,orderKey:""})};
    return {order,grant:g,workflow:approved,context,requestId,now:fixed};
  }
  function setup(options:{
    staleCAS?:boolean;revokeIssuer?:boolean;unadopted?:boolean;
    missingJournal?:boolean;duplicateAttempt?:boolean;
    badEvidence?:boolean;qaMissing?:boolean;qaMismatch?:boolean;
  }={}) {
    const st = contextFor();
    const obs={attempt:1,outcome:"succeeded",observationDigest,
      evidenceReferences:["github:"+context.repository+"@"+context.appHead+"#src/form"],
      filesTouched:[],tokensUsed:0};
    const stores={
      authority:{
        currentAllowedIssuers:vi.fn(async()=>new Map([["trusted-operator",issuerRecord]])),
        latestIssuer:vi.fn(async()=>options.revokeIssuer?
          {...issuerRecord,decision:"revoke"}:issuerRecord),
        latestAdoption:vi.fn(async()=>({
          projectId:context.projectId,workflowId:approved.workflowId,
          workflowDigest:digest,policyVersion:"1.3.0",
          decision:options.unadopted?"revoke":"adopt"
        }))
      },
      workPackages:{
        findWorkPackageById:vi.fn(async(id:string)=>({
          id,projectId:context.projectId,meta:{
            recordVersion:options.staleCAS?5:4
          }
        }))
      },
      execution:{
        read:vi.fn(async()=>({
          claimed:!options.missingJournal,
          attempts:options.missingJournal?[]:options.duplicateAttempt?[obs,obs]:[
            {...obs,evidenceReferences:options.badEvidence?
              ["github:"+context.repository+"@"+context.appHead+"#outside"]:obs.evidenceReferences}
          ]
        }))
      },
      qa:{
        readVerified:vi.fn(async()=>options.qaMissing?null:{
          requestId:st.requestId,attempt:1,sourceRevision:context.appHead,
          observationDigest:options.qaMismatch?"sha256:"+"f".repeat(64):observationDigest,
          verifiedFiles:1,verifierId:"pinned-independent-github-readback-v1"
        })
      }
    };
    const service=new ReviewerBSourceAdmissionService(
      stores as unknown as ConstructorParameters<typeof ReviewerBSourceAdmissionService>[0]
    );
    return {service,st,stores};
  }
  it("binds actual signed issuer, adopted workflow, canonical WP CAS and P3 journal without claiming B",async()=>{
    const {service,st,stores}=setup();
    const result=await service.verifySource(st);
    expect(result.status).toBe("SOURCE_AND_P3_QA_JOURNAL_VERIFIED");
    expect(result.signedSourceInspectionVerified).toBe(true);
    expect(result.canonicalWorkPackageCASVerified).toBe(true);
    expect(result.independentP3QaJournalVerified).toBe(true);
    expect(result.reviewerBPrincipalVerified).toBe(false);
    expect(result.reviewerBReviewExecuted).toBe(false);
    expect(result.authenticatedReviewEvidenceIssued).toBe(false);
    expect(result.qualityGatePassed).toBe(false);
    expect(result.productionAuthorized).toBe(false);
    expect(stores.execution.read).toHaveBeenCalledWith(st.requestId);
  });
  it("invalid signed requestId cannot hijack another journal's PASS",async()=>{
    const {service,st,stores}=setup();
    await expect(service.verifySource({...st,requestId:hash("forged")})).
      rejects.toThrow(/requestId/);
    expect(stores.execution.read).not.toHaveBeenCalled();
  });
  it("expired Hub WorkOrder denies admission even when underlying grant is valid",async()=>{
    const {service,st}=setup();
    const expired={...st.order,expiresAt:"2026-10-13T03:04:00.000Z"};
    await expect(service.verifySource({...st,order:{...expired,orderKey:reviewOrderKey(expired)}})).
      rejects.toThrow(/expired/);
  });
  it("a revoked issuer or unadopted workflow fails before journal lookup",async()=>{
    for(const options of [{revokeIssuer:true},{unadopted:true}]) {
      const {service,st,stores}=setup(options);
      await expect(service.verifySource(st)).rejects.toThrow();
      expect(stores.execution.read).not.toHaveBeenCalled();
    }
  });
  it("foreign or stale WorkPackage CAS fails before journal lookup",async()=>{
    const {service,st,stores}=setup({staleCAS:true});
    await expect(service.verifySource(st)).rejects.toThrow(/canonical WorkPackage CAS/);
    expect(stores.execution.read).not.toHaveBeenCalled();
  });
  it.each([
    ["issuer revocation", { revokeIssuer: true }, /issuer permission/],
    ["workflow revocation", { unadopted: true }, /not currently adopted/],
    ["WorkPackage CAS change", { staleCAS: true }, /canonical WorkPackage CAS/]
  ] as const)("rejects %s during QA journal readback", async (_change, update, reason) => {
    const options = {};
    const { service, st, stores } = setup(options);
    const readback = await stores.qa.readVerified();
    stores.qa.readVerified.mockImplementationOnce(async () => {
      Object.assign(options, update);
      return readback;
    });
    await expect(service.verifySource(st)).rejects.toThrow(reason);
  });
  it("rejects a WorkOrder that expires while reading the QA journal", async () => {
    const { service, st, stores } = setup();
    const readback = await stores.qa.readVerified();
    const monotonicClock = vi.spyOn(performance, "now").mockReturnValue(0);
    try {
      stores.qa.readVerified.mockImplementationOnce(async () => {
        monotonicClock.mockReturnValue(3 * 60_000);
        return readback;
      });
      await expect(service.verifySource(st)).rejects.toThrow(/expired/);
    } finally {
      monotonicClock.mockRestore();
    }
  });
  it("missing, duplicated, out-of-scope durable observations fail closed",async()=>{
    for(const options of [{missingJournal:true},{duplicateAttempt:true},{badEvidence:true}]) {
      const {service,st}=setup(options);
      await expect(service.verifySource(st)).rejects.toThrow(/G3_SOURCE_ADMISSION_BLOCKED/);
    }
  });
  it("missing or mutated P3 independent readback remains blocked",async()=>{
    for(const options of [{qaMissing:true},{qaMismatch:true}]) {
      const {service,st}=setup(options);
      await expect(service.verifySource(st)).rejects.toThrow(/P3|readback/);
    }
  });
  it("changed signed grant byte or source SHA fails even if previous journal passed",async()=>{
    const {service,st}=setup();
    await expect(service.verifySource({...st,grant:{...st.grant,appHead:"f".repeat(40)}})).
      rejects.toThrow(/source|signature/);
    await expect(service.verifySource({...st,order:{...st.order,sourceRevision:"f".repeat(40)}})).
      rejects.toThrow(/idempotency|binding|source/);
  });
});
