CREATE TABLE "WorkPackage" (
    "id" VARCHAR(160) NOT NULL,
    "projectId" VARCHAR(160) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QualityGate" (
    "id" VARCHAR(160) NOT NULL,
    "projectId" VARCHAR(160) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "QualityGate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GateEvidence" (
    "id" VARCHAR(160) NOT NULL,
    "gateId" VARCHAR(160) NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "source" VARCHAR(500) NOT NULL,
    "revision" VARCHAR(160) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GateEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkPackage_projectId_status_idx" ON "WorkPackage"("projectId", "status");
CREATE INDEX "WorkPackage_projectId_recordVersion_idx" ON "WorkPackage"("projectId", "recordVersion");
CREATE INDEX "QualityGate_projectId_status_idx" ON "QualityGate"("projectId", "status");
CREATE INDEX "QualityGate_projectId_recordVersion_idx" ON "QualityGate"("projectId", "recordVersion");
CREATE INDEX "GateEvidence_gateId_createdAt_idx" ON "GateEvidence"("gateId", "createdAt");
CREATE INDEX "GateEvidence_source_revision_idx" ON "GateEvidence"("source", "revision");

ALTER TABLE "WorkPackage"
ADD CONSTRAINT "WorkPackage_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QualityGate"
ADD CONSTRAINT "QualityGate_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GateEvidence"
ADD CONSTRAINT "GateEvidence_gateId_fkey"
FOREIGN KEY ("gateId") REFERENCES "QualityGate"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
