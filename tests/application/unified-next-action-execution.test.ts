import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { inspectAuthorizedNextAction } from "../../packages/runtime/src/next-action-inspection-adapter";
import { workflowManifestDigest } from "../../packages/application/src/prompt-workflow-orchestration";
import type { BlueprintServerRuntime } from "../../packages/runtime/src";
import type {
  AuthorizedNextActionInspectionInput,
  TrustedNextActionInspectionServices
} from "../../packages/runtime/src/next-action-inspection-adapter";

const projectId="project:blueprint-os";
const now=new Date("2026-10-17T03:00:00.000Z");
const context={
  projectId,repository:"BlueDragon33/Software-Blueprint-Hub",
  appHead:"a".repeat(40),canonicalDigest:"sha256:"+"b".repeat(64),policyVersion:"1.3.0"
};
const manifest={
  project:{id:projectId,repo:context.repository},workflowId:"workflow-inspect",status:"approved",
  nodes:[]
} as unknown as AuthorizedNextActionInspectionInput["workflow"];
const input:AuthorizedNextActionInspectionInput={
  actor:{principalId:"principal:editor"},projectId,
  displayedProfileVersion:1,displayedActionKind:"continue-work",
  workPackageId:"work:inspect",workPackageRecordVersion:1,workflow:manifest,context,
  grant:{mode:"inspect-scoped"} // invalid grant: signature/adoption MUST reject
};

function harness(overrides: {
  deny?: boolean; stale?: boolean; changedAction?: boolean;
  missingWork?: boolean; blockedWork?: boolean; missingGate?: boolean;
  revokedAfter?: number; bindingDenied?: boolean
}={}) {
  let checks=0;
  const authorize=vi.fn(async (_actor:unknown,_project:string,action:string)=>{
    checks++;
    if(action!=="PROJECT_MUTATE" || overrides.deny ||
        (overrides.revokedAfter !== undefined && checks>overrides.revokedAfter)) {
      throw new Error("AUTHORIZATION_DENIED");
    }
  });
  const runtime={
    authority:{require:authorize},
    profiles:{read:vi.fn(async()=>({
      profile:{meta:{recordVersion:overrides.stale?2:1}},
      blueprint:{requiredGates:[]}
    }))},
    readiness:{read:vi.fn(async()=>({
      projectId,nextAction:{
        kind:overrides.changedAction?"define-gate":"continue-work",
        label:"Continue: Inspect",reason:"Available"
      }
    }))},
    workQuality:{
      listWorkPackages:vi.fn(async()=>overrides.missingWork?[]:[{
        id:"work:inspect",projectId,status:overrides.blockedWork?"blocked":"ready",
        meta:{recordVersion:1},dependencies:[],qualityGateIds:["gate:inspect"]
      }]),
      listQualityGates:vi.fn(async()=>[{
        gate:{id:"gate:inspect",projectId,status:overrides.missingGate?"not-ready":"pass"},
        evidence:overrides.missingGate?[]:[{id:"evidence:inspect"}]
      }])
    },
    workflowExecutionAuthority:{
      currentAllowedIssuers:vi.fn(async()=>new Map()),
      latestAdoption:vi.fn(),latestIssuer:vi.fn()
    },
    workflowExecutionJournal:{claim:vi.fn(),append:vi.fn(),read:vi.fn()},
    prisma:{
      nextActionWorkBindingDecision:{
        findFirst:vi.fn(async()=>overrides.bindingDenied?null:{
          projectId,workPackageId:"work:inspect",workPackageRecordVersion:1,
          workflowId:"workflow-inspect",workflowDigest:workflowManifestDigest(manifest),
          appHead:context.appHead,policyVersion:context.policyVersion,decision:"bind"
        })
      },
      workPackage:{findUnique:vi.fn(async()=>({
        projectId,recordVersion:1,status:"ready"
      }))},
      workflowExecutionAdoptionDecision:{findFirst:vi.fn(async()=>({
        policyVersion:context.policyVersion,decision:"adopt"
      }))},
      workflowExecutionQaVerification:{create:vi.fn(),findUnique:vi.fn()}
    }
  } as unknown as BlueprintServerRuntime;
  const runner=vi.fn();
  const qa=vi.fn();
  const source=vi.fn(async()=>[]);
  const services={
    runner:{execute:runner},qa:{verify:qa},
    source:{list:source},
    freshness:{assertCurrent:vi.fn(async()=>{})},
    trust:{publicKeyFor:vi.fn(()=>null)},
    verifier:{verify:vi.fn(async()=>false)},
    clock:()=>now
  } as unknown as TrustedNextActionInspectionServices;
  return {runtime,services,authorize,runner,qa,source};
}

describe("One-button internal execution adapter: no fake authority or dispatch",()=>{
  it("rejects anonymous, Viewer or revoked PROJECT_MUTATE before reaching a runner",async()=>{
    for(const opts of [{deny:true},{revokedAfter:0}]) {
      const h=harness(opts);
      await expect(inspectAuthorizedNextAction(h.runtime,input,h.services))
        .rejects.toThrow("AUTHORIZATION_DENIED");
      expect(h.runner).not.toHaveBeenCalled();
      expect(h.qa).not.toHaveBeenCalled();
      expect(h.runtime.workflowExecutionJournal.claim).not.toHaveBeenCalled();
    }
    const h=harness({deny:true});
    await expect(inspectAuthorizedNextAction(h.runtime,{...input,actor:null},h.services))
      .rejects.toThrow("AUTHORIZATION_DENIED");
    expect(h.runner).not.toHaveBeenCalled();
  });
  it("rejects stale profile, action change and wrong repository/source before any journal claim",async()=>{
    for(const opts of [{stale:true},{changedAction:true}]) {
      const h=harness(opts);
      await expect(inspectAuthorizedNextAction(h.runtime,input,h.services))
        .rejects.toThrow(/stale or non-executable/i);
      expect(h.runner).not.toHaveBeenCalled();
    }
    const h=harness();
    await expect(inspectAuthorizedNextAction(h.runtime,{
      ...input,context:{...context,repository:"Other/Repository"}
    },h.services)).rejects.toThrow(/binding mismatch/);
    expect(h.runner).not.toHaveBeenCalled();
    expect(h.runtime.workflowExecutionJournal.claim).not.toHaveBeenCalled();
  });
  it("stops for missing/blocked WorkPackage and any gate without canonical PASS evidence",async()=>{
    for(const opts of [{missingWork:true},{blockedWork:true},{missingGate:true}]) {
      const h=harness(opts);
      await expect(inspectAuthorizedNextAction(h.runtime,input,h.services))
        .rejects.toThrow(/WorkPackage|Quality Gates/);
      expect(h.runner).not.toHaveBeenCalled();
      expect(h.qa).not.toHaveBeenCalled();
    }
  });
  it("refuses non-inspection modes at adapter boundary",async()=>{
    const h=harness();
    await expect(inspectAuthorizedNextAction(h.runtime,{
      ...input,grant:{mode:"edit-scoped"}
    },h.services)).rejects.toThrow(/inspect-scoped/);
    expect(h.authorize).not.toHaveBeenCalled();
    expect(h.runner).not.toHaveBeenCalled();
  });
  it("never accepts a self-asserted inspect grant without verified shape, signature, adoption and issuer",async()=>{
    const h=harness();
    await expect(inspectAuthorizedNextAction(h.runtime,input,h.services))
      .rejects.toThrow(/Invalid signed execution grant shape|Invalid workflow/);
    expect(h.runtime.workflowExecutionJournal.claim).not.toHaveBeenCalled();
    expect(h.runner).not.toHaveBeenCalled();
  });
  it("rejects missing or revoked canonical binding before the runner or journal",async()=>{
    const h=harness({bindingDenied:true});
    await expect(inspectAuthorizedNextAction(h.runtime,input,h.services))
      .rejects.toThrow(/NEXT_ACTION_BINDING_DENIED/);
    expect(h.runtime.workflowExecutionJournal.claim).not.toHaveBeenCalled();
    expect(h.runner).not.toHaveBeenCalled();
  });
  it("uses only existing Postgres authority, execution journal and separate QA storage",()=>{
    const source=readFileSync(new URL("../../packages/runtime/src/next-action-inspection-adapter.ts",import.meta.url),"utf8");
    expect(source).toContain("PostgresWorkflowExecutionAuthority.load(");
    expect(source).toContain("new PostgresNextActionWorkBindingRepository(runtime.prisma)");
    expect(source).toContain("runtime.workflowExecutionJournal");
    expect(source).toContain("new PostgresWorkflowInspectionQaJournal(runtime.prisma)");
    expect(source).toContain("executeAndVerifyScopedInspection(");
    expect(source).toContain('runtime.authority.require(input.actor, input.projectId, "PROJECT_MUTATE")');
    expect(source).not.toContain("export async function POST(");
    expect(source).not.toContain("grantProjectRole(");
    expect(source).not.toContain("mergePullRequest(");
  });
});
