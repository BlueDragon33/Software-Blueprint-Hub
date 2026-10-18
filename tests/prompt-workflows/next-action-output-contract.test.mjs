import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {composeManagedNextAction,validateManagedNextAction,NEXT_ACTION_LABEL}
  from "../../packages/application/src/next-action-output-contract.mjs";
import {renderNodePromptCandidate} from "../../scripts/prompt-workflow-lib.mjs";
const workflow=JSON.parse(readFileSync(new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json",import.meta.url),"utf8"));
const context={projectId:"project:application-management",repository:"BlueDragon33/Application-Management",
  appHead:"a".repeat(40),canonicalDigest:"sha256:"+"b".repeat(64),policyVersion:"1.3.0"};
const base={repository:"BlueDragon33/Application-Management",
  sourceSha:"a".repeat(40),state:"D1 BLOCKED_NOT_TESTED",
  query:"NEXT ACTION — Continue Application-Management PR #360 read-only review at the exact source SHA, no merge or publish."};
test("one real managed Next Action descriptor has an enabled interactive button plus fallback",()=>{
 const handoff=composeManagedNextAction(base);
 const report=validateManagedNextAction(handoff);
 assert.equal(handoff.actions.length,1);
 assert.equal(handoff.actions[0].label,NEXT_ACTION_LABEL);
 assert.deepEqual(handoff.actions[0].button,{component:"button",enabled:true,actionId:"blueprint-next-action"});
 assert.equal(handoff.fallbackPrompt,handoff.actions[0].query);
 assert.equal(report.controlRendered,"UNVERIFIED");
 assert.equal(report.releaseAuthorized,false);
});
test("text-only surface still has a complete exact continuation prompt, no fake button",()=>{
 const output=composeManagedNextAction({...base,interactiveSupported:false});
 assert.equal(output.mode,"text-fallback");
 assert.equal(output.actions[0].button,null);
 assert.equal(output.fallbackPrompt,base.query);
 assert.equal(validateManagedNextAction(output).valid,true);
});
test("unverified HEAD uses a source-recovery next action, never a fake SHA",()=>{
 const output=composeManagedNextAction({...base,sourceSha:null,state:"HEAD_UNVERIFIED",
   kind:"copy-next-turn"});
 assert.equal(output.sourceSha,null);
 assert.equal(output.actions[0].kind,"copy-next-turn");
 assert.equal(validateManagedNextAction(output).valid,true);
 assert.throws(()=>composeManagedNextAction({...base,sourceSha:null,state:"READY"}),
   /NEXT_ACTION_HANDOFF_BLOCKED/);
});
test("omitted, fake, duplicate, inert or mismatched Next Action fails closed",()=>{
 const output=composeManagedNextAction(base);
 const bad=[
   {...output,actions:[]},
   {...output,actions:[output.actions[0],output.actions[0]]},
   {...output,actions:[{...output.actions[0],button:null}]},
   {...output,actions:[{...output.actions[0],button:{...output.actions[0].button,enabled:false}}]},
   {...output,actions:[{...output.actions[0],query:"do not use"}]},
   {...output,fallbackPrompt:"Use another unknown task"},
   {...output,authority:{...output.authority,merge:true}},
   {...output,sourceSha:"UNVERIFIED"},
   {...output,buttonsAreRendered:true}
 ];
 for(const x of bad) assert.throws(()=>validateManagedNextAction(x),/NEXT_ACTION_HANDOFF_BLOCKED/);
});
test("central prompt projection and template carry mandatory button+fallback instruction",()=>{
 const projected=renderNodePromptCandidate(workflow,"inventory",context);
 assert.match(projected,/Mandatory Hỗ trợ \/ Next Action/);
 assert.match(projected,/enabled button labeled 'Hỗ trợ \/ Next Action'/);
 assert.match(projected,/copyable text fallback/);
 assert.match(projected,/cannot force ChatGPT host UI/);
 const template=readFileSync(new URL("../../prompt-workflows/templates/engineering-node.v1.md",import.meta.url),"utf8");
 assert.match(template,/Mandatory interactive handoff/);
 assert.match(template,/Hỗ trợ \/ Next Action/);
 assert.match(template,/complete query in copyable fallback text/);
});

test("actual Workflow Studio is wired to the shared copy-only handoff renderer",()=>{
 const studio=readFileSync(new URL("../../apps/web/app/projects/[projectId]/prompt/workflow/workflow-studio.tsx",import.meta.url),"utf8");
 const page=readFileSync(new URL("../../apps/web/app/projects/[projectId]/prompt/workflow/page.tsx",import.meta.url),"utf8");
 const renderer=readFileSync(new URL("../../apps/web/app/_components/blueprint-next-action.tsx",import.meta.url),"utf8");
 assert.match(studio, /<BlueprintNextAction handoff=\{handoff\}/);
 assert.match(studio, /composeManagedNextAction/);
 assert.match(studio, /kind: "copy-next-turn"/);
 assert.match(page, /repository=\{selected\.repository\}/);
 assert.match(renderer, /navigator\.clipboard\?\.writeText\(action\.query\)/);
 assert.match(renderer, /field\.current\?\.select\(\)/);
 assert.match(renderer, /Copyable Next Action fallback/);
 assert.match(renderer, /onClick=\{\(\) => \{ void copyNextAction\(\); \}\}/);
 assert.doesNotMatch(renderer, /GenUI\.issueNewTurn|github\.merge|productionAuthorized: true/);
});
