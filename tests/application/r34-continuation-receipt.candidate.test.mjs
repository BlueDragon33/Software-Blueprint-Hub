import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewR34ContinuationReceipt as gate } from '../../packages/application/src/r34-continuation-receipt.candidate.mjs';
const rev = 'b06d93704b088319e1cc8b26161f0b4dc217858e';
const verified = id => ({id,state:'verified',evidence:{sourceRevision:rev,independentReadback:true,realAcceptance:true}});
const blocked = (id,reason='authenticated-human-authority-gate') => ({
  id,state:'blocked',blockedBy:reason,recoveryAttempts:['attempted the safe nonmutating path']
});
const finishNext = {kind:'close-verified-goal',ownerType:'agent',actionId:'close-verified-r34-goal',
  targetTaskId:'real-acceptance',projectId:'project:blueprint-os',sourceRevision:rev,
  expectedEvidence:'Read back final canonical receipt at the source HEAD',
  selectionReason:'All agreed tasks passed real verification and no safe work remains',requiresHuman:false};
const humanNext = {kind:'human-authorization',ownerType:'human-authority',actionId:'obtain-signed-human-decision',
  targetTaskId:'fix',projectId:'project:blueprint-os',sourceRevision:rev,
  expectedEvidence:'Authenticated exact-revision human constitutional decision',
  selectionReason:'Technical continuation is gated by the actual human authority decision',
  blockedBy:'authenticated-human-authority-gate',requiresHuman:true};
const good={projectId:'project:blueprint-os',projectProfileVersion:3,sourceRevision:rev,
  tasks:[verified('investigate'),verified('fix'),verified('real-acceptance')],
  scopeTaskIds:['investigate','fix','real-acceptance'],outcome:'VERIFIED_COMPLETE',
  stopReason:'requested-goal-verified-complete',
  nextActions:['Close exact-revision verified checkpoint and preserve its evidence'],nextActionProof:finishNext};
const attempt={...good,tasks:[verified('investigate'),blocked('fix')],scopeTaskIds:['investigate','fix'],
  outcome:'PARTIAL_BLOCKED',stopReason:'authenticated-human-authority-gate',
  attemptedRecovery:['Checked exact canonical Owner boundary without a grant'],
  nextActions:['Receive authenticated human ratification decision for the reviewed revision'],
  nextActionProof:humanNext};
const assertState=(x,decision)=>assert.equal(gate(x).decision,decision,JSON.stringify(gate(x)));
const setTasks=(x,tasks)=>({...x,tasks,scopeTaskIds:tasks.map(t=>t.id)});

test('E2E-01 remaining eligible tasks must continue', () =>
  assertState(setTasks(good,[{id:'a',state:'eligible'},{id:'b',state:'eligible'},{id:'c',state:'eligible'}]),'CONTINUE'));
test('E2E-02 independent eligible task continues after blocker', () =>
  assertState(setTasks(attempt,[blocked('fix'),{id:'safe',state:'eligible'}]),'CONTINUE'));
test('E2E-03 complete only returns receipt shape, not QA authority', () =>
  assertState(good,'RECEIPT_SHAPE_COMPLETE'));
test('E2E-04 synthetic evidence cannot claim complete', () =>
  assertState({...good,tasks:[{id:'a',state:'verified',evidence:{sourceRevision:rev,independentReadback:false,realAcceptance:false}}]},'REJECT'));
test('E2E-05 stale task evidence rejected', () =>
  assertState({...good,tasks:[{id:'a',state:'verified',evidence:{sourceRevision:'a'.repeat(40),independentReadback:true,realAcceptance:true}}]},'REJECT'));
test('E2E-06 unverified source rejected', () =>
  assertState({...good,sourceRevision:'UNVERIFIED'},'REJECT'));
test('E2E-07 missing profile version rejected', () =>
  assertState({...good,projectProfileVersion:'UNVERIFIED'},'REJECT'));
test('E2E-08 preflight-only empty tasks rejected', () =>
  assertState({...good,tasks:[]},'REJECT'));
test('E2E-09 two next actions rejected', () =>
  assertState({...good,nextActions:['A','B']},'REJECT'));
test('E2E-10 zero next action rejected', () =>
  assertState({...good,nextActions:[]},'REJECT'));
test('E2E-11 repeated known question rejected', () =>
  assertState({...good,reaskedKnownQuestion:true},'REJECT'));
test('E2E-12 unauthorized Work launch rejected', () =>
  assertState({...good,autoLaunchWork:true},'REJECT'));
test('E2E-13 truthful human blocker allowed as partial shape', () =>
  assertState(attempt,'RECEIPT_SHAPE_BLOCKED'));
test('E2E-14 missing recovery attempts rejected', () =>
  assertState({...attempt,attemptedRecovery:[]},'REJECT'));
test('E2E-15 partial with no blocker rejected', () =>
  assertState({...attempt,tasks:[verified('a')]},'REJECT'));
test('E2E-16 missing tool returns capability-limit shape', () =>
  assertState({...attempt,tasks:[verified('investigate'),blocked('fix','missing-enabled-tool-capability')],stopReason:'missing-enabled-tool-capability',outcome:'PARTIAL_CAPABILITY_LIMIT',nextActionProof:{...humanNext,kind:'resolve-unavailable-capability',ownerType:'external-host',requiresHuman:false,blockedBy:'missing-enabled-tool-capability'}},'RECEIPT_SHAPE_CAPABILITY_LIMIT'));
test('E2E-17 misclassified capability blocker rejected', () =>
  assertState({...attempt,stopReason:'missing-enabled-tool-capability',outcome:'PARTIAL_BLOCKED'},'REJECT'));
test('E2E-18 complete with blocked task rejected', () =>
  assertState({...good,tasks:[verified('a'),{id:'b',state:'blocked'}]},'REJECT'));
test('E2E-19 noncanonical project ID rejected', () =>
  assertState({...good,projectId:'../admin'},'REJECT'));
test('E2E-20 receipt shape never claims QA pass or execution authority', () =>
  assert.equal(gate(good).mayClaimQaPass,false));
