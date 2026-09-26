import type { PromptProjection } from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import type {
  PromptProjectionHistoryQuery,
  PromptProjectionHistoryRepository
} from "@blueprint-os/core";

import type { BlueprintPrismaClient } from "./client";
import { Prisma } from "./generated/prisma/client";

function assertProjection(value: unknown): asserts value is PromptProjection {
  const result = validateContract("PromptProjection", value);
  if (!result.valid) {
    const details = result.errors
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new TypeError(`Invalid PromptProjection: ${details}`);
  }
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function snapshotKey(projection: PromptProjection): string {
  return `${projection.projectId}|${projection.id}|${projection.generatedAt}`;
}

export class PostgresPromptProjectionHistoryRepository
  implements PromptProjectionHistoryRepository
{
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  async record(projection: PromptProjection): Promise<PromptProjection> {
    assertProjection(projection);

    await this.prisma.promptProjectionSnapshot.create({
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

    const rows = await this.prisma.promptProjectionSnapshot.findMany({
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
