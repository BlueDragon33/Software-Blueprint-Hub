CREATE TABLE "Project" (
    "id" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectProfile" (
    "id" VARCHAR(160) NOT NULL,
    "projectId" VARCHAR(160) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "recordVersion" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectProfile_projectId_key"
ON "ProjectProfile"("projectId");

CREATE INDEX "ProjectProfile_projectId_recordVersion_idx"
ON "ProjectProfile"("projectId", "recordVersion");

ALTER TABLE "ProjectProfile"
ADD CONSTRAINT "ProjectProfile_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
