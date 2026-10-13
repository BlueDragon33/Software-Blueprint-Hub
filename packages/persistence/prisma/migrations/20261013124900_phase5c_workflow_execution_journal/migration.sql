-- Phase 5C — durable, replay-resistant workflow execution journal.
-- A claimed requestId is never recycled, even after its grant expires.
-- The executor deliberately has no UPDATE or DELETE surface.

CREATE TABLE "WorkflowExecutionClaim" (
    "requestId" VARCHAR(80) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowExecutionClaim_pkey" PRIMARY KEY ("requestId"),
    CONSTRAINT "WorkflowExecutionClaim_expiry_check" CHECK ("expiresAt" > "createdAt")
);

CREATE INDEX "WorkflowExecutionClaim_createdAt_idx"
ON "WorkflowExecutionClaim"("createdAt");

CREATE TABLE "WorkflowExecutionObservation" (
    "requestId" VARCHAR(80) NOT NULL,
    "attempt" INTEGER NOT NULL,
    "outcome" VARCHAR(24) NOT NULL,
    "observationDigest" VARCHAR(80),
    "evidenceReferences" JSONB NOT NULL,
    "filesTouched" JSONB NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowExecutionObservation_pkey" PRIMARY KEY ("requestId", "attempt"),
    CONSTRAINT "WorkflowExecutionObservation_attempt_check" CHECK ("attempt" BETWEEN 1 AND 5),
    CONSTRAINT "WorkflowExecutionObservation_tokens_check" CHECK ("tokensUsed" >= 0),
    CONSTRAINT "WorkflowExecutionObservation_outcome_check"
        CHECK ("outcome" IN ('succeeded', 'failed', 'invalid-result', 'runner-error')),
    CONSTRAINT "WorkflowExecutionObservation_digest_check"
        CHECK ("observationDigest" IS NULL OR "observationDigest" ~ '^sha256:[0-9a-f]{64}$')
);

CREATE INDEX "WorkflowExecutionObservation_createdAt_idx"
ON "WorkflowExecutionObservation"("createdAt");

ALTER TABLE "WorkflowExecutionObservation"
ADD CONSTRAINT "WorkflowExecutionObservation_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "WorkflowExecutionClaim"("requestId")
ON DELETE RESTRICT ON UPDATE CASCADE;
