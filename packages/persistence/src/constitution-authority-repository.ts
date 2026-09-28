import {
  ConstitutionRecordVersionConflictError,
  type CanonicalConstitutionAmendmentRecord,
  type CanonicalConstitutionAmendmentState,
  type ConstitutionAuthorityRepository,
  type ConstitutionEvidenceKind,
  type ConstitutionEvidenceRecord,
  type ConstitutionPublicationRecord,
  type ConstitutionRatificationDecisionKind,
  type ConstitutionRatificationDecisionRecord
} from "@blueprint-os/core";

import type { BlueprintPrismaClient } from "./client";
import { Prisma } from "./generated/prisma/client";

const amendmentStates = new Set<CanonicalConstitutionAmendmentState>([
  "draft",
  "impact-reviewed",
  "migration-ready",
  "ratification-ready",
  "ratified",
  "published",
  "propagating",
  "verified",
  "rejected"
]);

const evidenceKinds = new Set<ConstitutionEvidenceKind>([
  "impact",
  "migration",
  "publication",
  "propagation",
  "verification"
]);

const decisionKinds = new Set<ConstitutionRatificationDecisionKind>([
  "approve",
  "reject"
]);

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError(`${label} must be a boolean`);
  }
  return value;
}

function integer(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 1) {
    throw new TypeError(`${label} must be a positive integer`);
  }
  return Number(value);
}

function strings(value: unknown, label: string): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string")
  ) {
    throw new TypeError(`${label} must be a string array`);
  }
  return Object.freeze([...value]);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function iso(value: unknown, label: string): string {
  const candidate = string(value, label);
  const parsed = Date.parse(candidate);
  if (Number.isNaN(parsed)) {
    throw new TypeError(`${label} must be an ISO timestamp`);
  }
  return new Date(parsed).toISOString();
}

function asAmendment(
  document: unknown,
  row?: {
    id: string;
    recordVersion: number;
    basePolicyVersion: string;
    targetPolicyVersion: string;
    title: string;
    state: string;
    proposedByActorId: string;
    createdAt: Date;
    updatedAt: Date;
  }
): CanonicalConstitutionAmendmentRecord {
  const value = object(document, "ConstitutionAmendment");
  const proposal = object(value.proposal, "ConstitutionAmendment.proposal");
  const state = string(value.state, "ConstitutionAmendment.state");
  if (!amendmentStates.has(state as CanonicalConstitutionAmendmentState)) {
    throw new TypeError("Stored Constitution amendment has invalid state");
  }
  if (value.productionReleaseAuthority !== false) {
    throw new TypeError(
      "Constitution amendment must never grant Production authority"
    );
  }

  const record: CanonicalConstitutionAmendmentRecord = Object.freeze({
    proposal: Object.freeze({
      id: string(proposal.id, "proposal.id"),
      basePolicyVersion: string(
        proposal.basePolicyVersion,
        "proposal.basePolicyVersion"
      ),
      targetPolicyVersion: string(
        proposal.targetPolicyVersion,
        "proposal.targetPolicyVersion"
      ),
      title: string(proposal.title, "proposal.title"),
      problem: string(proposal.problem, "proposal.problem"),
      rationale: string(proposal.rationale, "proposal.rationale"),
      affectedPillarIds: strings(
        proposal.affectedPillarIds,
        "proposal.affectedPillarIds"
      ),
      affectedRequirementIds: strings(
        proposal.affectedRequirementIds,
        "proposal.affectedRequirementIds"
      ),
      compatibilityRisk: (() => {
        const risk = string(
          proposal.compatibilityRisk,
          "proposal.compatibilityRisk"
        );
        if (!["low", "medium", "high", "critical"].includes(risk)) {
          throw new TypeError("Stored Constitution amendment has invalid compatibilityRisk");
        }
        return risk as CanonicalConstitutionAmendmentRecord["proposal"]["compatibilityRisk"];
      })(),
      migrationRequired: boolean(
        proposal.migrationRequired,
        "proposal.migrationRequired"
      ),
      proposedAt: iso(proposal.proposedAt, "proposal.proposedAt")
    }),
    state: state as CanonicalConstitutionAmendmentState,
    impactEvidenceIds: strings(
      value.impactEvidenceIds,
      "impactEvidenceIds"
    ),
    migrationEvidenceIds: strings(
      value.migrationEvidenceIds,
      "migrationEvidenceIds"
    ),
    ratificationDecisionId:
      value.ratificationDecisionId === null
        ? null
        : string(value.ratificationDecisionId, "ratificationDecisionId"),
    publicationEvidenceId:
      value.publicationEvidenceId === null
        ? null
        : string(value.publicationEvidenceId, "publicationEvidenceId"),
    propagationEvidenceIds: strings(
      value.propagationEvidenceIds,
      "propagationEvidenceIds"
    ),
    verificationEvidenceIds: strings(
      value.verificationEvidenceIds,
      "verificationEvidenceIds"
    ),
    productionReleaseAuthority: false,
    proposedByActorId: string(
      value.proposedByActorId,
      "proposedByActorId"
    ),
    recordVersion: integer(value.recordVersion, "recordVersion"),
    createdAt: iso(value.createdAt, "createdAt"),
    updatedAt: iso(value.updatedAt, "updatedAt")
  });

  if (row) {
    if (
      row.id !== record.proposal.id ||
      row.recordVersion !== record.recordVersion ||
      row.basePolicyVersion !== record.proposal.basePolicyVersion ||
      row.targetPolicyVersion !== record.proposal.targetPolicyVersion ||
      row.title !== record.proposal.title ||
      row.state !== record.state ||
      row.proposedByActorId !== record.proposedByActorId ||
      row.createdAt.toISOString() !== record.createdAt ||
      row.updatedAt.toISOString() !== record.updatedAt
    ) {
      throw new TypeError(
        "Stored Constitution amendment columns drift from canonical document"
      );
    }
  }

  return record;
}

function asEvidence(row: {
  id: string;
  amendmentId: string;
  kind: string;
  source: string;
  revision: string;
  digest: string;
  note: string;
  recordedByActorId: string;
  document: unknown;
  createdAt: Date;
}): ConstitutionEvidenceRecord {
  if (!evidenceKinds.has(row.kind as ConstitutionEvidenceKind)) {
    throw new TypeError("Stored Constitution evidence has invalid kind");
  }
  const document = object(row.document, "ConstitutionEvidence.document");
  if (
    string(document.id, "evidence.id") !== row.id ||
    string(document.amendmentId, "evidence.amendmentId") !== row.amendmentId
  ) {
    throw new TypeError(
      "Stored Constitution evidence columns drift from canonical document"
    );
  }

  return Object.freeze({
    id: row.id,
    amendmentId: row.amendmentId,
    kind: row.kind as ConstitutionEvidenceKind,
    source: row.source,
    revision: row.revision,
    digest: row.digest,
    note: row.note,
    recordedByActorId: row.recordedByActorId,
    createdAt: row.createdAt.toISOString()
  });
}

function asDecision(row: {
  id: string;
  amendmentId: string;
  amendmentRecordVersion: number;
  reviewerActorId: string;
  source: string;
  decision: string;
  note: string;
  decidedAt: Date;
  humanRatification: boolean;
  productionReleaseAuthority: boolean;
}): ConstitutionRatificationDecisionRecord {
  if (row.source !== "authenticated-user-action") {
    throw new TypeError("Stored ratification decision has invalid source");
  }
  if (!decisionKinds.has(row.decision as ConstitutionRatificationDecisionKind)) {
    throw new TypeError("Stored ratification decision has invalid decision");
  }
  if (!row.humanRatification || row.productionReleaseAuthority) {
    throw new TypeError(
      "Stored ratification decision violates constitutional authority boundaries"
    );
  }

  return Object.freeze({
    id: row.id,
    amendmentId: row.amendmentId,
    amendmentRecordVersion: row.amendmentRecordVersion,
    reviewerActorId: row.reviewerActorId,
    source: "authenticated-user-action",
    decision: row.decision as ConstitutionRatificationDecisionKind,
    note: row.note,
    decidedAt: row.decidedAt.toISOString(),
    humanRatification: true,
    productionReleaseAuthority: false
  });
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


const publicationComponentIds = new Set([
  "normative-document",
  "machine-contract",
  "universal-template",
  "policy-version"
]);

function asPublication(row: {
  id: string;
  amendmentId: string;
  amendmentRecordVersion: number;
  policyVersion: string;
  publishedByActorId: string;
  sourceRevision: string;
  ciRunId: string;
  authoritySetDigest: string;
  productionReleaseAuthority: boolean;
  document: unknown;
  publishedAt: Date;
}): ConstitutionPublicationRecord {
  if (row.productionReleaseAuthority) {
    throw new TypeError(
      "Stored Constitution publication must never grant Production authority"
    );
  }
  const document = object(row.document, "ConstitutionPublication.document");
  if (
    string(document.id, "publication.id") !== row.id ||
    string(document.amendmentId, "publication.amendmentId") !== row.amendmentId ||
    integer(document.amendmentRecordVersion, "publication.amendmentRecordVersion") !==
      row.amendmentRecordVersion ||
    string(document.policyVersion, "publication.policyVersion") !== row.policyVersion ||
    string(document.publishedByActorId, "publication.publishedByActorId") !==
      row.publishedByActorId ||
    string(document.sourceRevision, "publication.sourceRevision") !==
      row.sourceRevision ||
    string(document.ciRunId, "publication.ciRunId") !== row.ciRunId ||
    string(document.authoritySetDigest, "publication.authoritySetDigest") !==
      row.authoritySetDigest ||
    iso(document.publishedAt, "publication.publishedAt") !==
      row.publishedAt.toISOString() ||
    document.productionReleaseAuthority !== false
  ) {
    throw new TypeError(
      "Stored Constitution publication columns drift from canonical document"
    );
  }
  if (!Array.isArray(document.components)) {
    throw new TypeError("Stored Constitution publication components are invalid");
  }

  return Object.freeze({
    id: row.id,
    amendmentId: row.amendmentId,
    amendmentRecordVersion: row.amendmentRecordVersion,
    policyVersion: row.policyVersion,
    publishedByActorId: row.publishedByActorId,
    sourceRevision: row.sourceRevision,
    ciRunId: row.ciRunId,
    authoritySetDigest: row.authoritySetDigest,
    components: Object.freeze(
      document.components.map((item, index) => {
        const component = object(item, `publication.components[${index}]`);
        const id = string(component.id, "publication component id");
        if (!publicationComponentIds.has(id)) {
          throw new TypeError(
            `Stored Constitution publication has invalid component id ${id}`
          );
        }
        return Object.freeze({
          id: id as ConstitutionPublicationRecord["components"][number]["id"],
          path: string(component.path, "publication component path"),
          version: string(component.version, "publication component version"),
          digest: string(component.digest, "publication component digest")
        });
      })
    ),
    publishedAt: row.publishedAt.toISOString(),
    productionReleaseAuthority: false
  });
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
