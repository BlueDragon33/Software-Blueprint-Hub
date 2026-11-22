import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {projectAtlasAndNextAction as project} from "../../packages/application/src/atlas-next-action-adapter.candidate.mjs";
const atlas=JSON.parse(fs.readFileSync(new URL("../fixtures/atlas-graph.candidate.fixture.json",import.meta.url),"utf8"));
const graph={projectId:atlas.projectId,sourceCodeRevision:atlas.sourceRevision,fingerprint:"synthetic",
 canonicalMutationAllowed:false,qualityGateMutationAllowed:false,agentDispatchAllowed:false,releaseAuthority:false};
const workSnapshot={projectId:atlas.projectId,projectName:"Blueprint OS",sourceRevision:atlas.sourceRevision,workPackages:[{projectId:atlas.projectId,id:"work:atlas",title:"Candidate",status:"ready",dependencies:[],gates:[]}],capabilities:{scopedRunner:true,currentAuthority:true,hostCanSend:true}};
const run=(override={})=>project({graph,atlas,workSnapshot,authorizedProjectId:atlas.projectId,...override});
test("read-only adapter yields send guidance even with claimed execution capabilities",()=>{const x=run();assert.equal(x.state,"ready");assert.equal(x.nextAction.mayExecute,false);assert.equal(x.nextAction.kind,"send-guidance");assert.equal(x.permissions.canDispatch,false);});
test("rejects wrong authorized project",()=>assert.equal(run({authorizedProjectId:"project:other"}).state,"blocked"));
test("rejects stale revision",()=>assert.equal(run({graph:{...graph,sourceCodeRevision:"b".repeat(40)}}).state,"blocked"));
test("rejects graph contract with dispatch permission",()=>assert.equal(run({graph:{...graph,agentDispatchAllowed:true}}).state,"blocked"));
test("rejects missing source revision",()=>assert.equal(run({graph:{...graph,sourceCodeRevision:null}}).state,"blocked"));
test("rejects invalid atlas",()=>assert.equal(run({atlas:{...atlas,edges:[...atlas.edges,{id:"edge:bad",type:"DEPENDS_ON",from:"goal:atlas",to:"missing",factState:"proposed",provenance:atlas.edges[0].provenance}]}}).state,"blocked"));
test("rejects cross-project work",()=>assert.equal(run({workSnapshot:{...workSnapshot,workPackages:[{...workSnapshot.workPackages[0],projectId:"project:other"}]}}).state,"blocked"));
test("traces the synthetic slice without implying production",()=>{const x=run();const ids={Goal:"goal:atlas",WorkPackage:"work:atlas",Gate:"gate:qa",Evidence:"evidence:fixture",Defect:"defect:fixture",Fix:"fix:fixture",Checkpoint:"checkpoint:fixture"};assert.equal(x.traceSlice(ids).valid,true);assert.equal(x.atlas.nodes[0].factState,"proposed");});
