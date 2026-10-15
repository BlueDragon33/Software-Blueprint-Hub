-- Immutable independent QA observation for a prior durable workflow attempt.
-- This stores observed byte agreement ONLY, not a Quality Gate, receipt,
-- constitutional grant or Production release decision.

CREATE TABLE "WorkflowExecutionQaVerification" (
  "requestId" VARCHAR(80) NOT NULL,
  "attempt" INTEGER NOT NULL,
  "observationDigest" VARCHAR(80) NOT NULL,
  "sourceRevision" VARCHAR(40) NOT NULL,
  "verifierId" VARCHAR(80) NOT NULL,
  "verifiedFiles" INTEGER NOT NULL,
  "verifiedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkflowExecutionQaVerification_pkey" PRIMARY KEY ("requestId", "attempt"),
  CONSTRAINT "WorkflowExecutionQaVerification_attempt_check" CHECK ("attempt" BETWEEN 1 AND 5),
  CONSTRAINT "WorkflowExecutionQaVerification_digest_check" CHECK ("observationDigest" ~ '^sha256:[a-f0-9]{64}$'),
  CONSTRAINT "WorkflowExecutionQaVerification_revision_check" CHECK ("sourceRevision" ~ '^[a-f0-9]{40}$'),
  CONSTRAINT "WorkflowExecutionQaVerification_verifier_check" CHECK ("verifierId" = 'pinned-independent-github-readback-v1'),
  CONSTRAINT "WorkflowExecutionQaVerification_count_check" CHECK ("verifiedFiles" BETWEEN 1 AND 30)
);

CREATE INDEX "WorkflowExecutionQaVerification_verifiedAt_idx"
ON "WorkflowExecutionQaVerification"("verifiedAt");

ALTER TABLE "WorkflowExecutionQaVerification"
ADD CONSTRAINT "WorkflowExecutionQaVerification_requestId_attempt_fkey"
FOREIGN KEY ("requestId", "attempt")
REFERENCES "WorkflowExecutionObservation"("requestId", "attempt")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Fail closed even against a buggy application adapter: never store verification
-- for a failed runner observation or one with a different observation digest.
CREATE FUNCTION "verifyWorkflowQaObservation"() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "WorkflowExecutionObservation" AS o
    WHERE o."requestId" = NEW."requestId"
      AND o."attempt" = NEW."attempt"
      AND o."outcome" = 'succeeded'
      AND o."observationDigest" = NEW."observationDigest"
      AND o."tokensUsed" = 0
      AND o."filesTouched" = '[]'::jsonb
  ) THEN
    RAISE EXCEPTION 'QA verification requires matching successful read-only execution observation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "WorkflowExecutionQaVerification_match_observation"
BEFORE INSERT ON "WorkflowExecutionQaVerification"
FOR EACH ROW EXECUTE FUNCTION "verifyWorkflowQaObservation"();
