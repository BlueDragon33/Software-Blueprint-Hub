import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {validateDepartmentOwnership} from "./check-execution-departments.mjs";
import {validateRoundTripContract} from "./check-ui-mockup-roundtrip.mjs";
import {validateR33Proposal} from "./check-execution-continuity-r33.mjs";

const sha=/^[a-f0-9]{40}$/;
const nonempty=x=>typeof x==="string"&&x.trim().length>0;
const record=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const safe=(value)=>Object.freeze(value);

export function validateUnifiedLifecycle(c,d,m,ma,mr,mw,r,ra){
 const e=[];
 if(c?.schemaVersion!=="1.0.0"||c.kind!=="unified-evidence-lifecycle"||c.status!=="candidate-not-operational"||
    c.owner!=="BlueDragon33/Software-Blueprint-Hub"||c.dependsOnConstitution?.activeLawUnchanged!==true||
    c.dependsOnConstitution?.version!=="1.3.0")e.push("unified candidate must not claim active law");
 const references={
  departments:"control/execution-department-ownership.v1.json",
  mockupContract:"control/ui-mockup-roundtrip.contract.v1.json",
  mockupAliases:"control/ui-mockup-command-aliases.v1.json",
  mockupRegistry:"control/ui-mockup-registry.v1.json",
  mockupWorkflow:"prompt-workflows/templates/ui-mockup-roundtrip.v1.json",
  recoveryContract:"control/execution-continuity-r33.contract.v1.json",
  recoveryAliases:"control/execution-continuity-r33-aliases.v1.json"
 };
 for(const [k,v] of Object.entries(references))if(c?.canonicalReferences?.[k]!==v)e.push("canonical reference mismatch: "+k);
 e.push(...validateDepartmentOwnership(d),...validateRoundTripContract(m,ma,mw,mr),...validateR33Proposal(r,ra));
 if(d.departments?.length!==12||d.applicationTester?.owner!=="verification")e.push("application tester must remain inside 12-department verification");
 const trustedFlags=["submittedStructureIsNotAuthentication","callerClaimedVerifiedByTrustedAdapterIsNotSufficient",
   "externalProviderReadbackRequiredForVerifiedEvidence","sourceShaAndDigestMustBeCrossCheckedAtTrustedSource",
   "independentReviewerMustBeAuthenticatedAndDistinctForProtectedGates",
   "neverInferProductPassFromScreenshotOrCI","noRealTesterSessionClaimFromFilledBugReport",
   "thisCandidateDoesNotInstallRuntimeVerifier"];
 if(!trustedFlags.every(k=>c?.evidenceTrustBoundary?.[k]===true)||
    c?.evidenceTrustBoundary?.unverifiedOrUnreachableAuthority!=="UNVERIFIED"||
    !c?.evidenceStates?.includes("EVIDENCE_FORMAT_READY")||
    !c?.evidenceStates?.includes("TESTER_SPEC_FORMAT_READY"))
    e.push("forged or missing review evidence trust boundary");
 const actions=c?.nextActionUX;
 if(actions?.kind!=="universal-next-action-suggestion"||actions?.status!=="candidate-not-active"||
   actions?.scope?.projectCoverage!=="all-existing-active-and-future-governed-projects-on-adoption"||
   actions?.scope?.mustNotClaimAutomaticDeploymentToExistingApps!==true||
   actions?.scope?.newDatabase!==false||actions?.scope?.oneCentralContract!==true||
   actions?.recommendationRules?.maximumButtons!==3||actions?.recommendationRules?.maximumPrimary!==1||
   !["preferEndToEndPrimaryForMultiStepEligibleWork","endToEndContinuesWithoutUnnecessaryConfirmation",
     "endToEndRequiresExistingAuthorityAndLiveReadback","endToEndStopsOnlyAtRealCapabilityOrAuthorityGate",
     "endToEndRespectsFiniteR7RepairBudget","endToEndSessionBound",
     "endToEndNeverOverridesReviewOrRelease","endToEndAlwaysPersistsTrustedCheckpointIfAuthorized"].every(
      k=>actions?.recommendationRules?.[k]===true)||
   actions?.recommendationRules?.oneClickSubmitsRequestNotCompletesTask!==true||
   actions?.recommendationRules?.chatButtonsArePresentationNotRepositoryFeature!==true||
   actions?.recommendationRules?.noInferredApproval!==true||
   actions?.recommendationRules?.noDirectIrreversibleAction!==true||
   actions?.recommendationRules?.hideWhenStatusDoneOrBlockedWithoutSafeAction!==true||
   actions?.adoption?.productionAuthorized!==false||
   actions?.adoption?.notAutoInstalledOnChatGPT!==true||
   actions?.adoption?.constitutionalRatificationRequiredForNormativeEnforcement!==true||
   new Set((actions?.actionKinds??[]).map(x=>x.kind)).size!==5||
   !["end-to-end","continue","status","fix","review"].every(id=>actions?.actionKinds?.some(x=>x.kind===id))||
   actions?.actionKinds?.find(x=>x.kind==="end-to-end")?.intent!=="EXECUTE_AUTHORIZED_END_TO_END"||
   actions?.actionKinds?.find(x=>x.kind==="end-to-end")?.doesNotAuthorizeNewActions!==true||
   !["protected-human-approval","independent-reviewer-unavailable","unknown-mutation-outcome",
     "tool-or-session-unavailable","attempt-budget-exhausted"].every(x=>actions?.actionKinds?.find(
      k=>k.kind==="end-to-end")?.stopReasons?.includes(x)))
   e.push("unsafe or duplicate universal next-action controls");
  if(c?.scope?.newCentralDatabase!==false||c?.guardrails?.duplicateApprovalDatabasesForbidden!==true||
   c?.implementationBoundary?.candidateReadOnlyOrchestration!==true||
   c?.implementationBoundary?.doesNotTriggerGenerationOrWrite!==true||
   c?.implementationBoundary?.noAutomaticReviewSignoff!==true||
   c?.implementationBoundary?.noReleaseAuthority!==true)e.push("integration may not create authority, effects or duplicate database");
 for(const key of ["screenImageNeverProvesFunction","nonUIVisualNotApplicable","codeReviewBeforeCompleteProduct",
    "applicationTesterRequiresRealRunnableBuild","mockupApprovalNotReleaseApproval",
    "reviewerIndependenceRequiredForProtectedGates","aiCannotSelfRatify","ciCannotClaimWholeProductPass"]) {
  if(c?.guardrails?.[key]!==true)e.push("unsafe gate: "+key);
 }
 if(!Array.isArray(c.workflow)||c.workflow.length!==9)e.push("expected nine bounded nodes");
 const nodes=new Map();
 for(const n of c.workflow??[]){
  if(!nonempty(n.id)||nodes.has(n.id)||!d.departments?.some(x=>x.id===n.role)||
    !Array.isArray(n.dependsOn)||!Array.isArray(n.requires)||!n.requires.length)e.push("invalid graph node "+n.id);
  nodes.set(n.id,n);
 }
 for(const n of nodes.values())for(const dep of n.dependsOn)if(!nodes.has(dep)||dep===n.id)e.push("invalid dependency "+n.id);
 const stack=new Set(),seen=new Set();
 function visit(id){
  if(stack.has(id)){e.push("dependency cycle at "+id);return;}
  if(seen.has(id)||!nodes.has(id))return;
  stack.add(id);for(const k of nodes.get(id).dependsOn)visit(k);stack.delete(id);seen.add(id);
 }
 for(const id of nodes.keys())visit(id);
 if(nodes.get("review")?.dependsOn?.includes("verify"))e.push("design review cannot wait for full app implementation");
 if(!nodes.get("tester")?.dependsOn?.includes("verify")||
    !nodes.get("release")?.dependsOn?.includes("tester")||
    !nodes.get("release")?.dependsOn?.includes("review"))e.push("release must depend on tester and independent review");
 if(c?.recovery?.noBlindReplay!==true||c?.recovery?.doesNotAutoGrantGate!==true||
   c?.recovery?.scope!=="every-stage"||c?.recovery?.noBackgroundWork!==true)e.push("R33 must cover every work stage without granting authority");
 if(new Set([...(ma.aliases??[]),...(ra.aliases??[])].map(x=>x.phrase?.normalize("NFC").toLocaleLowerCase("vi-VN").trim())).size!==
   (ma.aliases??[]).length+(ra.aliases??[]).length)e.push("duplicate command aliases");
 return e;
}

/**
 * Read-only ChatGPT UI suggestions for any governed project, without implying
 * buttons are installed in native apps. Caller renders these as user-triggered
 * issueNewTurn controls, not as implicit API mutations or permission grants.
 */
export function suggestNextProjectActions(input){
 const repoName=input?.repository;
 const ref=input?.workItemRef;
 if(typeof repoName!=="string"||!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repoName)||
   typeof ref!=="string"||!/^((?:PR|Issue) #[1-9][0-9]{0,6}|[a-z][a-z0-9-]{1,40}:[a-z0-9._/-]{2,100})$/.test(ref))
   return Object.freeze([]);
 if(["DONE","DEPLOYED","BLOCKED_NO_SAFE_ACTION","AMBIGUOUS"].includes(input?.workStatus))
   return Object.freeze([]);
 const target=repoName+" — "+ref;
 const make=(kind,label,query)=>{
  if(query.length>530)throw Error("unsafe action query length");
  return Object.freeze({kind,label,query,hostAction:"issueNewTurn",
   readOnly:kind==="status",completesTask:false,authorityGranted:false});
 };
 const endToEnd=make("end-to-end","Triển khai từ đầu đến cuối",
   "Triển khai từ đầu đến cuối cho "+target+
   ". Trong phiên làm việc được cấp quyền: đọc checkpoint, HEAD và bằng chứng thật, xác định mọi bước còn lại, "+
   "thực hiện liên tục các bước kỹ thuật đủ quyền, tự sửa lỗi theo vòng R7 hữu hạn và kiểm thử lại, "+
   "lưu checkpoint có xác minh. Không cần hỏi lại khi không có cổng bắt buộc. "+
   "Chỉ dừng khi có can thiệp con người thật sự cần thiết, quyền/tool không đủ, kết quả thao tác chưa xác minh "+
   "hoặc vượt giới hạn sửa lỗi. Không tự review, phê chuẩn Hiến pháp, merge trái chính sách hay deploy Production; "+
   "không hứa chạy nền sau khi phiên kết thúc.");
  const report=make("status","Kiểm tra tiến độ",
   "Báo checkpoint — "+target+". Chỉ đọc trạng thái GitHub và bằng chứng thực tế. Không thay đổi dữ liệu hoặc chạy lại CI.");
 if(input?.workStatus==="UNVERIFIED"||input?.workStatus==="REVIEW_BLOCKED")
   return Object.freeze([report]);
 if(input?.observedDefect===true&&input?.workStatus==="ACTIVE"){
  return Object.freeze([endToEnd,
   make("fix","Sửa lỗi","Điều tra và sửa lỗi thực tế trong "+target+
     ". Đối chiếu HEAD, logs, phạm vi quyền và kiểm thử hồi quy; không tự merge hoặc phê duyệt."),
   report]);
 }
 if(input?.workStatus==="REVIEW_PENDING"){
  return Object.freeze([endToEnd,
   make("review","Chuẩn bị review","Kiểm tra bằng chứng và chuẩn bị review độc lập cho "+target+
     ". Không tự phê chuẩn, không tự merge, không vượt Quality Gates."),
   report]);
 }
 if(input?.workStatus==="ACTIVE"||input?.workStatus==="VERIFIED_PENDING"){
  return Object.freeze([endToEnd,
   make("continue","Tiếp tục công việc","Tiếp tục từ checkpoint "+target+
    ". Kiểm tra HEAD và trạng thái thật trước khi làm; chỉ thực hiện bước có đủ thẩm quyền."),
   report]);
 }
 return Object.freeze([report]);
}

const kinds={
 "design-contract":["source-contract"],
 "visual-asset":["image-digest","component-map"],
 "runnable-slice":["running-trace","regression"],
 "release-candidate":["release-build","tester-session","defect-report"],
 "operational-observation":["deployment","health-trace"]
};
/** Structural evidence intake only: a boolean or digest *submitted by the caller*
 * never constitutes authenticated evidence. Host must perform independent readback
 * from a trusted provider before any REVIEW PASS can be recorded.
 */
export function evaluateReviewEvidence(tier,sourceSha,items,{nonUIScope=null}={}){
 if(!Object.hasOwn(kinds,tier)||!sha.test(sourceSha??""))
  return safe({status:"BLOCKED",reason:"INVALID_SCOPE_OR_REVISION",qualityGatePassed:false});
 if(tier==="visual-asset"&&nonUIScope!==null){
  if(!record(nonUIScope)||nonUIScope.sourceSha!==sourceSha||
     !nonempty(nonUIScope.scopeId)||!nonempty(nonUIScope.ownerEvidenceRef))
   return safe({status:"BLOCKED",reason:"NON_UI_EXCEPTION_UNGROUNDED",qualityGatePassed:false});
  return safe({status:"NOT_APPLICABLE_PENDING_REVIEW",reason:"NON_UI_SCOPE_CLAIM_REQUIRES_VERIFICATION",
    qualityGatePassed:false,independentlyVerified:false});
 }
 if(!Array.isArray(items))
  return safe({status:"NOT_REVIEWABLE",missing:kinds[tier],qualityGatePassed:false});
 const candidates=items.filter(x=>record(x)&&nonempty(x.ref)&&x.sourceSha===sourceSha&&
    // Legacy "verifiedByTrustedAdapter" can be *asserted* by untrusted data.
    // Its value may not upgrade candidate evidence into a trusted gate.
    (x.kind!=="image-digest"||/^sha256:[a-f0-9]{64}$/.test(x.contentDigest??"")));
 const missing=kinds[tier].filter(k=>!candidates.some(x=>x.kind===k));
 if(missing.length)return safe({status:"NOT_REVIEWABLE",missing,qualityGatePassed:false});
 return safe({status:"EVIDENCE_FORMAT_READY",tier,sourceSha,
    scope:"untrusted-structure-only",independentlyVerified:false,
    trustedReadbackRequired:true,qualityGatePassed:false,humanReviewPassed:false,
    productAccepted:false,releaseAuthorized:false});
}

/** A tester's reported session is an input to review, not proof that a real
 * user operated a real build. No self-reported fields can authenticate a session.
 */
export function evaluateTesterCase(testCase,model){
 const fields=model?.applicationTester?.issueContract?.requiredFields??[];
 if(!record(testCase)||!Array.isArray(fields)||fields.length<10)
  return safe({status:"BLOCKED",reason:"NO_VALID_TESTER_CONTRACT_OR_SESSION"});
 const missing=fields.filter(k=>{
  const value=testCase[k];
  return Array.isArray(value)?value.length===0||!value.every(nonempty):!nonempty(value);
 });
 if(missing.length)return safe({status:"BLOCKED",reason:"MISSING_TESTER_SPEC",missing});
 if(!sha.test(testCase.buildSha??""))
  return safe({status:"BLOCKED",reason:"INVALID_BUILD_SHA"});
 if(!Array.isArray(testCase.reproductionSteps)||testCase.reproductionSteps.length===0||
    !testCase.reproductionSteps.every(nonempty))
  return safe({status:"BLOCKED",reason:"INVALID_REPRO_STEPS"});
 if(!model.applicationTester.issueContract.statusValues.includes(testCase.status)||
    !model.applicationTester.issueContract.severityValues.includes(testCase.severity))
   return safe({status:"BLOCKED",reason:"INVALID_VERDICT_OR_SEVERITY"});
 return safe({status:"TESTER_SPEC_FORMAT_READY",sourceSha:testCase.buildSha,
   realSessionObserved:false,independentlyVerified:false,sourceReadbackRequired:true,
   qualityGatePassed:false,releaseAuthorized:false,humanReviewPassed:false});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
 const c=read("../control/unified-evidence-lifecycle.v1.json");
 const errors=validateUnifiedLifecycle(c,read("../control/execution-department-ownership.v1.json"),
 read("../control/ui-mockup-roundtrip.contract.v1.json"),
 read("../control/ui-mockup-command-aliases.v1.json"),
 read("../control/ui-mockup-registry.v1.json"),
 read("../prompt-workflows/templates/ui-mockup-roundtrip.v1.json"),
 read("../control/execution-continuity-r33.contract.v1.json"),
 read("../control/execution-continuity-r33-aliases.v1.json"));
 if(errors.length){for(const er of errors)console.error("BLOCK "+er);process.exitCode=1;}
 else console.log("UNIFIED EVIDENCE LIFECYCLE CANDIDATE PASS — NO AUTOMATIC REVIEW OR RELEASE AUTHORITY");
}
