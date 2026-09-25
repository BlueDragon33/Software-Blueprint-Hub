DELETE FROM "SystemBootstrap";

INSERT INTO "Principal" (
  "id",
  "provider",
  "providerSubject",
  "email",
  "createdAt",
  "updatedAt"
)
VALUES (
  'principal:p6-e2e-owner',
  'github',
  'p6-e2e-owner',
  'p6-e2e@example.test',
  NOW(),
  NOW()
)
ON CONFLICT ("provider", "providerSubject")
DO UPDATE SET
  "email" = EXCLUDED."email",
  "updatedAt" = NOW();

INSERT INTO "SystemBootstrap" (
  "id",
  "ownerPrincipalId",
  "initializedAt"
)
VALUES (
  'system',
  'principal:p6-e2e-owner',
  NOW()
)
ON CONFLICT ("id")
DO UPDATE SET
  "ownerPrincipalId" = EXCLUDED."ownerPrincipalId",
  "initializedAt" = NOW();

-- E2E runs after unit/integration tests in the same ephemeral database.
-- Clear canonical project state so registry evidence is deterministic and
-- contains only the projects seeded below.
DELETE FROM "Project";

INSERT INTO "Project" ("id", "createdAt", "updatedAt")
VALUES
  ('project:p6-registry-alpha', NOW(), NOW()),
  ('project:p6-registry-beta', NOW(), NOW());

INSERT INTO "ProjectProfile" (
  "id",
  "projectId",
  "schemaVersion",
  "recordVersion",
  "document",
  "createdAt",
  "updatedAt"
)
VALUES
(
  'profile:p6-registry-alpha',
  'project:p6-registry-alpha',
  '1.0.0',
  1,
  '{
    "id":"profile:p6-registry-alpha",
    "projectId":"project:p6-registry-alpha",
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T13:00:00Z",
      "updatedAt":"2026-09-25T13:00:00Z"
    },
    "name":"Registry Alpha canonical",
    "projectType":"web-application",
    "blueprintLevel":"B2",
    "primaryUsers":["software-builder"],
    "jobsToBeDone":["Manage an evidence-backed software blueprint."],
    "dataSensitivity":"internal",
    "persistence":"server",
    "authentication":"required",
    "authorization":"role-based",
    "offlineRequirement":"none",
    "externalIntegrations":[],
    "aiUse":"assistive",
    "extensibilityRequirement":"templates",
    "expectedLifetime":"long-lived",
    "expectedScale":"project-defined",
    "availabilityRequirement":"recoverable web service",
    "complianceSecuritySensitivity":"project-defined",
    "deploymentTarget":"managed web platform",
    "maintenanceModel":"versioned continuous maintenance"
  }'::jsonb,
  NOW(),
  NOW()
),
(
  'profile:p6-registry-beta',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  '{
    "id":"profile:p6-registry-beta",
    "projectId":"project:p6-registry-beta",
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T14:00:00Z",
      "updatedAt":"2026-09-25T14:00:00Z"
    },
    "name":"Registry Beta canonical",
    "projectType":"web-application",
    "blueprintLevel":"B4",
    "primaryUsers":["software-builder"],
    "jobsToBeDone":["Manage an evidence-backed software blueprint."],
    "dataSensitivity":"internal",
    "persistence":"server",
    "authentication":"required",
    "authorization":"role-based",
    "offlineRequirement":"none",
    "externalIntegrations":[],
    "aiUse":"assistive",
    "extensibilityRequirement":"templates",
    "expectedLifetime":"long-lived",
    "expectedScale":"project-defined",
    "availabilityRequirement":"recoverable web service",
    "complianceSecuritySensitivity":"project-defined",
    "deploymentTarget":"managed web platform",
    "maintenanceModel":"versioned continuous maintenance"
  }'::jsonb,
  NOW(),
  NOW()
);
