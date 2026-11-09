-- ONLY for the ephemeral GitHub Actions PostgreSQL QA service.
-- This synthetic VIEWER is not a real user, reviewer or approval authority.
INSERT INTO "Principal" ("id","provider","providerSubject","email","createdAt","updatedAt")
VALUES ('principal:r33-qa-viewer','github','r33-qa-viewer','r33-viewer@example.test',NOW(),NOW())
ON CONFLICT ("provider","providerSubject") DO UPDATE SET "updatedAt"=NOW();
INSERT INTO "ProjectAuthority" ("projectId","principalId","role","createdAt","updatedAt")
VALUES ('project:p6-registry-beta','principal:r33-qa-viewer','VIEWER',NOW(),NOW())
ON CONFLICT ("projectId","principalId") DO UPDATE SET "role"='VIEWER',"updatedAt"=NOW();
