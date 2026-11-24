
/** Read-only, PROJECT_READ-scoped canonical Work/Quality Gate projection. */
import { selectUniversalNextAction } from "./universal-next-action-frontier.candidate.mjs";
const outstanding=new Set(["planned","ready","in-progress","testing","review","blocked"]);
const priority={blocked:0,"in-progress":1,testing:2,review:3,ready:4,planned:5};
const outcome=(state,reason,workPackageId=null)=>Object.freeze({state,reason,workPackageId,mayExecute:false,gatePass:false,canDispatch:false});
/** This is observation of stored gate state, NOT independent QA certification. */
export function projectCanonicalNextAction(input){
 try{
  if(!input||typeof input!=="object"||Array.isArray(input))throw Error("missing source");
  const {projectId,projectName,sourceRevision,workPackages,gateBundles,requiredGateIds}=input;
  if(typeof projectId!=="string"||!/^project:[a-z0-9][a-z0-9-]{0,158}$/.test(projectId))throw Error("project");
  if(!Array.isArray(workPackages)||workPackages.length>500||
    !Array.isArray(gateBundles)||gateBundles.length>500||
    !Array.isArray(requiredGateIds)||requiredGateIds.length>100||
    requiredGateIds.some(id=>typeof id!=="string"))throw Error("bounds");
  const gateById=new Map();
  for(const bundle of gateBundles){
   const gate=bundle?.gate;
   if(!gate||gate.projectId!==projectId||typeof gate.id!=="string"||gateById.has(gate.id)||
      !Array.isArray(gate.evidenceIds)||!Array.isArray(bundle.evidence)||bundle.evidence.length>500||
      bundle.evidence.some(e=>!e||e.gateId!==gate.id))throw Error("gate scope");
   gateById.set(gate.id,bundle);
  }
  const scoped=workPackages.map(w=>{
   if(!w||w.projectId!==projectId||!Array.isArray(w.qualityGateIds))throw Error("work scope");
   return {projectId,id:w.id,title:w.title,status:w.status,dependencies:w.dependencies,
    gates:[...new Set([...requiredGateIds,...w.qualityGateIds])].map(id=>{
     const bundle=gateById.get(id);
     if(!bundle)return {id,status:"not-ready",evidenceComplete:false};
     const gate=bundle.gate,seen=new Set();
     const evidenceComplete=gate.evidenceIds.length>0 && gate.evidenceIds.every(eid=>{
      if(seen.has(eid))return false;seen.add(eid);
      return bundle.evidence.some(e=>e.id===eid&&e.gateId===id&&
       typeof e.source==="string"&&!!e.source.trim()&&
       typeof e.revision==="string"&&!!e.revision.trim());
     });
     return {id,status:gate.status,evidenceComplete};
    })
   };
  });
  const next=selectUniversalNextAction({projectId,projectName,sourceRevision,
    workPackages:scoped,capabilities:{scopedRunner:false,currentAuthority:false}});
  if(next.kind==="send-guidance"||next.kind==="execute-eligible")
   return outcome("ready","Work Package có phụ thuộc và Quality Gate phù hợp với dữ liệu canonical. Không phải quyền thực thi Agent.",next.workPackageId);
  if(next.kind==="none")return outcome("unverified","Không còn Work Package mở; chưa chứng minh toàn hệ thống DONE.");
  const blocked=scoped.filter(w=>outstanding.has(w.status)).sort((a,b)=>
   (priority[a.status]??99)-(priority[b.status]??99)||a.id.localeCompare(b.id))[0];
  return outcome("blocked","Chưa có công việc READY với phụ thuộc và Gate có bằng chứng. Cần kiểm tra/gỡ chặn, không được giả RUNNING.",blocked?.id??null);
 }catch{return outcome("unverified","Không xác minh được chính xác nguồn, dự án, phụ thuộc hoặc Quality Gate; không suy đoán READY/PASS.");}
}
