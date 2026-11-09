import {readFileSync} from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createUanaProposal, renderUanaDraft, UANA_VERSION,
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
      status:"completed",dependencies:[]},
    {projectId:"project:boi-ech-ai",id:"BOI-L2",title:"Owner approval and duration",
      status:"in-progress",dependencies:["BOI-L1"]},
  ],
  gates:[{projectId:"project:boi-ech-ai",id:"G4",name:"Real Cloudflare Preview",
    status:"candidate"}]
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
 it("blocking gates never offer a fictitious unrestricted expansion",()=>{
  const proposal=createUanaProposal(make({
    workPackages:[{projectId:source.projectId,id:"BLOCK-1",title:"Missing Preview authorization",
      status:"blocked",dependencies:[]}]
  }))!;
  expect(proposal.options.map(o=>o.id)).toEqual(["inspect","continue"]);
  expect(proposal.options[1].isReviewOnly).toBe(true);
  expect(proposal.options[1].title).toMatch(/Gỡ chặn/);
 });
 it("allows a bounded third advisory option only when the source has no active gate issues",()=>{
  const proposal=createUanaProposal(make({
    gates:[{projectId:source.projectId,id:"G4",name:"Preview",status:"pass"}]
  }))!;
  expect(proposal.options).toHaveLength(3);
  expect(proposal.options[2]).toMatchObject({id:"extend",recommended:false,isReviewOnly:true});
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
