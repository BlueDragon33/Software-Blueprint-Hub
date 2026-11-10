import {readFileSync} from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createUanaProposal, renderUanaDraft, hasCompleteUanaGateEvidence, UANA_VERSION,
  type UanaSource
} from "../../packages/application/src/universal-active-next-action";

const source: UanaSource = {
  projectId:"project:boi-ech-ai",
  projectName:"Bơi Ếch AI",
  constitutionVersion:"1.3.0",
  sourceRevision:"sha256:"+"a".repeat(64),
  projectionRevision:"sha256:"+"a".repeat(64),
  projectionId:"projection:boi-v1",
  repository:"BlueDragon33/BOIECH_AI",
  headSha:"b".repeat(40),
  checkpointRef:"https://github.com/BlueDragon33/BOIECH_AI/issues/108",
  workPackages:[
    {projectId:"project:boi-ech-ai",id:"BOI-L1",title:"Fix account intake",
      status:"completed",dependencies:[],qualityGateIds:[]},
    {projectId:"project:boi-ech-ai",id:"BOI-L2",title:"Owner approval and duration",
      status:"in-progress",dependencies:["BOI-L1"],qualityGateIds:["G4"]},
  ],
  gates:[{projectId:"project:boi-ech-ai",id:"G4",name:"Real Cloudflare Preview",
    status:"candidate",evidenceComplete:true}],
  requiredGateIds:["G4"]
};
const make = (overrides: Partial<UanaSource> = {}) => ({...source,...overrides});
describe("UANA 1.0 project-scoped choice → preview → edited human send contract",()=>{
 it("selects an actual outstanding Work Package, never reopens a completed one",()=>{
  const proposal=createUanaProposal(source)!;
  expect(proposal.schemaVersion).toBe(UANA_VERSION);
  expect(proposal.options.map(o=>o.id)).toEqual(["inspect","continue"]);
  expect(proposal.recommendedId).toBe("continue");
  expect(proposal.options[1].workPackageId).toBe("BOI-L2");
  expect(proposal.options[1].projectId).toBe(source.projectId);
  expect(proposal.qualityGatePassed).toBe(false);
  expect(proposal.productionAuthorized).toBe(false);
  expect(proposal.requiresOwnerSend).toBe(true);
  expect(proposal.derivedNotCanonical).toBe(true);
 });
 it("an in-progress task with non-PASS gate must recommend review-only unblock, not execution",()=>{
  const proposal=createUanaProposal(source)!;
  expect(proposal.options[1]).toMatchObject({id:"continue",isReviewOnly:true});
  expect(proposal.options[1].title).toMatch(/Gỡ chặn/);
  expect(proposal.options.some(o=>o.id==="extend")).toBe(false);
 });
 it("blocking gates never offer a fictitious unrestricted expansion",()=>{
  const proposal=createUanaProposal(make({
    workPackages:[{projectId:source.projectId,id:"BLOCK-1",title:"Missing Preview authorization",
      status:"blocked",dependencies:[],qualityGateIds:["G4"]}]
  }))!;
  expect(proposal.options.map(o=>o.id)).toEqual(["inspect","continue"]);
  expect(proposal.options[1].isReviewOnly).toBe(true);
  expect(proposal.options[1].title).toMatch(/Gỡ chặn/);
 });
 it("allows a bounded third advisory option only when the source has no active gate issues",()=>{
  const proposal=createUanaProposal(make({
    gates:[{projectId:source.projectId,id:"G4",name:"Preview",status:"pass",evidenceComplete:true}]
  }))!;
  expect(proposal.options).toHaveLength(3);
  expect(proposal.options[2]).toMatchObject({id:"extend",recommended:false,isReviewOnly:true});
 });
 it("a Gate marked PASS with missing verified evidence stays blocked, even if other gates PASS",()=>{
  const proposal=createUanaProposal(make({
    gates:[{...source.gates[0]!,status:"pass",evidenceComplete:false}]
  }))!;
  expect(proposal.options[1]).toMatchObject({id:"continue",isReviewOnly:true});
  expect(proposal.options.map(option=>option.id)).not.toContain("extend");
 });
 it("canonical gate evidence binding rejects missing, foreign or incomplete provenance",()=>{
  const eid="evidence:fixture-1";
  const valid={id:eid,gateId:"G4",source:"https://github.com/example/review/1",revision:"sha256:"+"a".repeat(64)};
  expect(hasCompleteUanaGateEvidence("G4",[eid],[valid])).toBe(true);
  expect(hasCompleteUanaGateEvidence("G4",[],[valid])).toBe(false);
  expect(hasCompleteUanaGateEvidence("G4",[eid],[])).toBe(false);
  expect(hasCompleteUanaGateEvidence("G4",[eid],[{...valid,gateId:"OTHER"}])).toBe(false);
  expect(hasCompleteUanaGateEvidence("G4",[eid],[{...valid,source:"   "}])).toBe(false);
  expect(hasCompleteUanaGateEvidence("G4",[eid],[{...valid,revision:""}])).toBe(false);
  expect(hasCompleteUanaGateEvidence("G4",[eid,eid],[valid])).toBe(false);
 });
 it("PASS alone never implies UANA release authority",()=>{
  const proposal=createUanaProposal(make({
    gates:[{...source.gates[0]!,status:"pass",evidenceComplete:true}]
  }))!;
  expect(proposal.options[1].isReviewOnly).toBe(false);
  expect(proposal.qualityGatePassed).toBe(false);
  expect(proposal.productionAuthorized).toBe(false);
 });
 it("unknown evidence-completeness truth must fail closed",()=>{
  const gate={projectId:source.projectId,id:"G4",name:"Preview",status:"pass"};
  expect(()=>createUanaProposal(make({gates:[gate as UanaSource["gates"][number]]})))
    .toThrow(/bounded canonical quality gates/);
 });
 it("required gate missing from registry is not interpreted as PASS",()=>{
  const proposal=createUanaProposal(make({gates:[]}))!;
  expect(proposal.options[1].isReviewOnly).toBe(true);
  expect(proposal.options[1].title).toMatch(/Gỡ chặn/);
  expect(proposal.options.map(x=>x.id)).not.toContain("extend");
 });
 it("Work Package gate missing even though global gates pass stays review-only",()=>{
  const proposal=createUanaProposal(make({
    requiredGateIds:[],
    gates:[{...source.gates[0]!,status:"pass",id:"OTHER"}]
  }))!;
  expect(proposal.options[1].isReviewOnly).toBe(true);
  expect(proposal.options).toHaveLength(2);
 });
 it("pending dependency or missing dependency cannot create an execute recommendation",()=>{
  const a=createUanaProposal(make({
    workPackages:source.workPackages.map(w=>w.id==="BOI-L1"?{...w,status:"planned"}:w),
    gates:[{...source.gates[0]!,status:"pass"}]
  }))!;
  expect(a.options[1].isReviewOnly).toBe(true);
  const b=createUanaProposal(make({
    workPackages:[{...source.workPackages[1]!,dependencies:["UNKNOWN-WORK"]}],
    gates:[{...source.gates[0]!,status:"pass"}]
  }))!;
  expect(b.options[1].isReviewOnly).toBe(true);
 });
 it("archived is a complete canonical status; review and testing remain unfinished",()=>{
  expect(createUanaProposal(make({workPackages:source.workPackages.map(w=>({...w,status:"archived"}))}))).toBeNull();
  expect(createUanaProposal(make({workPackages:[{...source.workPackages[1]!,status:"review",dependencies:[]}]}))).not.toBeNull();
  expect(()=>createUanaProposal(make({workPackages:[{...source.workPackages[1]!,status:"cancelled"}]}))).toThrow(/bounded canonical/);
 });
 it("missing required gate list is blocked, not silently assumed empty",()=>{
  const {requiredGateIds: _requiredGateIds,...missing}=source;
  expect(()=>createUanaProposal(missing as UanaSource)).toThrow(/required gate list/);
 });
 it("does not make up work when all canonical tasks are complete or absent",()=>{
  expect(createUanaProposal(make({workPackages:[]}))).toBeNull();
  expect(createUanaProposal(make({workPackages:source.workPackages.map(w=>({...w,status:"completed"}))}))).toBeNull();
 });
 it("fails closed on stale projection, invented SHA, unverified source ID and missing constitution",()=>{
  expect(()=>createUanaProposal(make({projectionRevision:"sha256:"+"c".repeat(64)}))).toThrow(/stale/);
  expect(()=>createUanaProposal(make({headSha:"not-a-sha"}))).toThrow(/Git HEAD/);
  expect(()=>createUanaProposal(make({projectId:"other-app"}))).toThrow(/project identity/);
  expect(()=>createUanaProposal(make({constitutionVersion:"next"}))).toThrow(/constitution/);
 });
 it("does not combine Work Packages or Quality Gates from another project",()=>{
  const foreign="project:cad-cam-3d";
  expect(()=>createUanaProposal(make({
    workPackages:[{...source.workPackages[1]!,projectId:foreign}]
  }))).toThrow(/cross-project Work Package/);
  expect(()=>createUanaProposal(make({
    gates:[{...source.gates[0]!,projectId:foreign}]
  }))).toThrow(/cross-project Quality Gate/);
 });
 it("renders a source-pinned, non-authoritative prompt that the owner can edit",()=>{
  const proposal=createUanaProposal(source)!;
  const text=renderUanaDraft(proposal,"continue");
  expect(text).toContain(source.projectId);
  expect(text).toContain(source.sourceRevision);
  expect(text).toContain(source.headSha);
  expect(text).toContain(source.checkpointRef);
  expect(text).toContain("OWNER CHỌN");
  expect(text).toContain("không tự merge/deploy Production");
  expect(text).toContain("Prompt này là bản handoff");
  expect(text).not.toContain("CAD_CAM_3D");
 });
 it("rejects a forged cross-project selection and fake authority flags",()=>{
  const proposal=createUanaProposal(source)!;
  expect(()=>renderUanaDraft(proposal,"not-real" as "continue")).toThrow(/current project/);
  expect(()=>renderUanaDraft({...proposal,productionAuthorized:true} as typeof proposal,
    "continue")).toThrow(/untrusted/);
  const poisoned={...proposal,options:[{...proposal.options[0]!,projectId:"project:cad-cam-3d"}]};
  expect(()=>renderUanaDraft(poisoned,"inspect")).toThrow(/current project/);
 });
 it("never labels a Prompt Projection as a GitHub Issue if no checkpoint exists",()=>{
  const {headSha: _headSha,repository: _repository,checkpointRef: _checkpointRef,...verifiedWithoutGit} = source;
  const proposal=createUanaProposal(verifiedWithoutGit)!;
  expect(proposal.context.checkpointRef).toBe("prompt-projection:projection:boi-v1");
  const text=renderUanaDraft(proposal,"inspect");
  expect(text).toMatch(/Git HEAD: CHƯA XÁC MINH/);
  expect(text).toMatch(/Repository: CHƯA XÁC MINH/);
 });
 it("rejects duplicate work or gate identities, preventing double suggestions",()=>{
  expect(()=>createUanaProposal(make({
    workPackages:[source.workPackages[1]!,source.workPackages[1]!]
  }))).toThrow(/duplicate Work Package/);
  expect(()=>createUanaProposal(make({gates:[source.gates[0]!,source.gates[0]!]}))).toThrow(/duplicate Gate/);
 });
});

describe("UANA portable metadata-only contract",()=>{
 it("machine schema keeps source identity and no-authority flags required",()=>{
  const schema=JSON.parse(readFileSync(new URL("../../schemas/uana-next-action.v1.json",import.meta.url),"utf8"));
  expect(schema.title).toMatch(/advisory only/);
  expect(schema.properties.schemaVersion.const).toBe("uana:v1.0");
  expect(schema.properties.productionAuthorized.const).toBe(false);
  expect(schema.properties.qualityGatePassed.const).toBe(false);
  expect(schema.properties.requiresOwnerSend.const).toBe(true);
  expect(schema.properties.derivedNotCanonical.const).toBe(true);
  expect(schema.properties.context.required).toContain("sourceRevision");
  expect(schema.properties.context.required).toContain("projectId");
  expect(schema.properties.options.maxItems).toBe(3);
  expect(schema.$comment).toMatch(/Cross-record projectId/);
 });
});
