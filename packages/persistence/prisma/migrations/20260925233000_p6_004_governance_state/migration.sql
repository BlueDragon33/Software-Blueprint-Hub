-- P6-004 canonical Decisions / Risks / Technical Debt persistence

CREATE TABLE "ArchitectureDecision" (
    "id" VARCHAR(160) NOT NULL,
    "projectId" VARCHAR(160) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ArchitectureDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Risk" (
    "id" VARCHAR(160) NOT NULL,
    "projectId" VARCHAR(160) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "likelihood" VARCHAR(16) NOT NULL,
    "impact" VARCHAR(16) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TechnicalDebt" (
    "id" VARCHAR(160) NOT NULL,
    "projectId" VARCHAR(160) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TechnicalDebt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArchitectureDecision_projectId_status_idx"
ON "ArchitectureDecision"("projectId", "status");

CREATE INDEX "ArchitectureDecision_projectId_recordVersion_idx"
ON "ArchitectureDecision"("projectId", "recordVersion");

CREATE INDEX "Risk_projectId_status_idx"
ON "Risk"("projectId", "status");

CREATE INDEX "Risk_projectId_likelihood_impact_idx"
ON "Risk"("projectId", "likelihood", "impact");

CREATE INDEX "Risk_projectId_recordVersion_idx"
ON "Risk"("projectId", "recordVersion");

CREATE INDEX "TechnicalDebt_projectId_status_idx"
ON "TechnicalDebt"("projectId", "status");

CREATE INDEX "TechnicalDebt_projectId_severity_idx"
ON "TechnicalDebt"("projectId", "severity");

CREATE INDEX "TechnicalDebt_projectId_recordVersion_idx"
ON "TechnicalDebt"("projectId", "recordVersion");

ALTER TABLE "ArchitectureDecision"
ADD CONSTRAINT "ArchitectureDecision_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Risk"
ADD CONSTRAINT "Risk_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TechnicalDebt"
ADD CONSTRAINT "TechnicalDebt_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
