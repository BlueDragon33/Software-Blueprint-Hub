-- Opt-in mapping to an existing canonical Principal; no privileged role is created.
CREATE TABLE "AppManagementSsoLink" (
  "issuer" VARCHAR(120) NOT NULL,
  "subject" VARCHAR(320) NOT NULL,
  "principalId" VARCHAR(160) NOT NULL,
  "linkedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMPTZ(6),
  CONSTRAINT "AppManagementSsoLink_pkey" PRIMARY KEY ("issuer","subject")
);
CREATE UNIQUE INDEX "AppManagementSsoLink_issuer_principalId_key"
  ON "AppManagementSsoLink"("issuer","principalId");
CREATE INDEX "AppManagementSsoLink_principalId_idx"
  ON "AppManagementSsoLink"("principalId");
ALTER TABLE "AppManagementSsoLink"
  ADD CONSTRAINT "AppManagementSsoLink_principalId_fkey"
  FOREIGN KEY ("principalId") REFERENCES "Principal"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
