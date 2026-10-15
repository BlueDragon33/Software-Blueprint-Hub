-- P1: canonical, append-only workflow execution authority.
-- Stores only authenticated decisions and Ed25519 PUBLIC keys.
-- It grants neither Constitution ratification nor Quality Gate/Production authority.
BEGIN;

CREATE TABLE "WorkflowExecutionAdoptionDecision" (
  "id" VARCHAR(160) NOT NULL,
  "projectId" VARCHAR(160) NOT NULL,
  "workflowId" VARCHAR(80) NOT NULL,
  "workflowDigest" VARCHAR(80) NOT NULL,
  "policyVersion" VARCHAR(32) NOT NULL,
  "decision" VARCHAR(16) NOT NULL,
  "decidedByPrincipalId" VARCHAR(160) NOT NULL,
  "decidedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "productionReleaseAuthority" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "WorkflowExecutionAdoptionDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowExecutionAdoptionDecision_project_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkflowExecutionAdoptionDecision_decider_fkey"
    FOREIGN KEY ("decidedByPrincipalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkflowExecutionAdoptionDecision_decision_check"
    CHECK ("decision" IN ('adopt','revoke')),
  CONSTRAINT "WorkflowExecutionAdoptionDecision_digest_check"
    CHECK ("workflowDigest" ~ '^sha256:[0-9a-f]{64}$'),
  CONSTRAINT "WorkflowExecutionAdoptionDecision_no_production_check"
    CHECK ("productionReleaseAuthority" = false)
);

CREATE TABLE "WorkflowExecutionIssuerDecision" (
  "id" VARCHAR(160) NOT NULL,
  "projectId" VARCHAR(160) NOT NULL,
  "workflowId" VARCHAR(80) NOT NULL,
  "issuerId" VARCHAR(80) NOT NULL,
  "publicKeyPem" TEXT NOT NULL,
  "policyVersion" VARCHAR(32) NOT NULL,
  "decision" VARCHAR(16) NOT NULL,
  "decidedByPrincipalId" VARCHAR(160) NOT NULL,
  "decidedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "productionReleaseAuthority" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "WorkflowExecutionIssuerDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowExecutionIssuerDecision_project_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkflowExecutionIssuerDecision_decider_fkey"
    FOREIGN KEY ("decidedByPrincipalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkflowExecutionIssuerDecision_decision_check"
    CHECK ("decision" IN ('allow','revoke')),
  CONSTRAINT "WorkflowExecutionIssuerDecision_issuer_check"
    CHECK ("issuerId" ~ '^[a-z][a-z0-9-]{1,79}$'),
  CONSTRAINT "WorkflowExecutionIssuerDecision_no_production_check"
    CHECK ("productionReleaseAuthority" = false)
);

CREATE INDEX "WorkflowExecutionAdoptionDecision_project_workflow_digest_time_idx"
  ON "WorkflowExecutionAdoptionDecision"("projectId","workflowId","workflowDigest","decidedAt");
CREATE INDEX "WorkflowExecutionAdoptionDecision_decider_time_idx"
  ON "WorkflowExecutionAdoptionDecision"("decidedByPrincipalId","decidedAt");
CREATE INDEX "WorkflowExecutionIssuerDecision_project_workflow_issuer_time_idx"
  ON "WorkflowExecutionIssuerDecision"("projectId","workflowId","issuerId","decidedAt");
CREATE INDEX "WorkflowExecutionIssuerDecision_decider_time_idx"
  ON "WorkflowExecutionIssuerDecision"("decidedByPrincipalId","decidedAt");

CREATE FUNCTION "rejectWorkflowAuthorityMutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000',
    MESSAGE = 'Workflow execution authority is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "WorkflowExecutionAdoptionDecision_append_only"
BEFORE UPDATE OR DELETE ON "WorkflowExecutionAdoptionDecision"
FOR EACH ROW EXECUTE FUNCTION "rejectWorkflowAuthorityMutation"();

CREATE TRIGGER "WorkflowExecutionIssuerDecision_append_only"
BEFORE UPDATE OR DELETE ON "WorkflowExecutionIssuerDecision"
FOR EACH ROW EXECUTE FUNCTION "rejectWorkflowAuthorityMutation"();

CREATE TRIGGER "WorkflowExecutionAdoptionDecision_no_truncate"
BEFORE TRUNCATE ON "WorkflowExecutionAdoptionDecision"
FOR EACH STATEMENT EXECUTE FUNCTION "rejectWorkflowAuthorityMutation"();

CREATE TRIGGER "WorkflowExecutionIssuerDecision_no_truncate"
BEFORE TRUNCATE ON "WorkflowExecutionIssuerDecision"
FOR EACH STATEMENT EXECUTE FUNCTION "rejectWorkflowAuthorityMutation"();

COMMIT;
