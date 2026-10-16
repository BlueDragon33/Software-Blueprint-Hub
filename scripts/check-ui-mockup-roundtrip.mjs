import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

export const readJson = (path) => JSON.parse(readFileSync(path,"utf8"));
const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const A = (x) => Array.isArray(x);
const denied = (reason) => Object.freeze({status:"BLOCKED",reason});
const n = (v) => String(v ?? "").normalize("NFC").toLocaleLowerCase("vi-VN").trim().replace(/\s+/gu," ");

export function validateRoundTripContract(contract, aliases, template, registry) {
 const errors=[],bad=(v)=>errors.push(v);
 if (contract?.kind!=="ui-mockup-roundtrip-contract"||contract.status!=="candidate-not-ratified"||
     contract.owner!=="BlueDragon33/Software-Blueprint-Hub"||
     contract.parent?.minimumVersion!=="1.3.0"||
     contract.parent?.authority!=="active-constitution-wins")bad("contract authority");
 if (contract?.commands?.CREATE_MOCKUP?.codeChanges!==false||
     contract?.commands?.APPLY_APPROVED_MOCKUP?.imageGeneration!=="never"||
     contract?.commands?.APPLY_APPROVED_MOCKUP?.requiresStatus!=="approved"||
     contract?.commands?.APPLY_APPROVED_MOCKUP?.qualityGatePassed!==false||
     contract?.commands?.APPLY_APPROVED_MOCKUP?.productionAuthorized!==false||
     contract?.invariants?.noInventedCapability!==true||
     contract?.invariants?.explicitHumanDesignApproval!==true||
     contract?.invariants?.noSelfQualityGatePass!==true)bad("contract unsafe authority");
 const schema=contract?.recordSchema;
 const must=["mockupId","appId","repository","route","surfaceId","uiState","sourceSha","policyVersion","viewport","image","spec","status","presentationScope","mappings","createdAt","designApproval"];
 if (!A(schema?.required)||must.some(k=>!schema.required.includes(k))||
     schema?.additionalProperties!==false||
     !schema?.properties?.designApproval||
     !schema?.properties?.presentationScope||
     !schema?.properties?.image||
     !schema?.properties?.spec)bad("record schema missing grounding and approval fields");
 const all=["CREATE_MOCKUP","APPROVE_MOCKUP","APPLY_APPROVED_MOCKUP"];
 if (aliases?.kind!=="ui-mockup-command-aliases"||aliases?.status!=="candidate-not-active"||
     !A(aliases?.aliases)||aliases.aliases.length!==3||
     new Set(aliases.aliases.map(x=>n(x.phrase))).size!==3)bad("command alias registry");
 for(const intent of all) {
  const alias=aliases?.aliases?.find(x=>x.intent===intent);
  if (!alias||alias.mayInvokeImageGeneration!==(intent==="CREATE_MOCKUP")||
      !A(alias.mustNever)||!A(alias.requires))bad("alias must be bounded: "+intent);
 }
 const applyAlias=aliases?.aliases?.find(x=>x.intent==="APPLY_APPROVED_MOCKUP");
 if (!applyAlias?.mustNever.includes("generate-new-image")||
     !applyAlias?.mustNever.includes("select-unapproved-draft")||
     aliases?.resolver?.fallbackToLastGeneratedImage!==false)bad("apply may regenerate or infer draft");
 if (template?.kind!=="ui-mockup-roundtrip-workflow-template"||
     template?.status!=="candidate-not-executable"||
     template?.templateGraphOnly!==true||
     template?.invariant?.applyImageGeneration!=="FORBIDDEN"||
     template?.invariant?.qualityGatePassed!==false||
     template?.invariant?.productionAuthorized!==false)bad("workflow authority");
 if (!A(template?.flows)||template.flows.length!==2||
     new Set(template.flows.map(x=>x.intent)).size!==2)bad("workflow graph cardinality");
 for (const flow of template?.flows??[]) {
  const graph=new Map(),nodes=flow.nodes??[];
  if (!A(nodes)||nodes.length<3||nodes.length>20) {bad("unbounded graph");continue;}
  for(const node of nodes) {
   if (!node?.id||graph.has(node.id)||!A(node?.dependsOn)||
       node?.onFailure!=="BLOCK"||node?.budget?.maxAttempts>3||
       node?.budget?.maxFiles>20||node?.budget?.maxTokenEstimate>12000||
       !A(node?.requiredEvidence)||node.requiredEvidence.length===0)bad("unsafe/missing workflow node");
   graph.set(node.id,node);
  }
  for(const node of nodes)for(const dep of node.dependsOn)if(!graph.has(dep)||dep===node.id)bad("bad dependency "+node.id);
  const visits=new Set(),stack=new Set();
  function visit(id) {
   if (stack.has(id)) {bad("cycle "+id);return;}
   if (visits.has(id)||!graph.has(id))return;
   stack.add(id);for(const d of graph.get(id).dependsOn)visit(d);stack.delete(id);visits.add(id);
  }
  for(const id of graph.keys())visit(id);
  if (!nodes.some(x=>x.stage==="TEST"))bad("missing test gate "+flow.intent);
  if (flow.intent==="APPLY_APPROVED_MOCKUP") {
   if (!nodes.some(x=>x.humanGate===true&&x.stage==="REVIEW"))bad("human UX review missing");
   if (nodes.some(x=>(x.allowedActions??[]).some(a=>/generate.*image/i.test(a))))bad("image generation in apply");
  }
  if (flow.intent==="CREATE_MOCKUP") {
   if (nodes.filter(x=>x.allowedActions?.includes("generate-one-image")).length!==1)bad("create must render exactly once");
   if (nodes.some(x=>(x.allowedActions??[]).some(a=>/^edit-/.test(a))))bad("create may edit code");
  }
 }
 if (registry?.kind!=="ui-mockup-registry-index"||registry?.status!=="candidate-not-active"||
     registry?.authority!=="read-only-index-no-design-approval-no-qa-pass"||
     !A(registry?.entries)||registry?.selectionPolicy?.exactlyOneApproved!==true)bad("registry authority");
 // Even if future entries are introduced, reject fabricated approvals and duplicate current approvals.
 const approved=new Set();
 for(const item of registry?.entries??[]) {
  if (!SHA.test(item.sourceSha??"")||!DIGEST.test(item.image?.sha256??"")||
      !DIGEST.test(item.spec?.sha256??""))bad("unverified image/spec provenance");
  if (item.status==="approved") {
   const k=[item.appId,item.surfaceId,item.route,item.uiState].join("|");
   if(approved.has(k))bad("ambiguous approved mockup");approved.add(k);
   if (!item.designApproval?.approvedByPrincipal||!/^canonical:[a-zA-Z0-9/:._#@-]{8,300}$/.test(item.designApproval?.approvalEvidenceRef??"")||item.designApproval.imageSha256!==item.image.sha256||
       item.designApproval.specSha256!==item.spec.sha256)bad("forged or mismatched approval");
  }
 }
 return errors;
}

/** Read-only deterministic resolver; never generates images, edits files or authenticates users.
 * The trusted host MUST independently verify approval & scoped editor authority.
 */
export function resolveRoundTripIntent(utterance,context,registry,aliases,{verifiedApproval=false,scopedEditor=false}={}) {
 const command=(aliases?.aliases??[]).find(x=>n(x.phrase)===n(utterance));
 if(!command)return denied("UNRECOGNIZED_COMMAND");
 if (!context?.appId||!context?.surfaceId||!context?.route||!context?.uiState||
     !SHA.test(context?.appHead??""))return denied("AMBIGUOUS_SCOPE");
 if(command.intent==="CREATE_MOCKUP")return Object.freeze({
  status:"READY_TO_DRAFT",intent:command.intent,maximumImages:1,mayEditAppCode:false,
  appId:context.appId,surfaceId:context.surfaceId,route:context.route,uiState:context.uiState,sourceSha:context.appHead
 });
 const entries=(registry?.entries??[]).filter(x=>x.appId===context.appId&&
   x.surfaceId===context.surfaceId&&x.route===context.route&&x.uiState===context.uiState);
 if(command.intent==="APPROVE_MOCKUP") {
  const drafts=entries.filter(x=>x.status==="draft");
  if(drafts.length!==1||!verifiedApproval)return denied("EXACT_DRAFT_AND_HUMAN_APPROVAL_REQUIRED");
  return Object.freeze({status:"AWAITING_VERIFIED_DESIGN_APPROVAL_RECORD",intent:command.intent,mockupId:drafts[0].mockupId,imageGeneration:"never",mayEditAppCode:false});
 }
 const approved=entries.filter(x=>x.status==="approved");
 if(approved.length!==1)return denied("MISSING_OR_AMBIGUOUS_APPROVED_MOCKUP");
 const model=approved[0];
 if(!DIGEST.test(model.image?.sha256??"")||!DIGEST.test(model.spec?.sha256??"")||
     model.designApproval?.imageSha256!==model.image.sha256||
     model.designApproval?.specSha256!==model.spec.sha256||
     !model.designApproval?.approvedByPrincipal||
     !/^canonical:[a-zA-Z0-9/:._#@-]{8,300}$/.test(model.designApproval?.approvalEvidenceRef??""))return denied("INVALID_APPROVAL_PROVENANCE");
 if(model.sourceSha!==context.appHead)return denied("STALE_SOURCE_REQUIRES_REVIEW");
 if(!verifiedApproval||!scopedEditor)return denied("UNVERIFIED_APPROVAL_OR_EDITOR");
 return Object.freeze({status:"READY_FOR_SCOPED_IMPLEMENTATION",intent:command.intent,
  mockupId:model.mockupId,sourceSha:model.sourceSha,imageGeneration:"never",
  allowedPaths:Object.freeze([...(model.presentationScope?.allowedSourcePaths??[])]),
  qualityGatePassed:false,productionAuthorized:false});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const read=(p)=>readJson(new URL(p,import.meta.url));
 const errors=validateRoundTripContract(
  read("../control/ui-mockup-roundtrip.contract.v1.json"),
  read("../control/ui-mockup-command-aliases.v1.json"),
  read("../prompt-workflows/templates/ui-mockup-roundtrip.v1.json"),
  read("../control/ui-mockup-registry.v1.json")
 );
 if (errors.length){console.error(errors.join("\n"));process.exitCode=1;}
 else console.log("UI MOCKUP CANDIDATE CONTRACT PASS — NOT RATIFIED, NO LIVE MOCKUP APPROVAL");
}
