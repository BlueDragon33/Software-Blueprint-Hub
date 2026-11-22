/**
 * C28 internal only: bridge an *existing* Hub PROJECT_READ-gated graph loader
 * to the C27 non-exportable Graph read-wire candidate.
 *
 * No API route, no token, no public endpoint, no new role. The trusted loader
 * must be Hub's loadGraphIntelligence(), which uses loadProjectWorkspace() and
 * the authenticated actor. This helper does NOT verify external app identity.
 * Do NOT invoke this from public handlers until identity, project audience,
 * threat review, negative auth QA and human approval are independently passed.
 */
import { prepareGraphReadWireCandidate } from "../../../../packages/application/src/graph-read-wire.candidate.mjs";

const MAX_ENCODED_ID = 512;
const MAX_PROJECT_ID = 256;

function denied() {
  return Object.freeze({
    ok: false, status: "UNVERIFIED", code: "PROJECT_GRAPH_READ_NOT_ADMITTED",
    transportEnabled: false, canReadGraphExternally: false,
    canonicalMutationAllowed: false, gateMutationAllowed: false,
    releaseAuthority: false, agentDispatchAllowed: false,
  });
}
function decodeCanonicalProjectId(encodedProjectId) {
  if (typeof encodedProjectId !== "string" || !encodedProjectId
    || encodedProjectId.length > MAX_ENCODED_ID) return null;
  let projectId;
  try { projectId = decodeURIComponent(encodedProjectId); }
  catch { return null; }
  if (!projectId || projectId.length > MAX_PROJECT_ID
    || /[<>\u0000-\u001f\u007f]/.test(projectId)
    || encodeURIComponent(projectId) !== encodedProjectId) return null;
  return projectId;
}

/**
 * loadTrustedGraph is injected solely for testing and internal composition.
 * Production callers MUST supply the real Hub server loadGraphIntelligence,
 * not an untrusted browser-provided function or externally supplied graph.
 */
export async function inspectInternalProjectGraphCandidate(encodedProjectId, loadTrustedGraph) {
  const projectId = decodeCanonicalProjectId(encodedProjectId);
  if (!projectId || typeof loadTrustedGraph !== "function") return denied();
  let loaded;
  try { loaded = await loadTrustedGraph(encodedProjectId); }
  catch { return denied(); }
  // Collapse signed-out, not-found, forbidden and unavailable to ONE safe denial.
  // A project id is never made visible as a side channel from this candidate.
  if (!loaded || loaded.state !== "ready"
    || loaded.profile?.projectId !== projectId
    || loaded.graph?.projectId !== projectId) return denied();
  // Pure C27 mapper remains bounded and never grants external Graph access.
  const result = prepareGraphReadWireCandidate(loaded.graph, projectId);
  if (!result.ok || result.transportEnabled !== false
    || result.canReadGraphExternally !== false
    || result.canonicalMutationAllowed !== false
    || result.gateMutationAllowed !== false
    || result.releaseAuthority !== false
    || result.agentDispatchAllowed !== false) return denied();
  return result;
}
