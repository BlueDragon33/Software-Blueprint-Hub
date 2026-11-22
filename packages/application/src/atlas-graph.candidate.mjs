/** Candidate read-only graph projection; never grants authority or changes canonical records. */
export const ATLAS_VERSION="0.1.0";
export const NODE_TYPES=["Vision","Principle","ConstitutionClause","Amendment","Authority","Project","Repository","Module","Interface","Contract","Requirement","Goal","WorkPackage","Step","Algorithm","Formula","Dataset","Model","TrainingRun","Experiment","Test","Gate","Evidence","Defect","Incident","Decision","Release","Runtime","Device","Capability","Checkpoint","FutureCandidate","Fix"];
export const EDGE_TYPES=["REFINES","INHERITS","SUPERSEDES","DEPENDS_ON","IMPLEMENTS","CALLS","READS","WRITES","PRODUCES","CONSUMES","VERIFIED_BY","GOVERNED_BY","AUTHORIZED_BY","BLOCKED_BY","CAUSES_VERIFIED","SUSPECTED_CAUSE","FIXED_BY","REGRESSED_BY","MIGRATES_TO","COMPATIBLE_WITH","DEPLOYED_AS","TRACES_TO"];
const id=/^[A-Za-z][A-Za-z0-9:._/-]{1,159}$/,sha=/^[a-f0-9]{40}$/;
const facts=new Set(["observed","verified","proposed","blocked","superseded"]);
const stages=new Set(["planned","ready","in-progress","testing","review","completed","archived","blocked"]);
const error=(code,subject)=>({code,subject});
export function validateAtlas(graph){
 const errors=[];if(!graph||typeof graph!=="object"||Array.isArray(graph))return {valid:false,errors:[error("GRAPH","object required")]};
 if(graph.schemaVersion!==ATLAS_VERSION)errors.push(error("VERSION","schemaVersion"));
 if(!id.test(graph.projectId??""))errors.push(error("PROJECT","projectId"));
 if(!sha.test(graph.sourceRevision??""))errors.push(error("REVISION","sourceRevision"));
 if(!Array.isArray(graph.nodes)||!Array.isArray(graph.edges))return {valid:false,errors:[...errors,error("ARRAYS","nodes and edges")]};
 if(graph.nodes.length>10000||graph.edges.length>50000)errors.push(error("LIMIT","graph"));
 const nodes=new Map(),edgeIds=new Set(),deps=new Map();
 for(const n of graph.nodes){
  if(!n||typeof n!=="object"){errors.push(error("NODE","malformed"));continue;}
  if(!id.test(n.id??"")||nodes.has(n.id))errors.push(error("NODE_ID",n.id));
  if(!NODE_TYPES.includes(n.type))errors.push(error("NODE_TYPE",n.id));
  if(n.projectId!==graph.projectId)errors.push(error("NODE_SCOPE",n.id));
  if(typeof n.title!=="string"||!n.title.trim()||n.title.length>300)errors.push(error("NODE_TITLE",n.id));
  if(!facts.has(n.factState)||!stages.has(n.lifecycle))errors.push(error("NODE_STATE",n.id));
  if(!n.provenance||typeof n.provenance.source!=="string"||!n.provenance.source||!sha.test(n.provenance.revision??""))errors.push(error("PROVENANCE",n.id));
  if(id.test(n.id??""))nodes.set(n.id,n);
 }
 for(const e of graph.edges){
  if(!e||typeof e!=="object"){errors.push(error("EDGE","malformed"));continue;}
  if(!id.test(e.id??"")||edgeIds.has(e.id))errors.push(error("EDGE_ID",e.id));edgeIds.add(e.id);
  if(!EDGE_TYPES.includes(e.type))errors.push(error("EDGE_TYPE",e.id));
  if(!nodes.has(e.from)||!nodes.has(e.to))errors.push(error("DANGLING_EDGE",e.id));
  if(e.from===e.to)errors.push(error("SELF_EDGE",e.id));
  if(!facts.has(e.factState)||!e.provenance||typeof e.provenance.source!=="string"||!e.provenance.source||!sha.test(e.provenance.revision??""))errors.push(error("EDGE_PROVENANCE",e.id));
  if(e.type==="CAUSES_VERIFIED"&&(e.factState!=="verified"||!e.evidenceRef||nodes.get(e.evidenceRef)?.type!=="Evidence"||nodes.get(e.evidenceRef)?.factState!=="verified"))errors.push(error("FALSE_CAUSAL_CLAIM",e.id));
  if(e.type==="VERIFIED_BY"&&!["Evidence","Test"].includes(nodes.get(e.to)?.type))errors.push(error("INVALID_VERIFIER",e.id));
  if(e.type==="DEPENDS_ON"&&nodes.has(e.from)&&nodes.has(e.to))deps.set(e.from,[...(deps.get(e.from)||[]),e.to]);
 }
 const seen=new Map();
 function visit(k){if(seen.get(k)===1){errors.push(error("DEPENDENCY_CYCLE",k));return;}if(seen.get(k)===2)return;seen.set(k,1);for(const d of deps.get(k)||[])visit(d);seen.set(k,2);}
 for(const k of nodes.keys())if(!seen.has(k))visit(k);
 return {valid:errors.length===0,errors};
}
export function traceAtlas(graph,startId,{direction="both",edgeTypes=null,maxDepth=12}={}){
 const result=validateAtlas(graph);if(!result.valid)throw Error("ATLAS_INVALID: "+result.errors.map(x=>x.code).join(","));
 if(!graph.nodes.some(n=>n.id===startId))throw Error("ATLAS_UNKNOWN_NODE");
 if(!["both","forward","reverse"].includes(direction)||!Number.isInteger(maxDepth)||maxDepth<0||maxDepth>30)throw Error("ATLAS_BAD_TRACE");
 const allowed=edgeTypes?new Set(edgeTypes):null,visited=new Set([startId]),queue=[[startId,0]],paths=[];
 for(let i=0;i<queue.length;i++){const [node,depth]=queue[i];if(depth>=maxDepth)continue;
  for(const e of graph.edges){if(allowed&&!allowed.has(e.type))continue;
   const next=direction!=="reverse"&&e.from===node?e.to:direction!=="forward"&&e.to===node?e.from:null;
   if(next!==null&&!visited.has(next)){visited.add(next);queue.push([next,depth+1]);paths.push({from:node,to:next,edgeId:e.id,type:e.type,depth:depth+1});}
  }
 }
 return {startId,visited:[...visited],paths};
}
export function verifyVerticalSlice(graph,ids){
 const v=validateAtlas(graph);if(!v.valid)return {valid:false,errors:v.errors};
 const nodes=new Map(graph.nodes.map(n=>[n.id,n])),errors=[];
 for(const type of ["Goal","WorkPackage","Gate","Evidence","Defect","Fix","Checkpoint"])if(nodes.get(ids?.[type])?.type!==type)errors.push(error("SLICE_NODE",type));
 for(const [a,b,type] of [["WorkPackage","Goal","TRACES_TO"],["WorkPackage","Gate","BLOCKED_BY"],["Gate","Evidence","VERIFIED_BY"],["Defect","Evidence","TRACES_TO"],["Defect","Fix","FIXED_BY"],["Fix","Checkpoint","PRODUCES"]])
  if(!graph.edges.some(e=>e.from===ids?.[a]&&e.to===ids?.[b]&&e.type===type))errors.push(error("SLICE_EDGE",a+"->"+b));
 return {valid:errors.length===0,errors,trace:errors.length?null:traceAtlas(graph,ids.Defect,{maxDepth:6})};
}
