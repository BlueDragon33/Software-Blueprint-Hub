-- P6-006 canonical Release & Lessons persistence

CREATE TABLE "ReleaseRecord" (
    "id" VARCHAR(160) NOT NULL,
    "projectId" VARCHAR(160) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "version" VARCHAR(120) NOT NULL,
    "revision" VARCHAR(160) NOT NULL,
    "environment" VARCHAR(120) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ReleaseRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LessonLearned" (
    "id" VARCHAR(160) NOT NULL,
    "projectId" VARCHAR(160) NOT NULL,
    "releaseId" VARCHAR(160),
    "schemaVersion" VARCHAR(32) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "category" VARCHAR(32) NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LessonLearned_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReleaseRecord_projectId_status_idx"
ON "ReleaseRecord"("projectId", "status");

CREATE INDEX "ReleaseRecord_projectId_revision_idx"
ON "ReleaseRecord"("projectId", "revision");

CREATE INDEX "ReleaseRecord_projectId_recordVersion_idx"
ON "ReleaseRecord"("projectId", "recordVersion");

CREATE INDEX "LessonLearned_projectId_category_idx"
ON "LessonLearned"("projectId", "category");

CREATE INDEX "LessonLearned_projectId_recordVersion_idx"
ON "LessonLearned"("projectId", "recordVersion");

CREATE INDEX "LessonLearned_releaseId_idx"
ON "LessonLearned"("releaseId");

ALTER TABLE "ReleaseRecord"
ADD CONSTRAINT "ReleaseRecord_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonLearned"
ADD CONSTRAINT "LessonLearned_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonLearned"
ADD CONSTRAINT "LessonLearned_releaseId_fkey"
FOREIGN KEY ("releaseId") REFERENCES "ReleaseRecord"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
