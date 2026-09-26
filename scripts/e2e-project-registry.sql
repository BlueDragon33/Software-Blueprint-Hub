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


-- P6-004 canonical governance fixture for the B4 Beta project.

INSERT INTO "ArchitectureDecision" (
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
  'architecture-decision:p6-beta-governance',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'accepted',
  '{
    "id":"architecture-decision:p6-beta-governance",
    "projectId":"project:p6-registry-beta",
    "title":"Keep governance state canonical and structured",
    "context":"Workspace views must not turn Markdown or UI state into architectural authority.",
    "decision":"Persist decisions, risks and technical debt behind repository ports and project authority.",
    "consequences":[
      "Governance records survive UI redesigns.",
      "Accepted ADR content is immutable and future direction uses explicit supersession."
    ],
    "status":"accepted",
    "source":"blueprint-os:p6-004-e2e",
    "sourceRevision":"revision-p6-004-e2e",
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T23:35:00Z",
      "updatedAt":"2026-09-25T23:35:00Z"
    }
  }'::jsonb,
  '2026-09-25T23:35:00Z'::timestamptz,
  '2026-09-25T23:35:00Z'::timestamptz
);

INSERT INTO "Risk" (
  "id",
  "projectId",
  "schemaVersion",
  "recordVersion",
  "likelihood",
  "impact",
  "status",
  "document",
  "createdAt",
  "updatedAt"
)
VALUES
(
  'risk:p6-beta-governance-drift',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'medium',
  'high',
  'mitigating',
  '{
    "id":"risk:p6-beta-governance-drift",
    "projectId":"project:p6-registry-beta",
    "title":"Governance records can drift from implementation",
    "description":"Decision and risk records may become stale if remediation work is not linked and reviewed.",
    "likelihood":"medium",
    "impact":"high",
    "status":"mitigating",
    "mitigation":"Track mitigation through the canonical readiness dashboard Work Package.",
    "owner":"platform-team",
    "linkedWorkPackageIds":["work-package:p6-beta-dashboard"],
    "source":"blueprint-os:p6-004-e2e",
    "sourceRevision":"revision-p6-004-e2e",
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T23:36:00Z",
      "updatedAt":"2026-09-25T23:36:00Z"
    }
  }'::jsonb,
  '2026-09-25T23:36:00Z'::timestamptz,
  '2026-09-25T23:36:00Z'::timestamptz
);

INSERT INTO "TechnicalDebt" (
  "id",
  "projectId",
  "schemaVersion",
  "recordVersion",
  "severity",
  "status",
  "document",
  "createdAt",
  "updatedAt"
)
VALUES
(
  'technical-debt:p6-beta-legacy-notes',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'medium',
  'accepted',
  '{
    "id":"technical-debt:p6-beta-legacy-notes",
    "projectId":"project:p6-registry-beta",
    "title":"Legacy governance notes remain outside structured records",
    "description":"Historical Markdown decisions still exist and should be migrated only when they remain active project truth.",
    "severity":"medium",
    "status":"accepted",
    "remediation":"Migrate active legacy items into canonical records during normal project evolution.",
    "linkedWorkPackageIds":["work-package:p6-beta-foundation"],
    "source":"blueprint-os:p6-004-e2e",
    "sourceRevision":"revision-p6-004-e2e",
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-25T23:37:00Z",
      "updatedAt":"2026-09-25T23:37:00Z"
    }
  }'::jsonb,
  '2026-09-25T23:37:00Z'::timestamptz,
  '2026-09-25T23:37:00Z'::timestamptz
);


-- P6-006 canonical release + lesson fixture.
INSERT INTO "QualityGate" (
  "id","projectId","schemaVersion","recordVersion","status","document","createdAt","updatedAt"
)
VALUES (
  'gate:p6-006-release-evidence',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'pass',
  '{
    "id":"gate:p6-006-release-evidence",
    "projectId":"project:p6-registry-beta",
    "name":"P6-006 exact release evidence",
    "requirements":["Release evidence must target the exact shipped revision."],
    "status":"pass",
    "evidenceIds":["evidence:p6-006-release"],
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-26T00:50:00Z",
      "updatedAt":"2026-09-26T00:50:00Z"
    }
  }'::jsonb,
  '2026-09-26T00:50:00Z'::timestamptz,
  '2026-09-26T00:50:00Z'::timestamptz
);

INSERT INTO "GateEvidence" (
  "id","gateId","kind","source","revision","document","createdAt"
)
VALUES (
  'evidence:p6-006-release',
  'gate:p6-006-release-evidence',
  'test',
  'github-actions:p6-006-e2e',
  'revision-p6-006-e2e',
  '{
    "id":"evidence:p6-006-release",
    "gateId":"gate:p6-006-release-evidence",
    "kind":"test",
    "source":"github-actions:p6-006-e2e",
    "revision":"revision-p6-006-e2e",
    "createdAt":"2026-09-26T00:51:00Z"
  }'::jsonb,
  '2026-09-26T00:51:00Z'::timestamptz
);

INSERT INTO "ReleaseRecord" (
  "id","projectId","schemaVersion","recordVersion","version","revision",
  "environment","status","document","createdAt","updatedAt"
)
VALUES (
  'release:p6-006-beta-v1',
  'project:p6-registry-beta',
  '1.0.0',
  1,
  'v1.0.0',
  'revision-p6-006-e2e',
  'production',
  'released',
  '{
    "id":"release:p6-006-beta-v1",
    "projectId":"project:p6-registry-beta",
    "version":"v1.0.0",
    "revision":"revision-p6-006-e2e",
    "environment":"production",
    "artifactSource":"github-actions:p6-006-e2e/deployment",
    "status":"released",
    "releasedAt":"2026-09-26T00:52:00Z",
    "gateEvidenceIds":["evidence:p6-006-release"],
    "rollbackPlan":"Restore revision-p6-006-previous and rerun health verification.",
    "notes":"Release history keeps exact artifact identity separate from Lessons Learned.",
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-26T00:52:00Z",
      "updatedAt":"2026-09-26T00:52:00Z"
    }
  }'::jsonb,
  '2026-09-26T00:52:00Z'::timestamptz,
  '2026-09-26T00:52:00Z'::timestamptz
);

INSERT INTO "LessonLearned" (
  "id","projectId","releaseId","schemaVersion","recordVersion","category",
  "document","createdAt","updatedAt"
)
VALUES (
  'lesson:p6-006-beta-release',
  'project:p6-registry-beta',
  'release:p6-006-beta-v1',
  '1.0.0',
  1,
  'operations',
  '{
    "id":"lesson:p6-006-beta-release",
    "projectId":"project:p6-registry-beta",
    "title":"Release evidence must match the shipped revision",
    "category":"operations",
    "observation":"A release record is trustworthy only when gate evidence targets the same exact revision.",
    "impact":"Prevents deployment history from overstating what was actually verified.",
    "action":"Keep PASS-linked exact-revision evidence mandatory for released artifacts.",
    "source":"blueprint-os:p6-006-e2e",
    "sourceRevision":"revision-p6-006-e2e",
    "releaseId":"release:p6-006-beta-v1",
    "linkedWorkPackageIds":["work-package:p6-beta-dashboard"],
    "meta":{
      "schemaVersion":"1.0.0",
      "recordVersion":1,
      "createdAt":"2026-09-26T00:53:00Z",
      "updatedAt":"2026-09-26T00:53:00Z"
    }
  }'::jsonb,
  '2026-09-26T00:53:00Z'::timestamptz,
  '2026-09-26T00:53:00Z'::timestamptz
);
