-- P6-007 derived Prompt Projection history.
-- Snapshots are append-only projections and are never project source-of-truth.

CREATE TABLE "PromptProjectionSnapshot" (
    "snapshotKey" VARCHAR(255) NOT NULL,
    "projectId" VARCHAR(160) NOT NULL,
    "projectionId" VARCHAR(160) NOT NULL,
    "sourceRevision" VARCHAR(160) NOT NULL,
    "templateVersion" VARCHAR(120) NOT NULL,
    "contentHash" VARCHAR(160) NOT NULL,
    "generatedAt" TIMESTAMPTZ(6) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptProjectionSnapshot_pkey" PRIMARY KEY ("snapshotKey")
);

CREATE INDEX "PromptProjectionSnapshot_projectId_generatedAt_idx"
ON "PromptProjectionSnapshot"("projectId", "generatedAt");

CREATE INDEX "PromptProjectionSnapshot_projectId_sourceRevision_idx"
ON "PromptProjectionSnapshot"("projectId", "sourceRevision");

CREATE INDEX "PromptProjectionSnapshot_projectId_contentHash_idx"
ON "PromptProjectionSnapshot"("projectId", "contentHash");

ALTER TABLE "PromptProjectionSnapshot"
ADD CONSTRAINT "PromptProjectionSnapshot_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
