CREATE TABLE "ConstitutionAmendment" (
    "id" VARCHAR(160) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "basePolicyVersion" VARCHAR(80) NOT NULL,
    "targetPolicyVersion" VARCHAR(80) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "state" VARCHAR(40) NOT NULL,
    "proposedByActorId" VARCHAR(160) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "ConstitutionAmendment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConstitutionAmendmentRevision" (
    "id" VARCHAR(200) NOT NULL,
    "amendmentId" VARCHAR(160) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "state" VARCHAR(40) NOT NULL,
    "actorPrincipalId" VARCHAR(160) NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "ConstitutionAmendmentRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConstitutionEvidence" (
    "id" VARCHAR(160) NOT NULL,
    "amendmentId" VARCHAR(160) NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "source" VARCHAR(500) NOT NULL,
    "revision" VARCHAR(160) NOT NULL,
    "digest" VARCHAR(160) NOT NULL,
    "note" TEXT NOT NULL,
    "recordedByActorId" VARCHAR(160) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "ConstitutionEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConstitutionRatificationDecision" (
    "id" VARCHAR(160) NOT NULL,
    "amendmentId" VARCHAR(160) NOT NULL,
    "amendmentRecordVersion" INTEGER NOT NULL,
    "reviewerActorId" VARCHAR(160) NOT NULL,
    "source" VARCHAR(80) NOT NULL,
    "decision" VARCHAR(24) NOT NULL,
    "note" TEXT NOT NULL,
    "decidedAt" TIMESTAMPTZ(6) NOT NULL,
    "humanRatification" BOOLEAN NOT NULL,
    "productionReleaseAuthority" BOOLEAN NOT NULL DEFAULT false,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConstitutionRatificationDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConstitutionAmendment_state_updatedAt_idx" ON "ConstitutionAmendment"("state", "updatedAt");
CREATE INDEX "ConstitutionAmendment_targetPolicyVersion_idx" ON "ConstitutionAmendment"("targetPolicyVersion");
CREATE INDEX "ConstitutionAmendment_proposedByActorId_updatedAt_idx" ON "ConstitutionAmendment"("proposedByActorId", "updatedAt");

CREATE UNIQUE INDEX "ConstitutionAmendmentRevision_amendmentId_recordVersion_key" ON "ConstitutionAmendmentRevision"("amendmentId", "recordVersion");
CREATE INDEX "ConstitutionAmendmentRevision_amendmentId_createdAt_idx" ON "ConstitutionAmendmentRevision"("amendmentId", "createdAt");
CREATE INDEX "ConstitutionAmendmentRevision_actorPrincipalId_createdAt_idx" ON "ConstitutionAmendmentRevision"("actorPrincipalId", "createdAt");

CREATE INDEX "ConstitutionEvidence_amendmentId_kind_createdAt_idx" ON "ConstitutionEvidence"("amendmentId", "kind", "createdAt");
CREATE INDEX "ConstitutionEvidence_source_revision_idx" ON "ConstitutionEvidence"("source", "revision");
CREATE INDEX "ConstitutionEvidence_recordedByActorId_createdAt_idx" ON "ConstitutionEvidence"("recordedByActorId", "createdAt");

CREATE UNIQUE INDEX "ConstitutionRatificationDecision_amendmentId_amendmentRecordVersion_key" ON "ConstitutionRatificationDecision"("amendmentId", "amendmentRecordVersion");
CREATE INDEX "ConstitutionRatificationDecision_reviewerActorId_decidedAt_idx" ON "ConstitutionRatificationDecision"("reviewerActorId", "decidedAt");
CREATE INDEX "ConstitutionRatificationDecision_amendmentId_decidedAt_idx" ON "ConstitutionRatificationDecision"("amendmentId", "decidedAt");

ALTER TABLE "ConstitutionAmendment"
ADD CONSTRAINT "ConstitutionAmendment_proposedByActorId_fkey"
FOREIGN KEY ("proposedByActorId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ConstitutionAmendmentRevision"
ADD CONSTRAINT "ConstitutionAmendmentRevision_amendmentId_fkey"
FOREIGN KEY ("amendmentId") REFERENCES "ConstitutionAmendment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConstitutionAmendmentRevision"
ADD CONSTRAINT "ConstitutionAmendmentRevision_actorPrincipalId_fkey"
FOREIGN KEY ("actorPrincipalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ConstitutionEvidence"
ADD CONSTRAINT "ConstitutionEvidence_amendmentId_fkey"
FOREIGN KEY ("amendmentId") REFERENCES "ConstitutionAmendment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConstitutionEvidence"
ADD CONSTRAINT "ConstitutionEvidence_recordedByActorId_fkey"
FOREIGN KEY ("recordedByActorId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ConstitutionRatificationDecision"
ADD CONSTRAINT "ConstitutionRatificationDecision_amendmentId_fkey"
FOREIGN KEY ("amendmentId") REFERENCES "ConstitutionAmendment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ConstitutionRatificationDecision"
ADD CONSTRAINT "ConstitutionRatificationDecision_reviewerActorId_fkey"
FOREIGN KEY ("reviewerActorId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
