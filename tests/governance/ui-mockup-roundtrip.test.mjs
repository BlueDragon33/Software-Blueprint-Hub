import test from "node:test";
import assert from "node:assert/strict";
import {readJson,validateRoundTripContract,resolveRoundTripIntent} from "../../scripts/check-ui-mockup-roundtrip.mjs";

const read=(path)=>readJson(new URL(path,import.meta.url));
const contract=read("../../control/ui-mockup-roundtrip.contract.v1.json");
const aliases=read("../../control/ui-mockup-command-aliases.v1.json");
const workflow=read("../../prompt-workflows/templates/ui-mockup-roundtrip.v1.json");
const registry=read("../../control/ui-mockup-registry.v1.json");
const clone=(x)=>structuredClone(x);
const sha="a".repeat(40),digest="sha256:"+"b".repeat(64),digestSpec="sha256:"+"c".repeat(64);
const context={appId:"project:application-management",surfaceId:"app-overview",route:"/dashboard",
 uiState:"authenticated-owner",appHead:sha};
function model(status="draft") {
 return {schemaVersion:"1.0.0",mockupId:"mockup:application-management:app-overview:v1",
 appId:context.appId,repository:"BlueDragon33/Application-Management",route:context.route,
 surfaceId:context.surfaceId,uiState:context.uiState,sourceSha:sha,
 policyVersion:"1.3.0",viewport:["mobile","desktop"],
 image:{path:"artifacts/ui-mockups/app-overview/v1.png",sha256:digest,mediaType:"image/png"},
 spec:{path:"artifacts/ui-mockups/app-overview/v1.spec.json",sha256:digestSpec,mediaType:"application/json"},
 status,presentationScope:{allowedChanges:["layout"],forbiddenChanges:["new-routes"],
 allowedSourcePaths:["src/pages/app-overview.tsx"]},mappings:[{componentId:"app-grid",kind:"visual-only",anchor:null,actionId:null,dataBinding:null,stateBinding:null}],createdAt:"2026-10-16T00:00:00.000Z",
 designApproval:status==="approved"?{approvedByPrincipal:"verified-owner-principal",approvedAt:"2026-10-16T00:02:00.000Z",
 imageSha256:digest,specSha256:digestSpec,approvalEvidenceRef:"canonical:approval/mockup-v1"}:null};
}
test("candidate files validate without pretending that they are active law or approved designs",()=>{
 assert.deepEqual(validateRoundTripContract(contract,aliases,workflow,registry),[]);
 assert.equal(registry.entries.length,0);
 assert.equal(contract.status,"candidate-not-ratified");
 assert.equal(workflow.status,"candidate-not-executable");
});
test("short Vietnamese alias resolves CREATE without code writes or preapproved status",()=>{
 const result=resolveRoundTripIntent("   TẠO    GIAO DIỆN MẪU ",context,registry,aliases);
 assert.equal(result.status,"READY_TO_DRAFT");
 assert.equal(result.maximumImages,1);
 assert.equal(result.mayEditAppCode,false);
 assert.equal(result.sourceSha,sha);
 assert.equal(resolveRoundTripIntent("Tạo giao diện mẫu",{},registry,aliases).reason,"AMBIGUOUS_SCOPE");
});
test("APPLY can never fall back to draft, unregistered image or unapproved assistant claims",()=>{
 assert.equal(resolveRoundTripIntent("Theo mẫu đã có áp dụng vào giao diện",context,registry,aliases).reason,
 "MISSING_OR_AMBIGUOUS_APPROVED_MOCKUP");
 const withDraft={...registry,entries:[model()]};
 assert.equal(resolveRoundTripIntent("Theo mẫu đã có áp dụng vào giao diện",context,withDraft,aliases).status,"BLOCKED");
 assert.equal(resolveRoundTripIntent("Duyệt mẫu này",context,withDraft,aliases).reason,
 "EXACT_DRAFT_AND_HUMAN_APPROVAL_REQUIRED");
});
test("APPLY requires exact approval hashes, current SHA and trusted host authorization",()=>{
 const approved={...registry,entries:[model("approved")]};
 assert.equal(resolveRoundTripIntent("Theo mẫu đã có áp dụng vào giao diện",context,approved,aliases).reason,
 "UNVERIFIED_APPROVAL_OR_EDITOR");
 assert.equal(resolveRoundTripIntent("Theo mẫu đã có áp dụng vào giao diện",context,approved,aliases,
 {verifiedApproval:true}).status,"BLOCKED");
 const ready=resolveRoundTripIntent("Theo mẫu đã có áp dụng vào giao diện",context,approved,aliases,
 {verifiedApproval:true,scopedEditor:true});
 assert.equal(ready.status,"READY_FOR_SCOPED_IMPLEMENTATION");
 assert.equal(ready.imageGeneration,"never");
 assert.equal(ready.productionAuthorized,false);
 assert.equal(ready.qualityGatePassed,false);
 assert.deepEqual(ready.allowedPaths,["src/pages/app-overview.tsx"]);
 const changed={...context,appHead:"f".repeat(40)};
 assert.equal(resolveRoundTripIntent("Theo mẫu đã có áp dụng vào giao diện",changed,approved,aliases,
 {verifiedApproval:true,scopedEditor:true}).reason,"STALE_SOURCE_REQUIRES_REVIEW");
 approved.entries[0].designApproval.imageSha256="sha256:"+"f".repeat(64);
 assert.equal(resolveRoundTripIntent("Theo mẫu đã có áp dụng vào giao diện",context,approved,aliases,
 {verifiedApproval:true,scopedEditor:true}).reason,"INVALID_APPROVAL_PROVENANCE");
});
test("validator detects fake authority, image generation on apply and duplicate approved scopes",()=>{
 const c=clone(contract);c.commands.APPLY_APPROVED_MOCKUP.imageGeneration="regenerate";
 assert.match(validateRoundTripContract(c,aliases,workflow,registry).join(","),/unsafe authority/);
 const a=clone(aliases);a.aliases[2].mayInvokeImageGeneration=true;
 assert.match(validateRoundTripContract(contract,a,workflow,registry).join(","),/alias must be bounded/);
 const w=clone(workflow);w.flows[1].nodes[3].allowedActions.push("generate-new-image");
 assert.match(validateRoundTripContract(contract,aliases,w,registry).join(","),/image generation in apply/);
 const reg=clone(registry);reg.entries=[model("approved"),{...model("approved"),mockupId:"mockup:application-management:app-overview:v2"}];
 assert.match(validateRoundTripContract(contract,aliases,workflow,reg).join(","),/ambiguous approved mockup/);
});
test("unknown commands never fall back to an image generation or product code write",()=>{
 assert.equal(resolveRoundTripIntent("Làm gì cũng được",context,registry,aliases).reason,"UNRECOGNIZED_COMMAND");
});
