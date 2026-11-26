-- P1 schema candidate; derived from 14 pinned PostgreSQL migrations. No DROP or data reset.
CREATE TABLE "Project" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectProfile" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "schemaVersion" TEXT NOT NULL CHECK (length("schemaVersion")<=32),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "ProjectProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectProfile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Principal" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "provider" TEXT NOT NULL CHECK (length("provider")<=80),
  "providerSubject" TEXT NOT NULL CHECK (length("providerSubject")<=255),
  "email" TEXT CHECK (length("email")<=320),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "Principal_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SystemBootstrap" (
  "id" TEXT NOT NULL DEFAULT 'system' CHECK (length("id")<=32),
  "ownerPrincipalId" TEXT NOT NULL CHECK (length("ownerPrincipalId")<=160),
  "initializedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("initializedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"initializedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"initializedAt")="initializedAt"),
  CONSTRAINT "SystemBootstrap_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SystemBootstrap_ownerPrincipalId_fkey" FOREIGN KEY ("ownerPrincipalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ProjectAuthority" (
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "principalId" TEXT NOT NULL CHECK (length("principalId")<=160),
  "role" TEXT NOT NULL CHECK (length("role")<=32),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "ProjectAuthority_pkey" PRIMARY KEY ("projectId", "principalId"),
  CONSTRAINT "ProjectAuthority_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectAuthority_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "AuthorityAuditEvent" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "actorPrincipalId" TEXT NOT NULL CHECK (length("actorPrincipalId")<=160),
  "targetPrincipalId" TEXT CHECK (length("targetPrincipalId")<=160),
  "projectId" TEXT CHECK (length("projectId")<=160),
  "action" TEXT NOT NULL CHECK (length("action")<=80),
  "detail" TEXT CHECK (json_valid("detail")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "AuthorityAuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthorityAuditEvent_actorPrincipalId_fkey" FOREIGN KEY ("actorPrincipalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AuthorityAuditEvent_targetPrincipalId_fkey" FOREIGN KEY ("targetPrincipalId") REFERENCES "Principal"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "WorkPackage" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "schemaVersion" TEXT NOT NULL CHECK (length("schemaVersion")<=32),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "status" TEXT NOT NULL CHECK (length("status")<=32),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "WorkPackage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkPackage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "QualityGate" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "schemaVersion" TEXT NOT NULL CHECK (length("schemaVersion")<=32),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "status" TEXT NOT NULL CHECK (length("status")<=32),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "QualityGate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QualityGate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "GateEvidence" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "gateId" TEXT NOT NULL CHECK (length("gateId")<=160),
  "kind" TEXT NOT NULL CHECK (length("kind")<=32),
  "source" TEXT NOT NULL CHECK (length("source")<=500),
  "revision" TEXT NOT NULL CHECK (length("revision")<=160),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "GateEvidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GateEvidence_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "QualityGate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "ArchitectureDecision" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "schemaVersion" TEXT NOT NULL CHECK (length("schemaVersion")<=32),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "status" TEXT NOT NULL CHECK (length("status")<=32),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "ArchitectureDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ArchitectureDecision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Risk" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "schemaVersion" TEXT NOT NULL CHECK (length("schemaVersion")<=32),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "likelihood" TEXT NOT NULL CHECK (length("likelihood")<=16),
  "impact" TEXT NOT NULL CHECK (length("impact")<=16),
  "status" TEXT NOT NULL CHECK (length("status")<=32),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "Risk_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "TechnicalDebt" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "schemaVersion" TEXT NOT NULL CHECK (length("schemaVersion")<=32),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "severity" TEXT NOT NULL CHECK (length("severity")<=16),
  "status" TEXT NOT NULL CHECK (length("status")<=32),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "TechnicalDebt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TechnicalDebt_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "ReleaseRecord" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "schemaVersion" TEXT NOT NULL CHECK (length("schemaVersion")<=32),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "version" TEXT NOT NULL CHECK (length("version")<=120),
  "revision" TEXT NOT NULL CHECK (length("revision")<=160),
  "environment" TEXT NOT NULL CHECK (length("environment")<=120),
  "status" TEXT NOT NULL CHECK (length("status")<=32),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "ReleaseRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReleaseRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "LessonLearned" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "releaseId" TEXT CHECK (length("releaseId")<=160),
  "schemaVersion" TEXT NOT NULL CHECK (length("schemaVersion")<=32),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "category" TEXT NOT NULL CHECK (length("category")<=32),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "LessonLearned_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonLearned_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LessonLearned_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "ReleaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "PromptProjectionSnapshot" (
  "snapshotKey" TEXT NOT NULL CHECK (length("snapshotKey")<=255),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "projectionId" TEXT NOT NULL CHECK (length("projectionId")<=160),
  "sourceRevision" TEXT NOT NULL CHECK (length("sourceRevision")<=160),
  "templateVersion" TEXT NOT NULL CHECK (length("templateVersion")<=120),
  "contentHash" TEXT NOT NULL CHECK (length("contentHash")<=160),
  "generatedAt" TEXT NOT NULL CHECK (length("generatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"generatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"generatedAt")="generatedAt"),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "PromptProjectionSnapshot_pkey" PRIMARY KEY ("snapshotKey"),
  CONSTRAINT "PromptProjectionSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "HumanProfessionalReviewDecision" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "reviewerActorId" TEXT NOT NULL CHECK (length("reviewerActorId")<=160),
  "source" TEXT NOT NULL CHECK (length("source")<=80),
  "decision" TEXT NOT NULL CHECK (length("decision")<=32),
  "decidedAt" TEXT NOT NULL CHECK (length("decidedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"decidedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"decidedAt")="decidedAt"),
  "note" TEXT NOT NULL,
  "candidateReviewedRevision" TEXT NOT NULL CHECK (length("candidateReviewedRevision")<=160),
  "candidateEvidenceDigest" TEXT NOT NULL CHECK (length("candidateEvidenceDigest")<=160),
  "acknowledgedFindingIds" TEXT NOT NULL CHECK (json_valid("acknowledgedFindingIds")),
  "humanSignoff" INTEGER NOT NULL CHECK ("humanSignoff" IN (0,1)),
  "p9020TransitionAllowed" INTEGER NOT NULL CHECK ("p9020TransitionAllowed" IN (0,1)),
  "productionReleaseAuthority" INTEGER NOT NULL DEFAULT 0 CHECK ("productionReleaseAuthority" IN (0,1) AND "productionReleaseAuthority"=0),
  "blockers" TEXT NOT NULL CHECK (json_valid("blockers")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "HumanProfessionalReviewDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HumanProfessionalReviewDecision_reviewerActorId_fkey" FOREIGN KEY ("reviewerActorId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ConstitutionAmendment" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "schemaVersion" TEXT NOT NULL CHECK (length("schemaVersion")<=32),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "basePolicyVersion" TEXT NOT NULL CHECK (length("basePolicyVersion")<=80),
  "targetPolicyVersion" TEXT NOT NULL CHECK (length("targetPolicyVersion")<=80),
  "title" TEXT NOT NULL CHECK (length("title")<=240),
  "state" TEXT NOT NULL CHECK (length("state")<=40),
  "proposedByActorId" TEXT NOT NULL CHECK (length("proposedByActorId")<=160),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  "updatedAt" TEXT NOT NULL CHECK (length("updatedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"updatedAt")="updatedAt"),
  CONSTRAINT "ConstitutionAmendment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConstitutionAmendment_proposedByActorId_fkey" FOREIGN KEY ("proposedByActorId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ConstitutionAmendmentRevision" (
  "id" TEXT NOT NULL CHECK (length("id")<=200),
  "amendmentId" TEXT NOT NULL CHECK (length("amendmentId")<=160),
  "recordVersion" INTEGER NOT NULL CHECK (typeof("recordVersion")='integer'),
  "state" TEXT NOT NULL CHECK (length("state")<=40),
  "actorPrincipalId" TEXT NOT NULL CHECK (length("actorPrincipalId")<=160),
  "action" TEXT NOT NULL CHECK (length("action")<=80),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "ConstitutionAmendmentRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConstitutionAmendmentRevision_amendmentId_fkey" FOREIGN KEY ("amendmentId") REFERENCES "ConstitutionAmendment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConstitutionAmendmentRevision_actorPrincipalId_fkey" FOREIGN KEY ("actorPrincipalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ConstitutionEvidence" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "amendmentId" TEXT NOT NULL CHECK (length("amendmentId")<=160),
  "kind" TEXT NOT NULL CHECK (length("kind")<=32),
  "source" TEXT NOT NULL CHECK (length("source")<=500),
  "revision" TEXT NOT NULL CHECK (length("revision")<=160),
  "digest" TEXT NOT NULL CHECK (length("digest")<=160),
  "note" TEXT NOT NULL,
  "recordedByActorId" TEXT NOT NULL CHECK (length("recordedByActorId")<=160),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "ConstitutionEvidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConstitutionEvidence_amendmentId_fkey" FOREIGN KEY ("amendmentId") REFERENCES "ConstitutionAmendment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConstitutionEvidence_recordedByActorId_fkey" FOREIGN KEY ("recordedByActorId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ConstitutionRatificationDecision" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "amendmentId" TEXT NOT NULL CHECK (length("amendmentId")<=160),
  "amendmentRecordVersion" INTEGER NOT NULL CHECK (typeof("amendmentRecordVersion")='integer'),
  "reviewerActorId" TEXT NOT NULL CHECK (length("reviewerActorId")<=160),
  "source" TEXT NOT NULL CHECK (length("source")<=80),
  "decision" TEXT NOT NULL CHECK (length("decision")<=24),
  "note" TEXT NOT NULL,
  "decidedAt" TEXT NOT NULL CHECK (length("decidedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"decidedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"decidedAt")="decidedAt"),
  "humanRatification" INTEGER NOT NULL CHECK ("humanRatification" IN (0,1)),
  "productionReleaseAuthority" INTEGER NOT NULL DEFAULT 0 CHECK ("productionReleaseAuthority" IN (0,1) AND "productionReleaseAuthority"=0),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "ConstitutionRatificationDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConstitutionRatificationDecision_amendmentId_fkey" FOREIGN KEY ("amendmentId") REFERENCES "ConstitutionAmendment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConstitutionRatificationDecision_reviewerActorId_fkey" FOREIGN KEY ("reviewerActorId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "ConstitutionPublication" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "amendmentId" TEXT NOT NULL CHECK (length("amendmentId")<=160),
  "amendmentRecordVersion" INTEGER NOT NULL CHECK (typeof("amendmentRecordVersion")='integer'),
  "policyVersion" TEXT NOT NULL CHECK (length("policyVersion")<=80),
  "publishedByActorId" TEXT NOT NULL CHECK (length("publishedByActorId")<=160),
  "sourceRevision" TEXT NOT NULL CHECK (length("sourceRevision")<=160),
  "ciRunId" TEXT NOT NULL CHECK (length("ciRunId")<=120),
  "authoritySetDigest" TEXT NOT NULL CHECK (length("authoritySetDigest")<=160),
  "productionReleaseAuthority" INTEGER NOT NULL DEFAULT 0 CHECK ("productionReleaseAuthority" IN (0,1) AND "productionReleaseAuthority"=0),
  "document" TEXT NOT NULL CHECK (json_valid("document")),
  "publishedAt" TEXT NOT NULL CHECK (length("publishedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"publishedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"publishedAt")="publishedAt"),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "ConstitutionPublication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConstitutionPublication_amendmentId_fkey" FOREIGN KEY ("amendmentId") REFERENCES "ConstitutionAmendment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ConstitutionPublication_publishedByActorId_fkey" FOREIGN KEY ("publishedByActorId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "WorkflowExecutionClaim" (
  "requestId" TEXT NOT NULL CHECK (length("requestId")<=80),
  "expiresAt" TEXT NOT NULL CHECK (length("expiresAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"expiresAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"expiresAt")="expiresAt"),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "WorkflowExecutionClaim_pkey" PRIMARY KEY ("requestId"),
  CONSTRAINT "WorkflowExecutionClaim_expiry_check" CHECK ("expiresAt" > "createdAt")
);
CREATE TABLE "WorkflowExecutionObservation" (
  "requestId" TEXT NOT NULL CHECK (length("requestId")<=80),
  "attempt" INTEGER NOT NULL CHECK (typeof("attempt")='integer'),
  "outcome" TEXT NOT NULL CHECK (length("outcome")<=24),
  "observationDigest" TEXT CHECK (length("observationDigest")<=80),
  "evidenceReferences" TEXT NOT NULL CHECK (json_valid("evidenceReferences")),
  "filesTouched" TEXT NOT NULL CHECK (json_valid("filesTouched")),
  "tokensUsed" INTEGER NOT NULL CHECK (typeof("tokensUsed")='integer'),
  "createdAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("createdAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"createdAt")="createdAt"),
  CONSTRAINT "WorkflowExecutionObservation_pkey" PRIMARY KEY ("requestId", "attempt"),
  CONSTRAINT "WorkflowExecutionObservation_attempt_check" CHECK ("attempt" BETWEEN 1 AND 5),
  CONSTRAINT "WorkflowExecutionObservation_tokens_check" CHECK ("tokensUsed" >= 0),
  CONSTRAINT "WorkflowExecutionObservation_outcome_check" CHECK ("outcome" IN ('succeeded', 'failed', 'invalid-result', 'runner-error')),
  CONSTRAINT "WorkflowExecutionObservation_digest_check" CHECK ("observationDigest" IS NULL OR (length("observationDigest")=71 AND substr("observationDigest",1,7)='sha256:' AND substr("observationDigest",8) NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "WorkflowExecutionObservation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkflowExecutionClaim"("requestId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "AppManagementSsoLink" (
  "issuer" TEXT NOT NULL CHECK (length("issuer")<=120),
  "subject" TEXT NOT NULL CHECK (length("subject")<=320),
  "principalId" TEXT NOT NULL CHECK (length("principalId")<=160),
  "linkedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("linkedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"linkedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"linkedAt")="linkedAt"),
  "revokedAt" TEXT CHECK ("revokedAt" IS NULL OR (length("revokedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"revokedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"revokedAt")="revokedAt")),
  CONSTRAINT "AppManagementSsoLink_pkey" PRIMARY KEY ("issuer","subject"),
  CONSTRAINT "AppManagementSsoLink_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "WorkflowExecutionQaVerification" (
  "requestId" TEXT NOT NULL CHECK (length("requestId")<=80),
  "attempt" INTEGER NOT NULL CHECK (typeof("attempt")='integer'),
  "observationDigest" TEXT NOT NULL CHECK (length("observationDigest")<=80),
  "sourceRevision" TEXT NOT NULL CHECK (length("sourceRevision")<=40),
  "verifierId" TEXT NOT NULL CHECK (length("verifierId")<=80),
  "verifiedFiles" INTEGER NOT NULL CHECK (typeof("verifiedFiles")='integer'),
  "verifiedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("verifiedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"verifiedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"verifiedAt")="verifiedAt"),
  CONSTRAINT "WorkflowExecutionQaVerification_pkey" PRIMARY KEY ("requestId", "attempt"),
  CONSTRAINT "WorkflowExecutionQaVerification_attempt_check" CHECK ("attempt" BETWEEN 1 AND 5),
  CONSTRAINT "WorkflowExecutionQaVerification_digest_check" CHECK ((length("observationDigest")=71 AND substr("observationDigest",1,7)='sha256:' AND substr("observationDigest",8) NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "WorkflowExecutionQaVerification_revision_check" CHECK ((length("sourceRevision")=40 AND substr("sourceRevision",1) NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "WorkflowExecutionQaVerification_verifier_check" CHECK ("verifierId" = 'pinned-independent-github-readback-v1'),
  CONSTRAINT "WorkflowExecutionQaVerification_count_check" CHECK ("verifiedFiles" BETWEEN 1 AND 30),
  CONSTRAINT "WorkflowExecutionQaVerification_requestId_attempt_fkey" FOREIGN KEY ("requestId", "attempt") REFERENCES "WorkflowExecutionObservation"("requestId", "attempt") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "WorkflowExecutionAdoptionDecision" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "workflowId" TEXT NOT NULL CHECK (length("workflowId")<=80),
  "workflowDigest" TEXT NOT NULL CHECK (length("workflowDigest")<=80),
  "policyVersion" TEXT NOT NULL CHECK (length("policyVersion")<=32),
  "decision" TEXT NOT NULL CHECK (length("decision")<=16),
  "decidedByPrincipalId" TEXT NOT NULL CHECK (length("decidedByPrincipalId")<=160),
  "decidedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("decidedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"decidedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"decidedAt")="decidedAt"),
  "productionReleaseAuthority" INTEGER NOT NULL DEFAULT 0 CHECK ("productionReleaseAuthority" IN (0,1) AND "productionReleaseAuthority"=0),
  CONSTRAINT "WorkflowExecutionAdoptionDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowExecutionAdoptionDecision_project_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkflowExecutionAdoptionDecision_decider_fkey" FOREIGN KEY ("decidedByPrincipalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkflowExecutionAdoptionDecision_decision_check" CHECK ("decision" IN ('adopt','revoke')),
  CONSTRAINT "WorkflowExecutionAdoptionDecision_digest_check" CHECK ((length("workflowDigest")=71 AND substr("workflowDigest",1,7)='sha256:' AND substr("workflowDigest",8) NOT GLOB '*[^0-9a-f]*')),
  CONSTRAINT "WorkflowExecutionAdoptionDecision_no_production_check" CHECK ("productionReleaseAuthority" = 0)
);
CREATE TABLE "WorkflowExecutionIssuerDecision" (
  "id" TEXT NOT NULL CHECK (length("id")<=160),
  "projectId" TEXT NOT NULL CHECK (length("projectId")<=160),
  "workflowId" TEXT NOT NULL CHECK (length("workflowId")<=80),
  "issuerId" TEXT NOT NULL CHECK (length("issuerId")<=80),
  "publicKeyPem" TEXT NOT NULL,
  "policyVersion" TEXT NOT NULL CHECK (length("policyVersion")<=32),
  "decision" TEXT NOT NULL CHECK (length("decision")<=16),
  "decidedByPrincipalId" TEXT NOT NULL CHECK (length("decidedByPrincipalId")<=160),
  "decidedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) CHECK (length("decidedAt")=24 AND strftime('%Y-%m-%dT%H:%M:%fZ',"decidedAt") IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',"decidedAt")="decidedAt"),
  "productionReleaseAuthority" INTEGER NOT NULL DEFAULT 0 CHECK ("productionReleaseAuthority" IN (0,1) AND "productionReleaseAuthority"=0),
  CONSTRAINT "WorkflowExecutionIssuerDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowExecutionIssuerDecision_project_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkflowExecutionIssuerDecision_decider_fkey" FOREIGN KEY ("decidedByPrincipalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkflowExecutionIssuerDecision_decision_check" CHECK ("decision" IN ('allow','revoke')),
  CONSTRAINT "WorkflowExecutionIssuerDecision_issuer_check" CHECK ((length("issuerId") BETWEEN 2 AND 80 AND substr("issuerId",1,1) GLOB '[a-z]' AND "issuerId" NOT GLOB '*[^a-z0-9-]*')),
  CONSTRAINT "WorkflowExecutionIssuerDecision_no_production_check" CHECK ("productionReleaseAuthority" = 0)
);
CREATE UNIQUE INDEX "ProjectProfile_projectId_key" ON "ProjectProfile"("projectId");
CREATE INDEX "ProjectProfile_projectId_recordVersion_idx" ON "ProjectProfile"("projectId", "recordVersion");
CREATE UNIQUE INDEX "Principal_provider_providerSubject_key" ON "Principal"("provider", "providerSubject");
CREATE UNIQUE INDEX "SystemBootstrap_ownerPrincipalId_key" ON "SystemBootstrap"("ownerPrincipalId");
CREATE INDEX "ProjectAuthority_principalId_role_idx" ON "ProjectAuthority"("principalId", "role");
CREATE INDEX "AuthorityAuditEvent_projectId_createdAt_idx" ON "AuthorityAuditEvent"("projectId", "createdAt");
CREATE INDEX "AuthorityAuditEvent_actorPrincipalId_createdAt_idx" ON "AuthorityAuditEvent"("actorPrincipalId", "createdAt");
CREATE INDEX "WorkPackage_projectId_status_idx" ON "WorkPackage"("projectId", "status");
CREATE INDEX "WorkPackage_projectId_recordVersion_idx" ON "WorkPackage"("projectId", "recordVersion");
CREATE INDEX "QualityGate_projectId_status_idx" ON "QualityGate"("projectId", "status");
CREATE INDEX "QualityGate_projectId_recordVersion_idx" ON "QualityGate"("projectId", "recordVersion");
CREATE INDEX "GateEvidence_gateId_createdAt_idx" ON "GateEvidence"("gateId", "createdAt");
CREATE INDEX "GateEvidence_source_revision_idx" ON "GateEvidence"("source", "revision");
CREATE INDEX "ArchitectureDecision_projectId_status_idx" ON "ArchitectureDecision"("projectId", "status");
CREATE INDEX "ArchitectureDecision_projectId_recordVersion_idx" ON "ArchitectureDecision"("projectId", "recordVersion");
CREATE INDEX "Risk_projectId_status_idx" ON "Risk"("projectId", "status");
CREATE INDEX "Risk_projectId_likelihood_impact_idx" ON "Risk"("projectId", "likelihood", "impact");
CREATE INDEX "Risk_projectId_recordVersion_idx" ON "Risk"("projectId", "recordVersion");
CREATE INDEX "TechnicalDebt_projectId_status_idx" ON "TechnicalDebt"("projectId", "status");
CREATE INDEX "TechnicalDebt_projectId_severity_idx" ON "TechnicalDebt"("projectId", "severity");
CREATE INDEX "TechnicalDebt_projectId_recordVersion_idx" ON "TechnicalDebt"("projectId", "recordVersion");
CREATE INDEX "ReleaseRecord_projectId_status_idx" ON "ReleaseRecord"("projectId", "status");
CREATE INDEX "ReleaseRecord_projectId_revision_idx" ON "ReleaseRecord"("projectId", "revision");
CREATE INDEX "ReleaseRecord_projectId_recordVersion_idx" ON "ReleaseRecord"("projectId", "recordVersion");
CREATE INDEX "LessonLearned_projectId_category_idx" ON "LessonLearned"("projectId", "category");
CREATE INDEX "LessonLearned_projectId_recordVersion_idx" ON "LessonLearned"("projectId", "recordVersion");
CREATE INDEX "LessonLearned_releaseId_idx" ON "LessonLearned"("releaseId");
CREATE INDEX "PromptProjectionSnapshot_projectId_generatedAt_idx" ON "PromptProjectionSnapshot"("projectId", "generatedAt");
CREATE INDEX "PromptProjectionSnapshot_projectId_sourceRevision_idx" ON "PromptProjectionSnapshot"("projectId", "sourceRevision");
CREATE INDEX "PromptProjectionSnapshot_projectId_contentHash_idx" ON "PromptProjectionSnapshot"("projectId", "contentHash");
CREATE UNIQUE INDEX "HumanProfessionalReviewDecision_project_candidate_key" ON "HumanProfessionalReviewDecision"( "projectId", "candidateReviewedRevision", "candidateEvidenceDigest" );
CREATE INDEX "HumanProfessionalReviewDecision_reviewer_decided_idx" ON "HumanProfessionalReviewDecision"("reviewerActorId", "decidedAt");
CREATE INDEX "HumanProfessionalReviewDecision_project_decided_idx" ON "HumanProfessionalReviewDecision"("projectId", "decidedAt");
CREATE INDEX "ConstitutionAmendment_state_updatedAt_idx" ON "ConstitutionAmendment"("state", "updatedAt");
CREATE INDEX "ConstitutionAmendment_targetPolicyVersion_idx" ON "ConstitutionAmendment"("targetPolicyVersion");
CREATE INDEX "ConstitutionAmendment_proposedByActorId_updatedAt_idx" ON "ConstitutionAmendment"("proposedByActorId", "updatedAt");
CREATE UNIQUE INDEX "ConstitutionAmendmentRevision_amendmentId_recordVersion_key" ON "ConstitutionAmendmentRevision"("amendmentId", "recordVersion");
CREATE INDEX "ConstitutionAmendmentRevision_amendmentId_createdAt_idx" ON "ConstitutionAmendmentRevision"("amendmentId", "createdAt");
CREATE INDEX "ConstitutionAmendmentRevision_actorPrincipalId_createdAt_idx" ON "ConstitutionAmendmentRevision"("actorPrincipalId", "createdAt");
CREATE INDEX "ConstitutionEvidence_amendmentId_kind_createdAt_idx" ON "ConstitutionEvidence"("amendmentId", "kind", "createdAt");
CREATE INDEX "ConstitutionEvidence_source_revision_idx" ON "ConstitutionEvidence"("source", "revision");
CREATE INDEX "ConstitutionEvidence_recordedByActorId_createdAt_idx" ON "ConstitutionEvidence"("recordedByActorId", "createdAt");
CREATE UNIQUE INDEX "ConstitutionRatificationDecision_amendmentId_amendmentRecordVersion_key" ON "ConstitutionRatificationDecision"("amendmentId", "amendmentRecordVersion");
CREATE INDEX "ConstitutionRatificationDecision_reviewerActorId_decidedAt_idx" ON "ConstitutionRatificationDecision"("reviewerActorId", "decidedAt");
CREATE INDEX "ConstitutionRatificationDecision_amendmentId_decidedAt_idx" ON "ConstitutionRatificationDecision"("amendmentId", "decidedAt");
CREATE UNIQUE INDEX "ConstitutionPublication_amendmentId_key" ON "ConstitutionPublication"("amendmentId");
CREATE UNIQUE INDEX "ConstitutionPublication_policyVersion_key" ON "ConstitutionPublication"("policyVersion");
CREATE INDEX "ConstitutionPublication_sourceRevision_idx" ON "ConstitutionPublication"("sourceRevision");
CREATE INDEX "ConstitutionPublication_publishedByActorId_publishedAt_idx" ON "ConstitutionPublication"("publishedByActorId", "publishedAt");
CREATE INDEX "ConstitutionPublication_authoritySetDigest_idx" ON "ConstitutionPublication"("authoritySetDigest");
CREATE INDEX "WorkflowExecutionClaim_createdAt_idx" ON "WorkflowExecutionClaim"("createdAt");
CREATE INDEX "WorkflowExecutionObservation_createdAt_idx" ON "WorkflowExecutionObservation"("createdAt");
CREATE UNIQUE INDEX "AppManagementSsoLink_issuer_principalId_key" ON "AppManagementSsoLink"("issuer","principalId");
CREATE INDEX "AppManagementSsoLink_principalId_idx" ON "AppManagementSsoLink"("principalId");
CREATE INDEX "WorkflowExecutionQaVerification_verifiedAt_idx" ON "WorkflowExecutionQaVerification"("verifiedAt");
CREATE INDEX "WorkflowExecutionAdoptionDecision_project_workflow_digest_time_idx" ON "WorkflowExecutionAdoptionDecision"("projectId","workflowId","workflowDigest","decidedAt");
CREATE INDEX "WorkflowExecutionAdoptionDecision_decider_time_idx" ON "WorkflowExecutionAdoptionDecision"("decidedByPrincipalId","decidedAt");
CREATE INDEX "WorkflowExecutionIssuerDecision_project_workflow_issuer_time_idx" ON "WorkflowExecutionIssuerDecision"("projectId","workflowId","issuerId","decidedAt");
CREATE INDEX "WorkflowExecutionIssuerDecision_decider_time_idx" ON "WorkflowExecutionIssuerDecision"("decidedByPrincipalId","decidedAt");
CREATE TABLE blueprint_atomic_guard (id INTEGER PRIMARY KEY CHECK(id=1), ok INTEGER NOT NULL CHECK(ok=1));
CREATE TRIGGER "WorkflowExecutionQaVerification_match_observation" BEFORE INSERT ON "WorkflowExecutionQaVerification" WHEN NOT EXISTS (SELECT 1 FROM "WorkflowExecutionObservation" o WHERE o."requestId"=NEW."requestId" AND o."attempt"=NEW."attempt" AND o."outcome"='succeeded' AND o."observationDigest"=NEW."observationDigest" AND o."tokensUsed"=0 AND json_type(o."filesTouched")='array' AND json_array_length(o."filesTouched")=0) BEGIN SELECT RAISE(ABORT,'QA requires matching successful read-only observation'); END;
CREATE TRIGGER "WorkflowExecutionClaim_no_update" BEFORE UPDATE ON "WorkflowExecutionClaim" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionClaim_no_delete" BEFORE DELETE ON "WorkflowExecutionClaim" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionClaim_no_replace" BEFORE INSERT ON "WorkflowExecutionClaim" WHEN EXISTS(SELECT 1 FROM "WorkflowExecutionClaim" WHERE "requestId"=NEW."requestId") BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
CREATE TRIGGER "WorkflowExecutionObservation_no_update" BEFORE UPDATE ON "WorkflowExecutionObservation" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionObservation_no_delete" BEFORE DELETE ON "WorkflowExecutionObservation" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionObservation_no_replace" BEFORE INSERT ON "WorkflowExecutionObservation" WHEN EXISTS(SELECT 1 FROM "WorkflowExecutionObservation" WHERE "requestId"=NEW."requestId" AND "attempt"=NEW."attempt") BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
CREATE TRIGGER "WorkflowExecutionQaVerification_no_update" BEFORE UPDATE ON "WorkflowExecutionQaVerification" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionQaVerification_no_delete" BEFORE DELETE ON "WorkflowExecutionQaVerification" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionQaVerification_no_replace" BEFORE INSERT ON "WorkflowExecutionQaVerification" WHEN EXISTS(SELECT 1 FROM "WorkflowExecutionQaVerification" WHERE "requestId"=NEW."requestId" AND "attempt"=NEW."attempt") BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
CREATE TRIGGER "WorkflowExecutionAdoptionDecision_no_update" BEFORE UPDATE ON "WorkflowExecutionAdoptionDecision" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionAdoptionDecision_no_delete" BEFORE DELETE ON "WorkflowExecutionAdoptionDecision" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionAdoptionDecision_no_replace" BEFORE INSERT ON "WorkflowExecutionAdoptionDecision" WHEN EXISTS(SELECT 1 FROM "WorkflowExecutionAdoptionDecision" WHERE "id"=NEW."id") BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
CREATE TRIGGER "WorkflowExecutionIssuerDecision_no_update" BEFORE UPDATE ON "WorkflowExecutionIssuerDecision" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionIssuerDecision_no_delete" BEFORE DELETE ON "WorkflowExecutionIssuerDecision" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "WorkflowExecutionIssuerDecision_no_replace" BEFORE INSERT ON "WorkflowExecutionIssuerDecision" WHEN EXISTS(SELECT 1 FROM "WorkflowExecutionIssuerDecision" WHERE "id"=NEW."id") BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
CREATE TRIGGER "ConstitutionAmendmentRevision_no_update" BEFORE UPDATE ON "ConstitutionAmendmentRevision" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "ConstitutionAmendmentRevision_no_delete" BEFORE DELETE ON "ConstitutionAmendmentRevision" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "ConstitutionAmendmentRevision_no_replace" BEFORE INSERT ON "ConstitutionAmendmentRevision" WHEN EXISTS(SELECT 1 FROM "ConstitutionAmendmentRevision" WHERE "id"=NEW."id" OR ("amendmentId"=NEW."amendmentId" AND "recordVersion"=NEW."recordVersion")) BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
CREATE TRIGGER "ConstitutionEvidence_no_update" BEFORE UPDATE ON "ConstitutionEvidence" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "ConstitutionEvidence_no_delete" BEFORE DELETE ON "ConstitutionEvidence" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "ConstitutionEvidence_no_replace" BEFORE INSERT ON "ConstitutionEvidence" WHEN EXISTS(SELECT 1 FROM "ConstitutionEvidence" WHERE "id"=NEW."id") BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
CREATE TRIGGER "ConstitutionRatificationDecision_no_update" BEFORE UPDATE ON "ConstitutionRatificationDecision" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "ConstitutionRatificationDecision_no_delete" BEFORE DELETE ON "ConstitutionRatificationDecision" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "ConstitutionRatificationDecision_no_replace" BEFORE INSERT ON "ConstitutionRatificationDecision" WHEN EXISTS(SELECT 1 FROM "ConstitutionRatificationDecision" WHERE "id"=NEW."id" OR ("amendmentId"=NEW."amendmentId" AND "amendmentRecordVersion"=NEW."amendmentRecordVersion")) BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
CREATE TRIGGER "ConstitutionPublication_no_update" BEFORE UPDATE ON "ConstitutionPublication" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "ConstitutionPublication_no_delete" BEFORE DELETE ON "ConstitutionPublication" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "ConstitutionPublication_no_replace" BEFORE INSERT ON "ConstitutionPublication" WHEN EXISTS(SELECT 1 FROM "ConstitutionPublication" WHERE "id"=NEW."id" OR "amendmentId"=NEW."amendmentId" OR "policyVersion"=NEW."policyVersion") BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
CREATE TRIGGER "AuthorityAuditEvent_no_update" BEFORE UPDATE ON "AuthorityAuditEvent" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "AuthorityAuditEvent_no_delete" BEFORE DELETE ON "AuthorityAuditEvent" BEGIN SELECT RAISE(ABORT,'append-only record'); END;
CREATE TRIGGER "AuthorityAuditEvent_no_replace" BEFORE INSERT ON "AuthorityAuditEvent" WHEN EXISTS(SELECT 1 FROM "AuthorityAuditEvent" WHERE "id"=NEW."id") BEGIN SELECT RAISE(ABORT,'append-only duplicate'); END;
