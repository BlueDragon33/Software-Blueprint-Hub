import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {events,assess,audit} from "../scripts/zero-spend-audit.mjs";

test("private macOS automatic CI never receives cost PASS",()=>{
 const x=assess("on:\n  pull_request:\njobs:\n  test:\n    runs-on: macos-15\n","private","ci.yml");
 assert.equal(x.risk,"PRIVATE_AUTO_REVIEW");
 assert.equal(x.ciExecuted,false);
});
test("manual dispatch still does not imply free minutes",()=>{
 const x=assess("on: workflow_dispatch\njobs:\n  build:\n    runs-on: macos-15","private","ci.yml");
 assert.equal(x.triggerKind,"MANUAL_ONLY");
 assert.equal(x.risk,"MANUAL_NOT_COST_FREE");
});
test("public hosted only a candidate not a payment or authority guarantee",()=>{
 const x=assess("on: [push, pull_request]\njobs:\n  a:\n    runs-on: ubuntu-latest\n","public","ci.yml");
 assert.equal(x.risk,"PUBLIC_STANDARD_CANDIDATE");
 assert.equal(x.costUnknown,true);
});
test("unrecognized triggers fail closed as unknown",()=>{
 const x=events("on:\n  future_undocumented_event:\n");
 assert.equal(x.kind,"UNKNOWN");
});
test("dynamic runs-on remains unknown even on public repo",()=>{
 const x=assess("on: pull_request\njobs:\n  a:\n    runs-on: "+ "$"+"{{ matrix.os }}","public","ci.yml");
 assert.equal(x.risk,"UNKNOWN_RUNNER_REVIEW");
});
test("self-hosted requires security review not automatic opt in",()=>{
 const x=assess("on: workflow_dispatch\njobs:\n  a:\n    runs-on: [self-hosted, windows]\n","private","ci.yml");
 assert.equal(x.risk,"SELF_HOSTED_SECURITY_REVIEW");
});
test("missing repos are NOT_CHECKED; scan does not execute anything",()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"zero-spend-"));
 try{
  const dir=path.join(root,"A",".github","workflows");
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,"ci.yml"),"on:\n  push:\njobs:\n  test:\n    runs-on: windows-latest\n");
  const x=audit(root,{repositories:[{name:"A",visibility:"private"},{name:"B",visibility:"private"}]});
  assert.equal(x.inventoryCount,2);
  assert.equal(x.scanned,1);
  assert.equal(x.workflowCount,1);
  assert.equal(x.githubHostedMinutesConsumedByAudit,0);
  assert.equal(x.repositories[1].status,"NOT_CHECKED_LOCAL_REPO_MISSING");
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
