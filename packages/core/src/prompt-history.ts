import type { PromptProjection } from "@blueprint-os/contracts";

export interface PromptProjectionHistoryQuery {
  readonly limit?: number;
  readonly offset?: number;
}

export interface PromptProjectionHistoryRepository {
  record(projection: PromptProjection): Promise<PromptProjection>;
  listByProject(
    projectId: string,
    query?: PromptProjectionHistoryQuery
  ): Promise<readonly PromptProjection[]>;
}
