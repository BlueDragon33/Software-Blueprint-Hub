import type { GraphConsumerLifecycleRecordCandidate } from "./graph-consumer-lifecycle.candidate.mjs";
import type { CandidateSqlResult } from "./graph-consumer-nonce.candidate.mjs";
import type { TrustedHubGraphCandidateLoad } from "./graph-read-admission.candidate.mjs";
import type { GraphCompositionDenied, GraphCompositionInternalOnly } from "./graph-read-composition.candidate.mjs";

/** No URL, no credentials, no consumer identity or release authority is created. */
export function inspectLifecycleBoundHubGraphCandidate(input?: {
  trustedLifecycle?: ReadonlyMap<string, GraphConsumerLifecycleRecordCandidate>;
  compactJws?: string;
  projectId?: string;
  nowSeconds?: number;
  executeNonceSql?: (
    query: string, params: readonly [string, string, string, string, number]
  ) => Promise<CandidateSqlResult>;
  loadTrustedGraph?: (encodedId: string) => Promise<TrustedHubGraphCandidateLoad>;
  projectAudience?: ReadonlySet<string>;
}): Promise<GraphCompositionDenied | GraphCompositionInternalOnly>;
