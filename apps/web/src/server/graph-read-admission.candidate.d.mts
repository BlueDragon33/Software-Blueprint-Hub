import type { GraphReadWireDenied, GraphReadWireShapeValid } from "../../../../packages/application/src/graph-read-wire.candidate.mjs";
export type TrustedHubGraphCandidateLoad = Readonly<{
  state: string;
  profile?: Readonly<{ projectId: string }>;
  graph?: unknown;
}>;
/**
 * This pure internal adapter is NOT an identity verifier or HTTP endpoint.
 * Trust ONLY the existing authenticated Hub loadGraphIntelligence as loader.
 */
export function inspectInternalProjectGraphCandidate(
  encodedProjectId: string,
  loadTrustedGraph: (encodedProjectId: string) => Promise<TrustedHubGraphCandidateLoad>
): Promise<GraphReadWireDenied | GraphReadWireShapeValid>;
