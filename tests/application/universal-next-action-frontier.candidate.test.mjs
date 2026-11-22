import test from "node:test";
import assert from "node:assert/strict";
import { selectUniversalNextAction as select } from "../../packages/application/src/universal-next-action-frontier.candidate.mjs";
const rev="a".repeat(40);
const wp=(id,status="ready",dependencies=[],gates=[])=>({projectId:"project:blueprint-os",id,title:id,status,dependencies,gates});
const s=works=>({projectId:"project:blueprint-os",projectName:"Blueprint OS",sourceRevision:rev,workPackages:works});
test("prioritizes eligible work instead of a blocked item",()=>{
  const r=select(s([wp("A","blocked"),wp("B"),wp("C","ready",["B"])]));
  assert.equal(r.workPackageId,"B"); assert.equal(r.mayExecute,false);
});
test("never executes without verified scoped capability",()=>{
  assert.equal(select({...s([wp("A")]),capabilities:{scopedRunner:true}}).mayExecute,false);
  assert.equal(select({...s([wp("A")]),capabilities:{scopedRunner:true,currentAuthority:true}}).mayExecute,true);
});
test("no false pass when a gate lacks evidence",()=>{
  const r=select(s([wp("A","ready",[],[{id:"Q",status:"pass",evidenceComplete:false}])]));
  assert.equal(r.kind,"blocked");
});
test("blocks cross-project contamination and cycles",()=>{
  assert.throws(()=>select(s([{...wp("A"),projectId:"project:other"}])),/cross-project/);
  assert.throws(()=>select(s([wp("A","ready",["B"]),wp("B","ready",["A"])])),/cycle/);
});
test("does not invent work or shell capability",()=>{
  assert.equal(select(s([])).kind,"none");
  assert.equal(select({...s([wp("A")]),capabilities:{requiresWindows:true}}).requiresNativeBatch,true);
});
