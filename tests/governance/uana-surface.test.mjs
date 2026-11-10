import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root = new URL("../../",import.meta.url);
const read = path => readFileSync(new URL(path,root),"utf8");
const page = read("apps/web/app/projects/[projectId]/prompt/page.tsx");
const panel = read("apps/web/app/projects/[projectId]/prompt/uana-panel.tsx");
const engine = read("packages/application/src/universal-active-next-action.ts");
const projectInstructions=read("docs/UANA-CHATGPT-PROJECT-INSTRUCTIONS.v1.md");
const actions=read("apps/web/app/projects/[projectId]/prompt/actions.ts");

test("UANA is embedded in existing Prompt Workspace, not a second control plane",()=>{
 assert.match(page,/<UanaPanel/);
 assert.match(page,/workQuality\.listWorkPackages\(workspace\.actor, workspace\.projectId\)/);
 assert.match(page,/workQuality\.listQualityGates\(workspace\.actor, workspace\.projectId\)/);
 assert.match(page,/latest && !latestIsStale/);
 assert.doesNotMatch(page,/fetch\(["']https?:\/\//);
});
test("selector, preview and edit are live controls with explicit Owner action",()=>{
 assert.match(panel,/type="radio"/);
 assert.match(panel,/onChange=\{\(\)=>select\(option\.id\)\}/);
 assert.match(panel,/onClick=\{showPreview\}/);
 assert.match(panel,/renderUanaDraft\(proposal,selected\)/);
 assert.match(panel,/textarea id="uana-draft"/);
 assert.match(panel,/setDraft\(e\.target\.value\)/);
 assert.match(panel,/navigator\.clipboard\.writeText\(draft\)/);
});
test("the Hub does not lie about sending a ChatGPT turn",()=>{
 assert.match(panel,/không tự gửi tin nhắn từ website Blueprint Hub/);
 assert.match(panel,/Sao chép để gửi/);
 assert.match(panel,/Mở ChatGPT/);
 assert.doesNotMatch(panel,/fetch\(|sendMessage\(|postMessage\(|ChatGPT\.send/);
});
test("module has explicit source and authority gates rather than inferred PASS",()=>{
 assert.match(engine,/source\.sourceRevision === source\.projectionRevision/);
 assert.match(engine,/cross-project Work Package blocked/);
 assert.match(engine,/cross-project Quality Gate blocked/);
 assert.match(engine,/qualityGatePassed:false,productionAuthorized:false,derivedNotCanonical:true/);
 assert.match(engine,/if \(!active\) return null/);
});
test("portable Project Instructions are scoped and opt-in, not auto-installed",()=>{
 assert.match(projectInstructions,/không lấy việc của dự án khác/);
 assert.match(projectInstructions,/ChatGPT Project/);
 assert.match(projectInstructions,/Không tự merge/);
 assert.match(projectInstructions,/Per-project Owners must apply it explicitly/);
});

test("R1 UANA rechecks authenticated current canonical revision before user copy",()=>{
 assert.match(actions,/verifyUanaSourceForCopyAction/);
 assert.match(actions,/loadProjectWorkspace\(projectId\)/);
 assert.match(actions,/workspace\.state !== "ready"/);
 assert.match(actions,/currentSourceRevisionFromProfile/);
 assert.match(actions,/page\.latest\?\.id !== expectedProjectionId/);
 assert.match(actions,/page\.latest\.sourceRevision !== actual/);
 assert.match(panel,/await verifyUanaSourceForCopyAction/);
 assert.match(panel,/if\(!check\.ok\)/);
});
test("R1 UANA client imports ONLY the pure module, never the server-heavy barrel",()=>{
 assert.match(panel,/packages\/application\/src\/universal-active-next-action/);
 assert.doesNotMatch(panel,/from "@blueprint-os\/application"/);
 assert.match(page,/requiredGateIds: workspace\.project\.blueprint\.requiredGates/);
 assert.match(page,/key=\{workspace\.projectId \+ ":" \+ currentSourceRevision/);
 assert.match(page,/qualityGateIds:w\.qualityGateIds/);
 assert.match(engine,/unknownRequired/);
 assert.match(engine,/hasCompleteUanaGateEvidence/);
 assert.match(page,/evidenceComplete: hasCompleteUanaGateEvidence/);
 assert.match(engine,/unfinishedDependency/);
});
