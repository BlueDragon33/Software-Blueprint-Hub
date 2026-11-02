import { beforeEach, describe, expect, it, vi } from "vitest";

const stubs=vi.hoisted(()=>({ loadProjectWorkspace:vi.fn() }));
vi.mock("../../apps/web/src/server/project-workspace",()=>({
  loadProjectWorkspace:stubs.loadProjectWorkspace
}));
vi.mock("next/navigation",()=>({
  redirect:vi.fn((href:string)=>{throw new Error("REDIRECT:"+href);})
}));
vi.mock("@blueprint-os/application",async()=>({
  ...(await import("../../packages/application/src/unified-next-action")),
  ...(await import("../../packages/application/src/next-action-run-plan.candidate"))
}));

import {
  startGuidedNextAction,receiveGuidedCmdResult
} from "../../apps/web/app/projects/[projectId]/actions";

const projectId="project:blueprint-os";
const baseWork={
  id:"work:pilot",projectId,title:"Pilot",status:"ready",purpose:"Inspect local environment",
  meta:{recordVersion:2},acceptanceCriteria:["Review signed evidence","BLUEPRINT_CMD_READONLY:git-status"]
};
function fixture({
  changedProfile=false,changedAction=false,disabled=false,hasCmd=true
}:{
  changedProfile?:boolean;changedAction?:boolean;disabled?:boolean;hasCmd?:boolean
}={}){
  const readiness={read:vi.fn(async()=>({
    projectId,state:"in-progress",
    nextAction:{
      kind:changedAction?"prepare-gate":"continue-work",
      label:changedAction?"Prepare gate: QA":"Continue: Pilot",
      reason:"Canonical WorkPackage requires next review"
    },
    blockedWork:[],
    evidenceSummary:{freshness:"recorded-unverified",linked:1}
  }))};
  const workQuality={
    listWorkPackages:vi.fn(async()=>[{
      ...baseWork,
      acceptanceCriteria:hasCmd?baseWork.acceptanceCriteria:["Review signed evidence"]
    }]),
    listQualityGates:vi.fn(async()=>[])
  };
  const workspace=disabled?{state:"forbidden"}:{
    state:"ready",projectId,actor:{principalId:"principal:auditor"},
    project:{profile:{meta:{recordVersion:changedProfile?4:3}},blueprint:{requiredGates:[]}},
    runtime:{readiness,workQuality}
  };
  stubs.loadProjectWorkspace.mockResolvedValue(workspace);
  return {readiness,workQuality};
}
beforeEach(()=>vi.resetAllMocks());

describe("R33 server-bound one-click / CMD integration candidate",()=>{
  it("one click reads canonical WorkPackage + Gate and returns CMD panel, no QA grant",async()=>{
    const {readiness,workQuality}=fixture();
    const out=await startGuidedNextAction(projectId,3,"continue-work","next");
    expect(out.generatedPlan).toBe(true);
    expect(out.mode).toBe("needs-cmd-result");
    expect(out.command?.displayCommand).toBe("git status --short --branch");
    expect(out.command?.workPackageRecordVersion).toBe(2);
    expect(out.qaPassed).toBe(false);
    expect(out.autoMutation).toBe(false);
    expect(readiness.read).toHaveBeenCalledTimes(1);
    expect(workQuality.listWorkPackages).toHaveBeenCalledTimes(1);
    expect(workQuality.listQualityGates).toHaveBeenCalledTimes(1);
  });
  it("does not show CMD when canonical task lacks marker",async()=>{
    fixture({hasCmd:false});
    const out=await startGuidedNextAction(projectId,3,"continue-work","end-to-end");
    expect(out.state).toBe("BLOCKED");
    expect(out.mode).toBe("requires-granted-runner");
    expect(out.command).toBeNull();
  });
  it("rejects stale ProjectProfile before reading task inventory",async()=>{
    const {workQuality}=fixture({changedProfile:true});
    const out=await startGuidedNextAction(projectId,3,"continue-work","next");
    expect(out.state).toBe("STALE");
    expect(workQuality.listWorkPackages).not.toHaveBeenCalled();
    expect(workQuality.listQualityGates).not.toHaveBeenCalled();
  });
  it("rejects changed canonical Next Action before reading task inventory",async()=>{
    const {workQuality}=fixture({changedAction:true});
    const out=await startGuidedNextAction(projectId,3,"continue-work","next");
    expect(out.state).toBe("STALE");
    expect(workQuality.listWorkPackages).not.toHaveBeenCalled();
  });
  it("does not disclose a forbidden project or execute a step",async()=>{
    fixture({disabled:true});
    const out=await startGuidedNextAction(projectId,3,"continue-work","next");
    expect(out.state).toBe("BLOCKED");
    expect(out.readback).toBeNull();
    expect(out.generatedPlan).toBe(false);
  });
  it("accepts a redacted CMD paste as UNVERIFIED only",async()=>{
    fixture();
    const out=await receiveGuidedCmdResult(
      projectId,3,"continue-work","git-status","work:pilot",2,"## main\n M readme.md"
    );
    expect(out.state).toBe("UNVERIFIED_MANUAL_OUTPUT");
    expect(out.detail).toMatch(/không đủ xác nhận/);
  });
  it("rejects an old CMD result submitted for wrong WorkPackage recordVersion",async()=>{
    fixture();
    const out=await receiveGuidedCmdResult(
      projectId,3,"continue-work","git-status","work:pilot",1,"## main"
    );
    expect(out.state).toBe("REJECTED");
    expect(out.detail).toMatch(/phiên bản/);
  });
  it("rejects injected or nonallowlisted command identity",async()=>{
    fixture();
    const out=await receiveGuidedCmdResult(
      projectId,3,"continue-work","git-status && rm","work:pilot",2,"## main"
    );
    expect(out.state).toBe("REJECTED");
  });
  it("rejects stale actor on CMD submission",async()=>{
    fixture({disabled:true});
    const out=await receiveGuidedCmdResult(
      projectId,3,"continue-work","git-status","work:pilot",2,"## main"
    );
    expect(out.state).toBe("REJECTED");
  });
});
