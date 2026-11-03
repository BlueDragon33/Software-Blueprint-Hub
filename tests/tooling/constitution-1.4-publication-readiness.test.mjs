import test from "node:test";
import assert from "node:assert/strict";
import {evaluateConstitution14PublicationReadiness} from "../../scripts/constitution-1.4-publication-readiness.mjs";
const HUB="BlueDragon33/Software-Blueprint-Hub",WORKER="BlueDragon33/Software-Blueprint-QA-Worker";
const sha="f6fac1dc654176429918e7939e564bdf9a8e9aaa";
function fixture(){
 const mk=(number,repo)=>({
  number,state:"open",draft:false,merged:false,
  head:{sha,repo:{full_name:repo}},
  user:{login:"BlueDragon33"}
 });
 const pullRequests={
  "hub-base":mk(152,HUB),"hub-action":mk(153,HUB),
  "hub-review-contract":mk(154,HUB),"worker-reviewer":mk(5,WORKER)
 };
 const reviews=Object.fromEntries(Object.keys(pullRequests).map(k=>[k,
  [{state:"APPROVED",commit_id:sha,user:{login:"independent-reviewer"}}]
 ]));
 return {main:{sha:"cd01fb3c2178393628ce968af209db082227d2c4",version:"1.3.0",
    protected:true,enforcementVerified:true},
  pullRequests,reviews,proofs:{
   eightSourceReplay:true,realOAuthQa:true,signedFourShardReview:true,
   ownerRatificationFromCanonicalDatabase:true,
   exactFullReleaseGate:true,impactAndSemverDecision:true
  }};
}
test("no publication authority is issued even if synthetic gate inputs are all true",()=>{
 const x=evaluateConstitution14PublicationReadiness(fixture());
 assert.equal(x.blockers.length,0);
 assert.equal(x.canPublish,false);
 assert.equal(x.authority,"READ_ONLY_NO_PUBLICATION_GRANT");
 assert.equal(x.technicalCandidateOnly,true);
});
test("realistic Draft/no-review/no-protection/no-ratification remains blocked",()=>{
 const data=fixture();
 for(const pr of Object.values(data.pullRequests))pr.draft=true;
 for(const key of Object.keys(data.reviews))data.reviews[key]=[];
 data.main.protected=false;data.main.enforcementVerified=false;
 data.proofs.realOAuthQa=false;data.proofs.signedFourShardReview=false;
 data.proofs.ownerRatificationFromCanonicalDatabase=false;
 data.proofs.exactFullReleaseGate=false;
 const x=evaluateConstitution14PublicationReadiness(data);
 assert.equal(x.canPublish,false);
 assert.ok(x.blockers.length>=10);
 for(const id of ["main-branch-enforcement","canonical-owner-ratification",
   "authenticated-oauth-qa","signed-scope-review","exact-full-gate"]) {
  assert.ok(x.blockers.some(b=>b.id===id),id);
 }
});
test("review on stale commit, author self-review or COMMENT does not count",()=>{
 for(const wrong of [
  {state:"APPROVED",commit_id:"0".repeat(40),user:{login:"independent-reviewer"}},
  {state:"APPROVED",commit_id:sha,user:{login:"BlueDragon33"}},
  {state:"COMMENTED",commit_id:sha,user:{login:"independent-reviewer"}}
 ]){
  const data=fixture();data.reviews["hub-action"]=[wrong];
  const result=evaluateConstitution14PublicationReadiness(data);
  assert.ok(result.blockers.some(b=>b.id==="independent-human-review-hub-action"));
 }
});
test("cannot infer authority from CI, broken identity or unverified main",()=>{
 const data=fixture();
 data.pullRequests["worker-reviewer"].head.repo.full_name=HUB;
 data.main.version="UNVERIFIED";
 data.proofs.eightSourceReplay=false;
 const result=evaluateConstitution14PublicationReadiness(data);
 assert.ok(result.blockers.some(b=>b.id==="source-worker-reviewer"));
 assert.ok(result.blockers.some(b=>b.id==="active-baseline-1.3.0"));
 assert.ok(result.blockers.some(b=>b.id==="eight-source-publication"));
});
test("missing runtime checkpoint cannot default to publication PASS",()=>{
 const result=evaluateConstitution14PublicationReadiness({});
 assert.equal(result.state,"BLOCKED");
 assert.equal(result.reason,"INVALID_TRUSTED_CHECKPOINT");
});
