CREATE TABLE "Principal" (
    "id" VARCHAR(160) NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "providerSubject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Principal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemBootstrap" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'system',
    "ownerPrincipalId" VARCHAR(160) NOT NULL,
    "initializedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemBootstrap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectAuthority" (
    "projectId" VARCHAR(160) NOT NULL,
    "principalId" VARCHAR(160) NOT NULL,
    "role" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAuthority_pkey" PRIMARY KEY ("projectId", "principalId")
);

CREATE TABLE "AuthorityAuditEvent" (
    "id" VARCHAR(160) NOT NULL,
    "actorPrincipalId" VARCHAR(160) NOT NULL,
    "targetPrincipalId" VARCHAR(160),
    "projectId" VARCHAR(160),
    "action" VARCHAR(80) NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorityAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Principal_provider_providerSubject_key"
ON "Principal"("provider", "providerSubject");

CREATE UNIQUE INDEX "SystemBootstrap_ownerPrincipalId_key"
ON "SystemBootstrap"("ownerPrincipalId");

CREATE INDEX "ProjectAuthority_principalId_role_idx"
ON "ProjectAuthority"("principalId", "role");

CREATE INDEX "AuthorityAuditEvent_projectId_createdAt_idx"
ON "AuthorityAuditEvent"("projectId", "createdAt");

CREATE INDEX "AuthorityAuditEvent_actorPrincipalId_createdAt_idx"
ON "AuthorityAuditEvent"("actorPrincipalId", "createdAt");

ALTER TABLE "SystemBootstrap"
ADD CONSTRAINT "SystemBootstrap_ownerPrincipalId_fkey"
FOREIGN KEY ("ownerPrincipalId")
REFERENCES "Principal"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "ProjectAuthority"
ADD CONSTRAINT "ProjectAuthority_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ProjectAuthority"
ADD CONSTRAINT "ProjectAuthority_principalId_fkey"
FOREIGN KEY ("principalId")
REFERENCES "Principal"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "AuthorityAuditEvent"
ADD CONSTRAINT "AuthorityAuditEvent_actorPrincipalId_fkey"
FOREIGN KEY ("actorPrincipalId")
REFERENCES "Principal"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "AuthorityAuditEvent"
ADD CONSTRAINT "AuthorityAuditEvent_targetPrincipalId_fkey"
FOREIGN KEY ("targetPrincipalId")
REFERENCES "Principal"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
