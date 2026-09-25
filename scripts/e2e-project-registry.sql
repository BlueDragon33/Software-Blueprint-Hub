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


-- P6-002 readiness fixture for the B4 Beta project.
-- Deliberately leave gate:platform:compatibility without a canonical row so
-- the dashboard must fail closed on a missing resolved required gate.

INSERT INTO "WorkPackage" (
  "id",
  "projectId",
  "schemaVersion",
  "recordVersion",
  "status",
  "document",
  "createdAt",
  "updatedAt"
)
VALUES
(
  'work-package:p6-beta-foundation',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'testing',
  '{
    "id":"work-package:p6-beta-foundation",
    "projectId":"project:p6-registry-beta",
    "title":"Verify platform foundation",
    "purpose":"Prove the platform foundation before dependent readiness work.",
    "dependencies":[],
    "acceptanceCriteria":["Foundation evidence is complete."],
    "qualityGateIds":["gate:quality:evidence"],
    "status":"testing",
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T15:10:00Z",
      "updatedAt":"2026-09-25T15:10:00Z"
    }
  }'::jsonb,
  NOW(),
  NOW()
),
(
  'work-package:p6-beta-dashboard',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'blocked',
  '{
    "id":"work-package:p6-beta-dashboard",
    "projectId":"project:p6-registry-beta",
    "title":"Ship readiness dashboard",
    "purpose":"Expose truthful project readiness.",
    "dependencies":["work-package:p6-beta-foundation"],
    "acceptanceCriteria":["Readiness is evidence-backed."],
    "qualityGateIds":["gate:quality:evidence"],
    "status":"blocked",
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T15:11:00Z",
      "updatedAt":"2026-09-25T15:11:00Z"
    }
  }'::jsonb,
  NOW(),
  NOW()
);

INSERT INTO "QualityGate" (
  "id",
  "projectId",
  "schemaVersion",
  "recordVersion",
  "status",
  "document",
  "createdAt",
  "updatedAt"
)
VALUES
(
  'gate:quality:evidence',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'candidate',
  '{
    "id":"gate:quality:evidence",
    "projectId":"project:p6-registry-beta",
    "name":"Quality evidence",
    "requirements":["Revision-specific CI evidence exists."],
    "status":"candidate",
    "evidenceIds":["evidence:p6-beta-quality"],
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T15:12:00Z",
      "updatedAt":"2026-09-25T15:12:00Z"
    }
  }'::jsonb,
  NOW(),
  NOW()
),
(
  'gate:security:authority',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'pass',
  '{
    "id":"gate:security:authority",
    "projectId":"project:p6-registry-beta",
    "name":"Security authority",
    "requirements":["Protected mutations use trusted authorization."],
    "status":"pass",
    "evidenceIds":["evidence:p6-beta-security"],
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T15:12:30Z",
      "updatedAt":"2026-09-25T15:12:30Z"
    }
  }'::jsonb,
  NOW(),
  NOW()
),
(
  'gate:ux:human-acceptance',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'not-ready',
  '{
    "id":"gate:ux:human-acceptance",
    "projectId":"project:p6-registry-beta",
    "name":"Human UX acceptance",
    "requirements":["Critical journeys require Human UX review."],
    "status":"not-ready",
    "evidenceIds":[],
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T15:13:00Z",
      "updatedAt":"2026-09-25T15:13:00Z"
    }
  }'::jsonb,
  NOW(),
  NOW()
);

INSERT INTO "GateEvidence" (
  "id",
  "gateId",
  "kind",
  "source",
  "revision",
  "document",
  "createdAt"
)
VALUES
(
  'evidence:p6-beta-quality',
  'gate:quality:evidence',
  'test',
  'github-actions:p6-beta',
  'revision-p6-beta-quality',
  '{
    "id":"evidence:p6-beta-quality",
    "gateId":"gate:quality:evidence",
    "kind":"test",
    "source":"github-actions:p6-beta",
    "revision":"revision-p6-beta-quality",
    "createdAt":"2026-09-25T15:14:00Z"
  }'::jsonb,
  '2026-09-25T15:14:00Z'::timestamptz
),
(
  'evidence:p6-beta-security',
  'gate:security:authority',
  'review',
  'authority-review:p6-beta',
  'revision-p6-beta-security',
  '{
    "id":"evidence:p6-beta-security",
    "gateId":"gate:security:authority",
    "kind":"review",
    "source":"authority-review:p6-beta",
    "revision":"revision-p6-beta-security",
    "createdAt":"2026-09-25T15:14:30Z"
  }'::jsonb,
  '2026-09-25T15:14:30Z'::timestamptz
);
