-- Candidate P2: durable WorkPackage ↔ adopted workflow / exact-app-SHA mapping.
-- Append-only binding decisions are NOT authorization to execute or release.
BEGIN;

CREATE TABLE "NextActionWorkBindingDecision" (
  "id" VARCHAR(160) NOT NULL,
  "projectId" VARCHAR(160) NOT NULL,
  "workPackageId" VARCHAR(160) NOT NULL,
  "workPackageRecordVersion" INTEGER NOT NULL,
  "workflowId" VARCHAR(80) NOT NULL,
  "workflowDigest" VARCHAR(80) NOT NULL,
  "appHead" VARCHAR(40) NOT NULL,
  "policyVersion" VARCHAR(32) NOT NULL,
  "decision" VARCHAR(16) NOT NULL,
  "decidedByPrincipalId" VARCHAR(160) NOT NULL,
  "decidedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "productionReleaseAuthority" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "NextActionWorkBindingDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NextActionWorkBindingDecision_project_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "NextActionWorkBindingDecision_workPackage_fkey" FOREIGN KEY ("workPackageId")
    REFERENCES "WorkPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "NextActionWorkBindingDecision_decider_fkey" FOREIGN KEY ("decidedByPrincipalId")
    REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "NextActionWorkBindingDecision_version_check" CHECK ("workPackageRecordVersion" >= 1),
  CONSTRAINT "NextActionWorkBindingDecision_digest_check" CHECK ("workflowDigest" ~ '^sha256:[0-9a-f]{64}$'),
  CONSTRAINT "NextActionWorkBindingDecision_sha_check" CHECK ("appHead" ~ '^[0-9a-f]{40}$'),
  CONSTRAINT "NextActionWorkBindingDecision_decision_check" CHECK ("decision" IN ('bind','revoke')),
  CONSTRAINT "NextActionWorkBindingDecision_no_production_check" CHECK ("productionReleaseAuthority" = false)
);

CREATE INDEX "NextActionWorkBindingDecision_project_work_time_idx"
  ON "NextActionWorkBindingDecision"("projectId", "workPackageId", "decidedAt");
CREATE INDEX "NextActionWorkBindingDecision_project_workflow_digest_idx"
  ON "NextActionWorkBindingDecision"("projectId", "workflowId", "workflowDigest");

CREATE FUNCTION "rejectNextActionBindingMutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000', MESSAGE = 'Next Action Work binding decisions are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "NextActionWorkBindingDecision_append_only"
BEFORE UPDATE OR DELETE ON "NextActionWorkBindingDecision"
FOR EACH ROW EXECUTE FUNCTION "rejectNextActionBindingMutation"();

CREATE TRIGGER "NextActionWorkBindingDecision_no_truncate"
BEFORE TRUNCATE ON "NextActionWorkBindingDecision"
FOR EACH STATEMENT EXECUTE FUNCTION "rejectNextActionBindingMutation"();

COMMIT;
