import { describe, expect, it } from "vitest";
import {
  analyzePastedCommandResult,createClickPlanCandidate,registeredReadOnlyCommands,
  recognizedCanonicalCommandId,resolveCanonicalNextWork
} from "../../packages/application/src/next-action-run-plan.candidate";

const projectId="project:blueprint-os";
const workPackageId="work:pilot-1";
const head="a".repeat(40);
const base={
  projectId,profileVersion:3,actionKind:"continue-work" as const,
  actionLabel:"Continue: Pilot QA",reason:"Unfinished authorized work",
  readinessState:"in-progress" as const,evidenceFreshness:"recorded-unverified" as const,
  sourceRevision:null,workPackageId,workPackageRecordVersion:2
};
const cmdTask={
  projectId,profileVersion:3,workPackageId,commandId:"git-status" as const,
  approvedPlanSource:"canonical-work-package-readonly-marker" as const,
  taskPlanRecordVersion:2
};

const task=(id:string,status:string)=>({
  id,title:"Pilot QA",status,purpose:"QA review",
  acceptanceCriteria:["Inspect safe evidence"],meta:{recordVersion:1}
});

describe("R33 typed automatic Next Action planner",()=>{
  it("generates bounded plan without clipboard or mutation grant",()=>{
    const plan=createClickPlanCandidate({...base,actionKind:"review-candidate"});
    expect(plan.prompt).toContain("TRIỂN KHAI TỪ ĐẦU TỚI CUỐI");
    expect(plan.mode).toBe("auto-read-only");
    expect(plan.command).toBeNull();
    expect(plan.mayExecuteMutation).toBe(false);
    expect(plan.mayLaunchWork).toBe(false);
    expect(plan.resultIsQaPass).toBe(false);
  });
  it("selects the canonical lowest-ID continue-work even with duplicate titles",()=>{
    const works=[
      task("work:z","ready"),
      task("work:a","planned")
    ];
    expect(resolveCanonicalNextWork({
      kind:"continue-work",label:"Continue: Pilot QA",blockedWorkId:null
    },works)?.id).toBe("work:a");
  });
  it("resolves blocked tasks by exact ID, never an ambiguous title",()=>{
    const works=[
      task("work:z","ready"),
      task("work:a","blocked")
    ];
    expect(resolveCanonicalNextWork({
      kind:"unblock-work",label:"Unblock: Pilot QA",blockedWorkId:"work:z"
    },works)?.id).toBe("work:z");
  });
  it("refuses to invent a CMD target when label or blocked ID drift",()=>{
    const works=[{id:"work:a",title:"Pilot QA",status:"ready"}];
    expect(resolveCanonicalNextWork({kind:"continue-work",label:"Continue: Different",blockedWorkId:null},works)).toBeNull();
    expect(resolveCanonicalNextWork({kind:"unblock-work",label:"Unblock: Pilot QA",blockedWorkId:"work:missing"},works)).toBeNull();
  });
  it("does not synthesize a signed runner for canonical work",()=>{
    const plan=createClickPlanCandidate(base);
    expect(plan.mode).toBe("requires-granted-runner");
    expect(plan.steps).toContain("stop-before-mutation-without-scoped-runner-grant");
  });
  it("accepts exactly one allowlisted CMD marker from canonical work",()=>{
    expect(recognizedCanonicalCommandId(["finish task","BLUEPRINT_CMD_READONLY:git-status"])).toBe("git-status");
    expect(recognizedCanonicalCommandId(["BLUEPRINT_CMD_READONLY:node-version"])).toBe("node-version");
  });
  it("rejects arbitrary CMD, duplicate markers and shell concatenation",()=>{
    expect(recognizedCanonicalCommandId(["BLUEPRINT_CMD_READONLY:del /s *"])).toBeNull();
    expect(recognizedCanonicalCommandId(["BLUEPRINT_CMD_READONLY:git-status && rm -rf /"])).toBeNull();
    expect(recognizedCanonicalCommandId(["BLUEPRINT_CMD_READONLY:git-head","BLUEPRINT_CMD_READONLY:git-status"])).toBeNull();
  });
  it("does not offer CMD without canonical marker",()=>{
    expect(recognizedCanonicalCommandId(["run git status yourself"])).toBeNull();
  });
  it("emits CMD step and paste-feedback from trusted canonical task",()=>{
    const plan=createClickPlanCandidate(base,cmdTask);
    expect(plan.mode).toBe("needs-cmd-result");
    expect(plan.command?.displayCommand).toBe("git status --short --branch");
    expect(plan.command?.evidenceStatus).toBe("pasted-output-unverified");
    expect(plan.command?.workPackageRecordVersion).toBe(2);
  });
  it("denies cross-project and stale-profile CMD binding",()=>{
    expect(()=>createClickPlanCandidate(base,{...cmdTask,projectId:"project:other"})).toThrow(/canonically bound/);
    expect(()=>createClickPlanCandidate(base,{...cmdTask,profileVersion:4})).toThrow(/canonically bound/);
  });
  it("denies mismatched WorkPackage and missing canonical read-only marker",()=>{
    expect(()=>createClickPlanCandidate(base,{...cmdTask,workPackageId:"work:other"})).toThrow(/canonically bound/);
    expect(()=>createClickPlanCandidate(base,{...cmdTask,approvedPlanSource:"not-verified" as typeof cmdTask.approvedPlanSource})).toThrow(/canonically bound/);
  });
  it("denies mismatched canonical WorkPackage record version from plan input",()=>{
    expect(()=>createClickPlanCandidate({...base,workPackageRecordVersion:3},cmdTask)).toThrow(/canonically bound/);
  });
  it("rejects malformed Git HEAD as untrusted CMD result",()=>{
    const cmd=createClickPlanCandidate(base,{...cmdTask,commandId:"git-head"}).command!;
    expect(analyzePastedCommandResult(cmd,"fatal: not a git repository").status).toBe("REJECTED");
  });
  it("rejects failed Git status command output",()=>{
    const cmd=createClickPlanCandidate(base,cmdTask).command!;
    expect(analyzePastedCommandResult(cmd,"fatal: not a git repository").accepted).toBe(false);
  });
  it("rejects malformed Node version",()=>{
    const cmd=createClickPlanCandidate(base,{...cmdTask,commandId:"node-version"}).command!;
    expect(analyzePastedCommandResult(cmd,"v22.x").status).toBe("REJECTED");
  });
  it("denies invalid task record version",()=>{
    expect(()=>createClickPlanCandidate(base,{...cmdTask,taskPlanRecordVersion:0})).toThrow(/canonically bound/);
  });
  it("CMD commands are limited to read-only diagnostic allowlist",()=>{
    expect(Object.keys(registeredReadOnlyCommands).sort()).toEqual(["git-head","git-status","node-version"]);
    expect(Object.values(registeredReadOnlyCommands).join(";")).not.toMatch(/(^|;)(del|rm|powershell|curl)\b/);
  });
  it("CMD output inspection never upgrades QA PASS",()=>{
    const cmd=createClickPlanCandidate(base,cmdTask).command!;
    const result=analyzePastedCommandResult(cmd,"## main\n M test.ts");
    expect(result.status).toBe("UNVERIFIED_MANUAL_OUTPUT");
    expect(result.mayCloseQualityGate).toBe(false);
  });
  it("rejects empty CMD output",()=>{
    const cmd=createClickPlanCandidate(base,cmdTask).command!;
    expect(analyzePastedCommandResult(cmd,"").status).toBe("REJECTED");
  });
  it("rejects more than 24k CMD output",()=>{
    const cmd=createClickPlanCandidate(base,cmdTask).command!;
    expect(analyzePastedCommandResult(cmd,"x".repeat(24001)).accepted).toBe(false);
  });
  it("rejects forged command ID-to-text mismatch",()=>{
    const cmd=createClickPlanCandidate(base,cmdTask).command!;
    expect(analyzePastedCommandResult({...cmd,displayCommand:"del /s /q *"},"test").accepted).toBe(false);
  });
  it("recognizes shape of Git HEAD without claiming actual source verification",()=>{
    const plan=createClickPlanCandidate({...base,sourceRevision:head}, {...cmdTask,commandId:"git-head"});
    const r=analyzePastedCommandResult(plan.command!,head);
    expect(r.accepted).toBe(true);
    expect(r.status).toBe("UNVERIFIED_MANUAL_OUTPUT");
  });
});
