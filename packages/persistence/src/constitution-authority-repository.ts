import {
  ConstitutionRecordVersionConflictError,
  type CanonicalConstitutionAmendmentRecord,
  type ConstitutionAuthorityRepository,
  type ConstitutionEvidenceRecord,
  type ConstitutionPublicationRecord,
  type ConstitutionRatificationDecisionRecord
} from "@blueprint-os/core";

import type { BlueprintPrismaClient } from "./client";
import { Prisma } from "./generated/prisma/client";

import { asAmendment, asEvidence, asDecision, asPublication } from "./constitution-codecs";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function amendmentRow(record: CanonicalConstitutionAmendmentRecord) {
  return {
    schemaVersion: "1.0.0",
    recordVersion: record.recordVersion,
    basePolicyVersion: record.proposal.basePolicyVersion,
    targetPolicyVersion: record.proposal.targetPolicyVersion,
    title: record.proposal.title,
    state: record.state,
    proposedByActorId: record.proposedByActorId,
    document: asJson(record),
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  };
}

function assertNextVersion(
  record: CanonicalConstitutionAmendmentRecord,
  expectedRecordVersion: number
): void {
  if (record.recordVersion !== expectedRecordVersion + 1) {
    throw new TypeError(
      "Constitution amendment recordVersion must increment exactly by one"
    );
  }
}


function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export class PostgresConstitutionAuthorityRepository
  implements ConstitutionAuthorityRepository
{
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  async createAmendment(
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    if (record.recordVersion !== 1 || record.state !== "draft") {
      throw new TypeError(
        "A new Constitution amendment must start at draft recordVersion 1"
      );
    }

    const data = amendmentRow(record);
    await this.prisma.$transaction(async (tx) => {
      await tx.constitutionAmendment.create({
        data: {
          id: record.proposal.id,
          ...data
        }
      });
      await tx.constitutionAmendmentRevision.create({
        data: {
          id: `${record.proposal.id}:v1`,
          amendmentId: record.proposal.id,
          recordVersion: 1,
          state: record.state,
          actorPrincipalId: record.proposedByActorId,
          action: "AMENDMENT_CREATED",
          document: asJson(record),
          createdAt: new Date(record.updatedAt)
        }
      });
    });

    return record;
  }

  async findAmendmentById(
    amendmentId: string
  ): Promise<CanonicalConstitutionAmendmentRecord | null> {
    const row = await this.prisma.constitutionAmendment.findUnique({
      where: { id: amendmentId }
    });
    return row ? asAmendment(row.document, row) : null;
  }

  async listAmendments(): Promise<readonly CanonicalConstitutionAmendmentRecord[]> {
    const rows = await this.prisma.constitutionAmendment.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }]
    });
    return Object.freeze(rows.map((row) => asAmendment(row.document, row)));
  }

  async updateAmendment(
    record: CanonicalConstitutionAmendmentRecord,
    expectedRecordVersion: number,
    actorPrincipalId: string,
    action: string
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    assertNextVersion(record, expectedRecordVersion);
    await this.prisma.$transaction(async (tx) => {
      const result = await tx.constitutionAmendment.updateMany({
        where: {
          id: record.proposal.id,
          recordVersion: expectedRecordVersion
        },
        data: amendmentRow(record)
      });
      if (result.count !== 1) {
        throw new ConstitutionRecordVersionConflictError(
          record.proposal.id,
          expectedRecordVersion
        );
      }
      await tx.constitutionAmendmentRevision.create({
        data: {
          id: `${record.proposal.id}:v${record.recordVersion}`,
          amendmentId: record.proposal.id,
          recordVersion: record.recordVersion,
          state: record.state,
          actorPrincipalId,
          action,
          document: asJson(record),
          createdAt: new Date(record.updatedAt)
        }
      });
    });
    return record;
  }

  async appendEvidenceAndUpdate(
    evidence: ConstitutionEvidenceRecord,
    record: CanonicalConstitutionAmendmentRecord,
    expectedRecordVersion: number,
    actorPrincipalId: string,
    action: string
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    assertNextVersion(record, expectedRecordVersion);
    if (evidence.amendmentId !== record.proposal.id) {
      throw new TypeError("Constitution evidence belongs to another amendment");
    }

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.constitutionAmendment.updateMany({
        where: {
          id: record.proposal.id,
          recordVersion: expectedRecordVersion
        },
        data: amendmentRow(record)
      });
      if (result.count !== 1) {
        throw new ConstitutionRecordVersionConflictError(
          record.proposal.id,
          expectedRecordVersion
        );
      }

      await tx.constitutionEvidence.create({
        data: {
          id: evidence.id,
          amendmentId: evidence.amendmentId,
          kind: evidence.kind,
          source: evidence.source,
          revision: evidence.revision,
          digest: evidence.digest,
          note: evidence.note,
          recordedByActorId: evidence.recordedByActorId,
          document: asJson(evidence),
          createdAt: new Date(evidence.createdAt)
        }
      });

      await tx.constitutionAmendmentRevision.create({
        data: {
          id: `${record.proposal.id}:v${record.recordVersion}`,
          amendmentId: record.proposal.id,
          recordVersion: record.recordVersion,
          state: record.state,
          actorPrincipalId,
          action,
          document: asJson(record),
          createdAt: new Date(record.updatedAt)
        }
      });
    });

    return record;
  }

  async listEvidence(
    amendmentId: string
  ): Promise<readonly ConstitutionEvidenceRecord[]> {
    const rows = await this.prisma.constitutionEvidence.findMany({
      where: { amendmentId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    return Object.freeze(rows.map(asEvidence));
  }

  async appendRatificationDecisionAndUpdate(
    decision: ConstitutionRatificationDecisionRecord,
    record: CanonicalConstitutionAmendmentRecord,
    expectedRecordVersion: number
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    assertNextVersion(record, expectedRecordVersion);
    if (decision.amendmentId !== record.proposal.id) {
      throw new TypeError("Ratification decision belongs to another amendment");
    }
    if (decision.amendmentRecordVersion !== expectedRecordVersion) {
      throw new TypeError(
        "Ratification decision must bind the exact pre-decision amendment revision"
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const result = await tx.constitutionAmendment.updateMany({
          where: {
            id: record.proposal.id,
            recordVersion: expectedRecordVersion
          },
          data: amendmentRow(record)
        });
        if (result.count !== 1) {
          throw new ConstitutionRecordVersionConflictError(
            record.proposal.id,
            expectedRecordVersion
          );
        }

        await tx.constitutionRatificationDecision.create({
          data: {
            id: decision.id,
            amendmentId: decision.amendmentId,
            amendmentRecordVersion: decision.amendmentRecordVersion,
            reviewerActorId: decision.reviewerActorId,
            source: decision.source,
            decision: decision.decision,
            note: decision.note,
            decidedAt: new Date(decision.decidedAt),
            humanRatification: true,
            productionReleaseAuthority: false,
            document: asJson(decision)
          }
        });

        await tx.constitutionAmendmentRevision.create({
          data: {
            id: `${record.proposal.id}:v${record.recordVersion}`,
            amendmentId: record.proposal.id,
            recordVersion: record.recordVersion,
            state: record.state,
            actorPrincipalId: decision.reviewerActorId,
            action:
              decision.decision === "approve"
                ? "AMENDMENT_RATIFIED"
                : "AMENDMENT_REJECTED",
            document: asJson(record),
            createdAt: new Date(record.updatedAt)
          }
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new TypeError(
          "A ratification decision already exists for this exact amendment revision."
        );
      }
      throw error;
    }

    return record;
  }

  async findRatificationDecision(
    amendmentId: string,
    amendmentRecordVersion: number
  ): Promise<ConstitutionRatificationDecisionRecord | null> {
    const row = await this.prisma.constitutionRatificationDecision.findUnique({
      where: {
        amendmentId_amendmentRecordVersion: {
          amendmentId,
          amendmentRecordVersion
        }
      }
    });
    return row ? asDecision(row) : null;
  }

  async findRatificationDecisionById(
    decisionId: string
  ): Promise<ConstitutionRatificationDecisionRecord | null> {
    const row = await this.prisma.constitutionRatificationDecision.findUnique({
      where: { id: decisionId }
    });
    return row ? asDecision(row) : null;
  }


  async appendPublicationAndUpdate(
    publication: ConstitutionPublicationRecord,
    evidence: ConstitutionEvidenceRecord,
    record: CanonicalConstitutionAmendmentRecord,
    expectedRecordVersion: number
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    assertNextVersion(record, expectedRecordVersion);
    if (
      publication.amendmentId !== record.proposal.id ||
      evidence.amendmentId !== record.proposal.id
    ) {
      throw new TypeError(
        "Publication record and evidence must belong to the same amendment"
      );
    }
    if (
      publication.amendmentRecordVersion !== expectedRecordVersion ||
      evidence.kind !== "publication" ||
      record.publicationEvidenceId !== evidence.id
    ) {
      throw new TypeError(
        "Publication must bind the exact ratified amendment revision and canonical publication evidence"
      );
    }
    if (
      publication.productionReleaseAuthority !== false ||
      record.productionReleaseAuthority !== false
    ) {
      throw new TypeError(
        "Constitution publication must never grant Production authority"
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Hold current Constitutional Authority through publication append/CAS.
        const owners = await tx.$queryRaw<{ ownerPrincipalId: string }[]>(Prisma.sql`
          SELECT "ownerPrincipalId" FROM "SystemBootstrap" WHERE id = 'system' FOR SHARE
        `);
        const decision = record.ratificationDecisionId ? await tx.constitutionRatificationDecision.findUnique({ where: { id: record.ratificationDecisionId } }) : null;
        if (!owners[0] || owners[0].ownerPrincipalId !== publication.publishedByActorId ||
            !decision || decision.reviewerActorId !== owners[0].ownerPrincipalId ||
            decision.amendmentId !== record.proposal.id || decision.amendmentRecordVersion !== expectedRecordVersion - 1 ||
            decision.decision !== "approve" || decision.source !== "authenticated-user-action" ||
            decision.humanRatification !== true || decision.productionReleaseAuthority !== false) {
          throw new TypeError("Publication authority/ratification was revoked before transaction");
        }

        const result = await tx.constitutionAmendment.updateMany({
          where: {
            id: record.proposal.id,
            recordVersion: expectedRecordVersion,
            state: "ratified"
          },
          data: amendmentRow(record)
        });
        if (result.count !== 1) {
          throw new ConstitutionRecordVersionConflictError(
            record.proposal.id,
            expectedRecordVersion
          );
        }

        await tx.constitutionEvidence.create({
          data: {
            id: evidence.id,
            amendmentId: evidence.amendmentId,
            kind: evidence.kind,
            source: evidence.source,
            revision: evidence.revision,
            digest: evidence.digest,
            note: evidence.note,
            recordedByActorId: evidence.recordedByActorId,
            document: asJson(evidence),
            createdAt: new Date(evidence.createdAt)
          }
        });

        await tx.constitutionPublication.create({
          data: {
            id: publication.id,
            amendmentId: publication.amendmentId,
            amendmentRecordVersion: publication.amendmentRecordVersion,
            policyVersion: publication.policyVersion,
            publishedByActorId: publication.publishedByActorId,
            sourceRevision: publication.sourceRevision,
            ciRunId: publication.ciRunId,
            authoritySetDigest: publication.authoritySetDigest,
            productionReleaseAuthority: false,
            document: asJson(publication),
            publishedAt: new Date(publication.publishedAt)
          }
        });

        await tx.constitutionAmendmentRevision.create({
          data: {
            id: `${record.proposal.id}:v${record.recordVersion}`,
            amendmentId: record.proposal.id,
            recordVersion: record.recordVersion,
            state: record.state,
            actorPrincipalId: publication.publishedByActorId,
            action: "CONSTITUTION_PUBLISHED",
            document: asJson(record),
            createdAt: new Date(record.updatedAt)
          }
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new TypeError(
          "This amendment or Constitution policy version already has a publication record."
        );
      }
      throw error;
    }

    return record;
  }

  async findPublicationByAmendmentId(
    amendmentId: string
  ): Promise<ConstitutionPublicationRecord | null> {
    const row = await this.prisma.constitutionPublication.findUnique({
      where: { amendmentId }
    });
    return row ? asPublication(row) : null;
  }

}
