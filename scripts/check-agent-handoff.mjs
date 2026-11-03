/**
 * Source-only validator, not an agent runner, issuer, approval or release gate.
 * node scripts/check-agent-handoff.mjs docs/agent-collaboration/handshake.v1.json
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FORBIDDEN = ['approve', 'merge', 'deploy', 'production', 'ratify',
  'github-hosted-actions', 'neon-mutation', 'credential-sharing'];
const SHA = /^[a-f0-9]{40}$/;
const TEXT = x => typeof x === 'string' && x.trim() !== '';
const agents = new Set(['chatgpt', 'claude']);
const states = new Set(['HANDOFF_PENDING', 'RECEIVED_UNVERIFIED', 'BLOCKED']);

export function validateAgentHandoff(doc) {
  const errors = [];
  const fail = (condition, message) => { if (!condition) errors.push(message); };
  fail(doc !== null && typeof doc === 'object' && !Array.isArray(doc), 'must be a JSON object');
  if (errors.length) return errors;
  fail(doc.schemaVersion === '1.0.0', 'schemaVersion must be 1.0.0');
  fail(doc.kind === 'candidate-dual-agent-handoff', 'kind must be candidate-dual-agent-handoff');
  fail(/^bridge-[a-z0-9-]{8,80}$/.test(doc.taskId ?? ''), 'invalid taskId');
  fail(doc.policyId === 'blueprint-os:universal-century-grade', 'policyId mismatch');
  fail(doc.policyVersion === '1.3.0', 'policyVersion mismatch');
  fail(doc.repository === 'BlueDragon33/Software-Blueprint-Hub', 'pilot repository mismatch');
  fail(SHA.test(doc.baseSha ?? ''), 'baseSha must be exact 40-character commit');
  fail(TEXT(doc.handoffBranch) && doc.handoffBranch.startsWith('experiment/dual-ai-github-bridge-') && doc.handoffBranch !== 'main', 'invalid pilot branch');
  fail(agents.has(doc.from) && agents.has(doc.to) && doc.from !== doc.to, 'agent pair must be distinct and known');
  fail(states.has(doc.state), 'handoff state is invalid');
  fail(doc.mode === 'READ_ONLY_HANDSHAKE', 'pilot must be read-only');
  fail(doc.authorization === 'NONE', 'authorization must be NONE');
  fail(doc.reviewStatus === 'REVIEW_BLOCKED', 'review must remain blocked');
  fail(doc.ciStatus === 'NOT_RUN', 'CI must be NOT_RUN');
  fail(doc.productionStatus === 'NOT_AUTHORIZED', 'Production must remain NOT_AUTHORIZED');
  fail(/^BLUEPRINT-BRIDGE-[A-Z0-9-]{8,80}$/.test(doc.challenge ?? ''), 'invalid challenge');
  fail(TEXT(doc.request) && doc.request.length <= 700, 'request must be nonempty and bounded');
  fail(Array.isArray(doc.allowedPaths) && doc.allowedPaths.length > 0 && doc.allowedPaths.length <= 5, 'allowedPaths missing or too broad');
  if (Array.isArray(doc.allowedPaths)) {
    for (const p of doc.allowedPaths) {
      fail(TEXT(p) && p.startsWith('docs/agent-collaboration/') && !p.includes('..') && !p.includes('\\') && !p.includes('*'), 'path escapes pilot scope');
    }
  }
  fail(Array.isArray(doc.forbiddenActions) && FORBIDDEN.every(a => doc.forbiddenActions.includes(a)) && doc.forbiddenActions.length === FORBIDDEN.length, 'mandatory forbidden actions missing');
  fail(Array.isArray(doc.evidence) && doc.evidence.length === 0, 'pilot cannot claim verified evidence');
  fail(doc.claims?.connected === false && doc.claims?.claudeReadVerified === false && doc.claims?.automated === false, 'pilot cannot claim verified connection');
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourcePath = process.argv[2];
  if (!sourcePath) {
    console.error('Usage: node scripts/check-agent-handoff.mjs <handoff.json>');
    process.exitCode = 2;
  } else {
    try {
      const record = JSON.parse(readFileSync(resolve(sourcePath), 'utf8'));
      const errors = validateAgentHandoff(record);
      if (errors.length) {
        console.error('HANDOFF BLOCKED:\n' + errors.map(x => '- ' + x).join('\n'));
        process.exitCode = 1;
      } else {
        console.log('CONTRACT VALID (source-only). CONNECTION UNVERIFIED. REVIEW_BLOCKED. CI NOT_RUN.');
      }
    } catch (error) {
      console.error('HANDOFF BLOCKED: ' + error.message);
      process.exitCode = 1;
    }
  }
}
