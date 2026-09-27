import { randomUUID } from "node:crypto";

import {
  type HumanProfessionalReviewDecisionKind,
  type HumanProfessionalReviewDecisionRecord,
  type HumanProfessionalReviewDecisionRepository
} from "@blueprint-os/core";

import type { BlueprintPrismaClient } from "./client";
import { Prisma } from "./generated/prisma/client";

const decisions = new Set<HumanProfessionalReviewDecisionKind>([
  "approve",
  "request-changes",
  "reject"
]);

function asStringArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new TypeError(`${label} must be a string array`);
  }
  return Object.freeze([...value]);
}

function asRecord(row: {
  projectId: string;
  reviewerActorId: string;
  source: string;
  decision: string;
  decidedAt: Date;
  note: string;
  candidateReviewedRevision: string;
  candidateEvidenceDigest: string;
  acknowledgedFindingIds: unknown;
  humanSignoff: boolean;
  p9020TransitionAllowed: boolean;
  productionReleaseAuthority: boolean;
  blockers: unknown;
}): HumanProfessionalReviewDecisionRecord {
  if (row.source !== "authenticated-user-action") {
    throw new TypeError("Stored professional review decision has an invalid source");
  }
  if (!decisions.has(row.decision as HumanProfessionalReviewDecisionKind)) {
    throw new TypeError("Stored professional review decision has an invalid decision");
  }
  if (row.productionReleaseAuthority) {
    throw new TypeError(
      "Stored professional review decision must never grant Production authority"
    );
  }

  return Object.freeze({
    projectId: row.projectId,
    reviewerActorId: row.reviewerActorId,
    source: "authenticated-user-action",
    decision: row.decision as HumanProfessionalReviewDecisionKind,
    decidedAt: row.decidedAt.toISOString(),
    note: row.note,
    candidateReviewedRevision: row.candidateReviewedRevision,
    candidateEvidenceDigest: row.candidateEvidenceDigest,
    acknowledgedFindingIds: asStringArray(
      row.acknowledgedFindingIds,
      "acknowledgedFindingIds"
    ),
    humanSignoff: row.humanSignoff,
    p9020TransitionAllowed: row.p9020TransitionAllowed,
    productionReleaseAuthority: false,
    blockers: asStringArray(row.blockers, "blockers")
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export class PostgresHumanProfessionalReviewDecisionRepository
  implements HumanProfessionalReviewDecisionRepository
{
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  async findForCandidate(
    projectId: string,
    candidateReviewedRevision: string,
    candidateEvidenceDigest: string
  ): Promise<HumanProfessionalReviewDecisionRecord | null> {
    const row = await this.prisma.humanProfessionalReviewDecision.findFirst({
      where: {
        projectId,
        candidateReviewedRevision,
        candidateEvidenceDigest
      }
    });
    return row ? asRecord(row) : null;
  }

  async append(decision: HumanProfessionalReviewDecisionRecord): Promise<void> {
    try {
      await this.prisma.humanProfessionalReviewDecision.create({
        data: {
          id: `professional-review-decision:${randomUUID()}`,
          projectId: decision.projectId,
          reviewerActorId: decision.reviewerActorId,
          source: decision.source,
          decision: decision.decision,
          decidedAt: new Date(decision.decidedAt),
          note: decision.note,
          candidateReviewedRevision: decision.candidateReviewedRevision,
          candidateEvidenceDigest: decision.candidateEvidenceDigest,
          acknowledgedFindingIds: [...decision.acknowledgedFindingIds],
          humanSignoff: decision.humanSignoff,
          p9020TransitionAllowed: decision.p9020TransitionAllowed,
          productionReleaseAuthority: false,
          blockers: [...decision.blockers]
        }
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new TypeError(
          "A human professional review decision already exists for this exact candidate."
        );
      }
      throw error;
    }
  }
}
