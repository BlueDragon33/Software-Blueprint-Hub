/**
 * C28 internal-only integration seam: use the existing actual Hub session-,
 * actor- and project-scoped Graph loader. This is deliberately NOT an API
 * route, and cannot establish external Application Management identity.
 */
import { loadGraphIntelligence } from "./graph-intelligence";
import { inspectInternalProjectGraphCandidate } from "./graph-read-admission.candidate.mjs";

/** For internal authorized evaluation only. NEVER expose via HTTP as-is. */
export async function inspectAuthenticatedHubGraphHandoffCandidate(encodedProjectId: string) {
  return inspectInternalProjectGraphCandidate(encodedProjectId, loadGraphIntelligence);
}
