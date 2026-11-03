import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateAgentHandoff } from '../../scripts/check-agent-handoff.mjs';

const base = JSON.parse(readFileSync(new URL('../../docs/agent-collaboration/handshake.v1.json', import.meta.url), 'utf8'));
const change = patch => ({ ...structuredClone(base), ...patch });
test('candidate handshake is source-only valid, not authenticated', () => {
  assert.deepEqual(validateAgentHandoff(base), []);
  assert.equal(base.claims.connected, false);
});
test('blocks false approval or production claims', () => {
  assert.ok(validateAgentHandoff(change({ reviewStatus:'PASS', productionStatus:'AUTHORIZED' })).length >= 2);
});
test('blocks tampered SHA and changed constitution', () => {
  assert.ok(validateAgentHandoff(change({ baseSha:'main', policyVersion:'1.4.0' })).length >= 2);
});
test('blocks dangerous or expanded scope', () => {
  assert.ok(validateAgentHandoff(change({ allowedPaths:['../../secrets'] })).length > 0);
});
test('blocks missing forbidden authority operations', () => {
  assert.ok(validateAgentHandoff(change({ forbiddenActions:['deploy'] })).length > 0);
});
test('blocks fabricated handshake verification', () => {
  assert.ok(validateAgentHandoff(change({ claims:{connected:true,claudeReadVerified:true,automated:true} })).length > 0);
});
test('blocks payload acting as issuer evidence', () => {
  assert.ok(validateAgentHandoff(change({ evidence:['fake receipt'] })).length > 0);
});
