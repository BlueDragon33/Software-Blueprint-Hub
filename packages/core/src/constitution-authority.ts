export type CanonicalConstitutionAmendmentState =
  | "draft"
  | "impact-reviewed"
  | "migration-ready"
  | "ratification-ready"
  | "ratified"
  | "published"
  | "propagating"
  | "verified"
  | "rejected";

export type ConstitutionEvidenceKind =
  | "impact"
  | "migration"
  | "publication"
  | "propagation"
  | "verification";

export interface CanonicalConstitutionAmendmentProposal {
  readonly id: string;
  readonly basePolicyVersion: string;
  readonly targetPolicyVersion: string;
  readonly title: string;
  readonly problem: string;
  readonly rationale: string;
  readonly affectedPillarIds: readonly string[];
  readonly affectedRequirementIds: readonly string[];
  readonly compatibilityRisk: "low" | "medium" | "high" | "critical";
  readonly migrationRequired: boolean;
  readonly proposedAt: string;
}

export interface CanonicalConstitutionAmendmentRecord {
  readonly proposal: CanonicalConstitutionAmendmentProposal;
  readonly state: CanonicalConstitutionAmendmentState;
  readonly impactEvidenceIds: readonly string[];
  readonly migrationEvidenceIds: readonly string[];
  readonly ratificationDecisionId: string | null;
  readonly publicationEvidenceId: string | null;
  readonly propagationEvidenceIds: readonly string[];
  readonly verificationEvidenceIds: readonly string[];
  readonly productionReleaseAuthority: false;
  readonly proposedByActorId: string;
  readonly recordVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ConstitutionEvidenceRecord {
  readonly id: string;
  readonly amendmentId: string;
  readonly kind: ConstitutionEvidenceKind;
  readonly source: string;
  readonly revision: string;
  readonly digest: string;
  readonly note: string;
  readonly recordedByActorId: string;
  readonly createdAt: string;
}

export type ConstitutionRatificationDecisionKind = "approve" | "reject";

export interface ConstitutionRatificationDecisionRecord {
  readonly id: string;
  readonly amendmentId: string;
  readonly amendmentRecordVersion: number;
  readonly reviewerActorId: string;
  readonly source: "authenticated-user-action";
  readonly decision: ConstitutionRatificationDecisionKind;
  readonly note: string;
  readonly decidedAt: string;
  readonly humanRatification: true;
  readonly productionReleaseAuthority: false;
}

export interface ConstitutionAuthorityRepository {
  createAmendment(
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord>;

  findAmendmentById(
    amendmentId: string
  ): Promise<CanonicalConstitutionAmendmentRecord | null>;

  listAmendments(): Promise<readonly CanonicalConstitutionAmendmentRecord[]>;

  updateAmendment(
    record: CanonicalConstitutionAmendmentRecord,
    expectedRecordVersion: number,
    actorPrincipalId: string,
    action: string
  ): Promise<CanonicalConstitutionAmendmentRecord>;

  appendEvidenceAndUpdate(
    evidence: ConstitutionEvidenceRecord,
    record: CanonicalConstitutionAmendmentRecord,
    expectedRecordVersion: number,
    actorPrincipalId: string,
    action: string
  ): Promise<CanonicalConstitutionAmendmentRecord>;

  listEvidence(
    amendmentId: string
  ): Promise<readonly ConstitutionEvidenceRecord[]>;

  appendRatificationDecisionAndUpdate(
    decision: ConstitutionRatificationDecisionRecord,
    record: CanonicalConstitutionAmendmentRecord,
    expectedRecordVersion: number
  ): Promise<CanonicalConstitutionAmendmentRecord>;

  findRatificationDecision(
    amendmentId: string,
    amendmentRecordVersion: number
  ): Promise<ConstitutionRatificationDecisionRecord | null>;
}
