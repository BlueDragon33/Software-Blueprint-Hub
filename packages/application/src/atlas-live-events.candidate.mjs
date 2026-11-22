/** Blueprint OS candidate: read-only adapter for Codex JSONL events.
 * The trusted collector (not this module or browser) owns run/project/revision/sequence.
 * Never ingests raw commands, stdout, reasoning, prompts, secrets or credentials.
 * A completed Codex turn is NOT a passed QA gate or a completed work package.
 */
export const ATLAS_LIVE_EVENTS_VERSION = 'atlas-live:0.1.0';
const sha = /^[a-f0-9]{40}$/;
const key = /^[a-zA-Z0-9][a-zA-Z0-9:._/-]{0,159}$/;
const types = new Set(['thread.started','turn.started','turn.completed','turn.failed','item.started','item.updated','item.completed','error']);
const kinds = new Set(['command_execution','file_change','agent_message','mcp_tool_call','web_search','reasoning','tool_call','unknown']);
function assert(ok, message) { if (!ok) throw new TypeError('LIVE_EVENT_BLOCKED: ' + message); }

/** The envelope fields must be assigned by an authenticated server-side collector. */
export function normalizeCodexEvent(raw, envelope) {
  assert(envelope && key.test(envelope.runId ?? '') && /^project:[a-z0-9-]+$/.test(envelope.projectId ?? ''), 'identity');
  assert(sha.test(envelope.sourceRevision ?? ''), 'exact source revision');
  assert(Number.isSafeInteger(envelope.sequence) && envelope.sequence >= 1, 'sequence');
  assert(typeof envelope.observedAt === 'string' && Number.isFinite(Date.parse(envelope.observedAt)), 'observation time');
  assert(raw && typeof raw === 'object' && !Array.isArray(raw) && types.has(raw.type), 'event type');
  const item = raw.item && typeof raw.item === 'object' && !Array.isArray(raw.item) ? raw.item : null;
  const itemKind = item && kinds.has(item.type) ? item.type : 'unknown';
  const itemId = item && typeof item.id === 'string' && key.test(item.id) ? item.id : null;
  return Object.freeze({ schemaVersion: ATLAS_LIVE_EVENTS_VERSION, runId: envelope.runId,
    projectId: envelope.projectId, sourceRevision: envelope.sourceRevision,
    sequence: envelope.sequence, observedAt: new Date(envelope.observedAt).toISOString(),
    type: raw.type, itemKind, itemId, verification: 'observed',
    /** No raw event fields, token usage, paths, prompts or test verdicts are forwarded. */
  });
}

/** Deterministic live timeline; gap or scope mismatch cannot become an authoritative PASS. */
export function projectLiveTimeline(events, { runId, projectId, sourceRevision }) {
  assert(Array.isArray(events) && events.length <= 1000, 'bounded event list');
  assert(key.test(runId ?? '') && /^project:[a-z0-9-]+$/.test(projectId ?? '') && sha.test(sourceRevision ?? ''), 'projection context');
  const unique = new Map(); let duplicates = 0;
  for (const event of events) {
    assert(event && event.schemaVersion === ATLAS_LIVE_EVENTS_VERSION &&
      event.runId === runId && event.projectId === projectId && event.sourceRevision === sourceRevision, 'scope or revision mismatch');
    assert(Number.isSafeInteger(event.sequence) && event.sequence >= 1 && types.has(event.type), 'sequence or type');
    if (unique.has(event.sequence)) {
      const previous = unique.get(event.sequence);
      assert(previous.type === event.type && previous.itemKind === event.itemKind && previous.itemId === event.itemId,
        'conflicting sequence');
      duplicates++; continue;
    }
    unique.set(event.sequence, event);
  }
  const ordered = [...unique.values()].sort((a, b) => a.sequence - b.sequence);
  let expected = 1; const gaps = [];
  for (const event of ordered) {
    if (event.sequence !== expected) gaps.push({ expected, received: event.sequence });
    expected = event.sequence + 1;
  }
  const last = ordered.at(-1) ?? null;
  const execution = gaps.length ? 'telemetry-incomplete' :
    last?.type === 'turn.completed' ? 'turn-finished-observed' :
    last?.type === 'turn.failed' || last?.type === 'error' ? 'failure-observed' :
    last ? 'activity-observed' : 'no-events';
  return Object.freeze({ schemaVersion: ATLAS_LIVE_EVENTS_VERSION, projectId, sourceRevision, runId,
    execution, verification: 'unverified', duplicates, gaps: Object.freeze(gaps),
    events: Object.freeze(ordered), lastSequence: last?.sequence ?? 0, mayExecute: false,
    gatePass: false, productionReady: false });
}
