CREATE TABLE "ConstitutionPublication" (
    "id" VARCHAR(160) NOT NULL,
    "amendmentId" VARCHAR(160) NOT NULL,
    "amendmentRecordVersion" INTEGER NOT NULL,
    "policyVersion" VARCHAR(80) NOT NULL,
    "publishedByActorId" VARCHAR(160) NOT NULL,
    "sourceRevision" VARCHAR(160) NOT NULL,
    "ciRunId" VARCHAR(120) NOT NULL,
    "authoritySetDigest" VARCHAR(160) NOT NULL,
    "productionReleaseAuthority" BOOLEAN NOT NULL DEFAULT false,
    "document" JSONB NOT NULL,
    "publishedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConstitutionPublication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConstitutionPublication_amendmentId_key" ON "ConstitutionPublication"("amendmentId");
CREATE UNIQUE INDEX "ConstitutionPublication_policyVersion_key" ON "ConstitutionPublication"("policyVersion");
CREATE INDEX "ConstitutionPublication_sourceRevision_idx" ON "ConstitutionPublication"("sourceRevision");
CREATE INDEX "ConstitutionPublication_publishedByActorId_publishedAt_idx" ON "ConstitutionPublication"("publishedByActorId", "publishedAt");
CREATE INDEX "ConstitutionPublication_authoritySetDigest_idx" ON "ConstitutionPublication"("authoritySetDigest");

ALTER TABLE "ConstitutionPublication"
ADD CONSTRAINT "ConstitutionPublication_amendmentId_fkey"
FOREIGN KEY ("amendmentId") REFERENCES "ConstitutionAmendment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ConstitutionPublication"
ADD CONSTRAINT "ConstitutionPublication_publishedByActorId_fkey"
FOREIGN KEY ("publishedByActorId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
