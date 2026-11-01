import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewR34ContinuationReceipt as gate } from '../../packages/application/src/r34-continuation-receipt.candidate.mjs';
import { reviewR34NextAction as nextGate } from '../../packages/application/src/r34-next-action-gate.candidate.mjs';
const rev='b06d93704b088319e1cc8b26161f0b4dc217858e';
const verified=id=>({id,state:'verified',evidence:{sourceRevision:rev,independentReadback:true,realAcceptance:true}});
const blocked=(id,reason='authenticated-human-authority-gate')=>({id,state:'blocked',blockedBy:reason,recoveryAttempts:['attempted safe nonmutating path']});
const finishNext={kind:'close-verified-goal',ownerType:'agent',actionId:'close-verified-r34-goal',targetTaskId:'real-acceptance',
  projectId:'project:blueprint-os',sourceRevision:rev,expectedEvidence:'Read back final canonical receipt at exact source HEAD',
  selectionReason:'All agreed tasks passed real verification and no safe work remains',requiresHuman:false};
const humanNext={kind:'human-authorization',ownerType:'human-authority',actionId:'obtain-signed-human-decision',targetTaskId:'fix',
  projectId:'project:blueprint-os',sourceRevision:rev,expectedEvidence:'Authenticated exact-revision human constitutional decision',
  selectionReason:'Technical continuation is gated by an actual human authority decision',blockedBy:'authenticated-human-authority-gate',requiresHuman:true};
const good={projectId:'project:blueprint-os',projectProfileVersion:3,sourceRevision:rev,
  tasks:[verified('investigate'),verified('fix'),verified('real-acceptance')],scopeTaskIds:['investigate','fix','real-acceptance'],
  outcome:'VERIFIED_COMPLETE',stopReason:'requested-goal-verified-complete',
  nextActions:['Close exact-revision verified checkpoint and preserve its evidence'],nextActionProof:finishNext};
const attempt={...good,tasks:[verified('investigate'),blocked('fix')],scopeTaskIds:['investigate','fix'],
  outcome:'PARTIAL_BLOCKED',stopReason:'authenticated-human-authority-gate',
  attemptedRecovery:['Checked safe owner boundary without grant'],
  nextActions:['Receive authenticated human ratification decision for the reviewed revision'],nextActionProof:humanNext};
const check=(x,decision)=>assert.equal(gate(x).decision,decision,JSON.stringify(gate(x)));
const code=(x,reason)=>assert.equal(gate(x).reason,reason,JSON.stringify(gate(x)));
const setTasks=(x,tasks)=>({...x,tasks,scopeTaskIds:tasks.map(t=>t.id)});

test('NEXT-01 generic continue cannot end work',()=>code({...good,nextActions:['Tiếp tục nhiệm vụ']},'generic-or-ambiguous-next-action'));
test('NEXT-02 NEXT ACTION is not a real next action',()=>code({...good,nextActions:['NEXT ACTION']},'generic-or-ambiguous-next-action'));
test('NEXT-03 vague short action rejected',()=>code({...good,nextActions:['Xem lại']},'generic-or-ambiguous-next-action'));
test('NEXT-04 no structured proof rejected',()=>code({...good,nextActionProof:undefined},'missing-next-action-proof'));
test('NEXT-05 cross-project target rejected',()=>code({...good,nextActionProof:{...finishNext,projectId:'project:other'}},'next-action-canonical-binding-mismatch'));
test('NEXT-06 stale SHA rejected',()=>code({...good,nextActionProof:{...finishNext,sourceRevision:'f'.repeat(40)}},'next-action-canonical-binding-mismatch'));
test('NEXT-07 task outside approved scope rejected',()=>code({...good,nextActionProof:{...finishNext,targetTaskId:'outside-scope'}},'next-action-task-not-in-scope'));
test('NEXT-08 self-restarting identical action without new evidence rejected',()=>code({...good,nextActionProof:{...finishNext,previousActionId:finishNext.actionId}},'unchanged-next-action-loop'));
test('NEXT-09 same action with disclosed evidence delta remains a shape only',()=>check({...good,nextActionProof:{...finishNext,previousActionId:finishNext.actionId,newEvidenceIds:['canonical-readback-e2']}},'RECEIPT_SHAPE_COMPLETE'));
test('NEXT-10 partial cannot declare goal closed',()=>code({...attempt,nextActionProof:{...humanNext,kind:'close-verified-goal'}},'partial-next-action-not-bound-to-blocker'));
test('NEXT-11 human-gated decision cannot assign itself to agent',()=>code({...attempt,nextActionProof:{...humanNext,ownerType:'agent'}},'human-gate-next-action-mismatch'));
test('NEXT-12 human-gated decision requires explicit human action',()=>code({...attempt,nextActionProof:{...humanNext,requiresHuman:false}},'human-gate-next-action-mismatch'));
test('NEXT-13 partial action must match exact stop gate',()=>code({...attempt,nextActionProof:{...humanNext,blockedBy:'budget-or-cost-limit'}},'partial-next-action-not-bound-to-blocker'));
test('NEXT-14 cannot truncate agreed task scope',()=>code({...good,scopeTaskIds:['investigate','fix']},'incomplete-approved-scope'));
test('NEXT-15 scope cannot duplicate a task',()=>code({...good,scopeTaskIds:['investigate','investigate','fix','real-acceptance']},'missing-or-duplicated-approved-scope'));
test('NEXT-16 blocked task needs cause and recovery attempts',()=>code({...attempt,tasks:[verified('investigate'),{id:'fix',state:'blocked'}]},'unsupported-task-blocker'));
test('NEXT-17 empty evidence target rejected',()=>code({...good,nextActionProof:{...finishNext,expectedEvidence:''}},'non-actionable-next-action'));
test('NEXT-18 cannot publish on receipt',()=>check({...good,autoPublish:true},'REJECT'));
test('NEXT-19 verified complete cannot delegate closure to human',()=>code({...good,nextActionProof:{...finishNext,ownerType:'human-authority',requiresHuman:true}},'completion-must-close-goal-not-delegate'));
test('NEXT-20 partial must have matching blocked task',()=>code({...attempt,tasks:[verified('investigate'),blocked('fix','budget-or-cost-limit')]},'partial-without-matching-blocker'));
test('NEXT-21 must continue remaining eligible task even after blocker',()=>check(setTasks(attempt,[blocked('fix'),{id:'try-safe-fix',state:'eligible'}]),'CONTINUE'));
test('NEXT-22 tool-blocked outcome requires capability next step, not human-approval label',()=>{const p={...attempt,tasks:[verified('investigate'),blocked('fix','missing-enabled-tool-capability')],stopReason:'missing-enabled-tool-capability',outcome:'PARTIAL_CAPABILITY_LIMIT',nextActionProof:{...humanNext,blockedBy:'missing-enabled-tool-capability'}};code(p,'capability-next-action-mismatch');});
test('NEXT-23 receipt shape has no QA/execute grant',()=>{assert.equal(nextGate(good).state,'SHAPE_VALID');assert.equal(gate(good).mayExerciseAuthority,false);});
