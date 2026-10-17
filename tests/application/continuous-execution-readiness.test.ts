import { describe, expect, it } from "vitest";
import type { QualityGate, WorkPackage } from "../../packages/contracts/src";
import {
  assessCanonicalContinuousReadiness,
  type ContinuousProjectSnapshot
} from "../../packages/core/src/continuous-execution";

const SHA = "a".repeat(40);
const at = "2026-10-17T00:00:00Z";
const meta = {schemaVersion:"1.0.0" as const,recordVersion:1,createdAt:at,updatedAt:at};

function work(projectId:string,id:string,
  status:WorkPackage["status"]="ready",
  dependencies:string[]=[],
  qualityGateIds:string[]=[]):WorkPackage {
  return {id,projectId,title:id,purpose:"Deliver a real product slice",
    dependencies,acceptanceCriteria:["Functional product evidence"],
    qualityGateIds,status,meta};
}
function gate(projectId:string,id:string,
  status:QualityGate["status"]="not-ready",
  evidenceIds:string[]=[]):QualityGate {
  return {id,projectId,name:id,
    requirements:["Verified product source"],status,evidenceIds,meta};
}
function snapshot(projectId:string):ContinuousProjectSnapshot {
  const prereq=work(projectId,"work:foundation","completed");
  const target=work(projectId,"work:offline-prea0","ready",[prereq.id],
    ["gate:offline-smoke"]);
  return {projectId,profileVersion:1,canonicalRevision:"canonical-digest-v1",
    appHead:SHA,canMutate:true,
    requiredGateIds:["gate:offline-smoke"],
    workPackages:[prereq,target],
    gates:[gate(projectId,"gate:offline-smoke","not-ready")]};
}

describe("authenticated-source continuous readiness projection (no issuer authorization)",()=>{
  it("pilot A: existing Bauman project has a READY task, never auto-dispatches",()=>{
    const result=assessCanonicalContinuousReadiness(
      snapshot("project:bauman-master-ai-system"));
    expect(result.state).toBe("READY_WORK_FOUND");
    expect(result.nextWorkId).toBe("work:offline-prea0");
    expect(result.preflightEvidenceReady).toBe(false);
    expect(result.canDispatch).toBe(false);
  });
  it("pilot B: new project fails closed until it has a canonical HEAD, gate and READY work",()=>{
    const newApp="project:future-offline-app";
    const data=snapshot(newApp);
    expect(assessCanonicalContinuousReadiness({...data,appHead:null}).state)
      .toBe("UNVERIFIED");
    expect(assessCanonicalContinuousReadiness({...data,gates:[]}).state)
      .toBe("BLOCKED");
    expect(assessCanonicalContinuousReadiness({
      ...data,workPackages:data.workPackages.map(w=>({...w,status:"planned"}))
    }).state).toBe("BLOCKED");
    expect(assessCanonicalContinuousReadiness(data).state)
      .toBe("READY_WORK_FOUND");
  });
  it("a signed-in Viewer can read but never gets an execution authority",()=>{
    const result=assessCanonicalContinuousReadiness({
      ...snapshot("project:bauman-master-ai-system"),canMutate:false});
    expect(result.state).toBe("READ_ONLY");
    expect(result.canDispatch).toBe(false);
  });
  it("a failing required gate blocks, and user-supplied fake PASS is rejected",()=>{
    const data=snapshot("project:bauman-master-ai-system");
    expect(assessCanonicalContinuousReadiness({...data,
      gates:[gate(data.projectId,"gate:offline-smoke","fail")]}).state)
      .toBe("BLOCKED");
    const forged=assessCanonicalContinuousReadiness({...data,
      gates:[gate(data.projectId,"gate:offline-smoke","pass",[])]});
    expect(forged.state).toBe("BLOCKED");
    expect(forged.reasons.join(" ")).toMatch(/PASS without linked evidence/);
  });
  it("wrong project, duplicates, unknown dependency and cycles are rejected",()=>{
    const data=snapshot("project:bauman-master-ai-system");
    expect(assessCanonicalContinuousReadiness({...data,
      workPackages:[work("project:other","work:alien")]}).state)
      .toBe("UNVERIFIED");
    expect(assessCanonicalContinuousReadiness({...data,
      workPackages:[...data.workPackages,data.workPackages[0]!]}).state)
      .toBe("UNVERIFIED");
    expect(assessCanonicalContinuousReadiness({...data,
      workPackages:[work(data.projectId,"work:unknown","ready",["work:absent"])]}).state)
      .toBe("UNVERIFIED");
    expect(assessCanonicalContinuousReadiness({...data,
      workPackages:[work(data.projectId,"work:a","ready",["work:b"]),
        work(data.projectId,"work:b","ready",["work:a"])]}).state)
      .toBe("UNVERIFIED");
  });
  it("in-progress work is not misrepresented as a newly READY task",()=>{
    const data=snapshot("project:bauman-master-ai-system");
    const updated=data.workPackages.map(w=>w.id==="work:offline-prea0"?
      {...w,status:"in-progress" as const}:w);
    const result=assessCanonicalContinuousReadiness({...data,workPackages:updated});
    expect(result.state).toBe("BLOCKED");
    expect(result.nextWorkId).toBeNull();
  });
});
