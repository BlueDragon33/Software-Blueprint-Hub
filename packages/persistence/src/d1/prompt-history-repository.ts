// Candidate adapter derived from 9733f3dbcde4312e46dcc9b9ccb0d7791c522298; not yet runtime-admitted.
import type { PromptProjection } from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import type {
  PromptProjectionHistoryQuery,
  PromptProjectionHistoryRepository
} from "@blueprint-os/core";

import { D1DomainStore } from "../../../../experiments/d1-publication/d1-domain-store";

function assertProjection(value: unknown): asserts value is PromptProjection {
  const result = validateContract("PromptProjection", value);
  if (!result.valid) {
    const details = result.errors
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new TypeError(`Invalid PromptProjection: ${details}`);
  }
}

function asJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

function snapshotKey(projection: PromptProjection): string {
  return `${projection.projectId}|${projection.id}|${projection.generatedAt}`;
}

export class D1PromptProjectionHistoryRepository
  implements PromptProjectionHistoryRepository
{
  constructor(private readonly store: D1DomainStore) {}

  async record(projection: PromptProjection): Promise<PromptProjection> {
    assertProjection(projection);

    await this.store.create("PromptProjectionSnapshot", {
      data: {
        snapshotKey: snapshotKey(projection),
        projectId: projection.projectId,
        projectionId: projection.id,
        sourceRevision: projection.sourceRevision,
        templateVersion: projection.templateVersion,
        contentHash: projection.contentHash,
        generatedAt: new Date(projection.generatedAt),
        document: asJson(projection)
      }
    });

    return projection;
  }

  async listByProject(
    projectId: string,
    query: PromptProjectionHistoryQuery = {}
  ): Promise<readonly PromptProjection[]> {
    const limit = query.limit;
    const offset = query.offset ?? 0;

    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 101)) {
      throw new TypeError("Prompt history limit must be an integer from 1 to 101");
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new TypeError("Prompt history offset must be a non-negative integer");
    }

    const rows = await this.store.findMany("PromptProjectionSnapshot", {
      where: { projectId },
      orderBy: [{ generatedAt: "desc" }, { snapshotKey: "desc" }],
      ...(limit === undefined ? {} : { take: limit }),
      ...(offset === 0 ? {} : { skip: offset })
    });

    return rows.map((row) => {
      assertProjection(row.document);
      return row.document;
    });
  }
}
