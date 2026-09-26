import type { PromptProjection } from "@blueprint-os/contracts";

export interface PromptProjectionHistoryRepository {
  record(projection: PromptProjection): Promise<PromptProjection>;
  listByProject(projectId: string): Promise<readonly PromptProjection[]>;
}
