-- Retain replay claims and evidence across retries and process restarts.
-- These are operational records, never a Quality Gate or release authority.
-- INSERT remains available for a new claim, attempt or independent QA proof.
BEGIN;

CREATE FUNCTION "rejectWorkflowJournalMutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000',
    MESSAGE = 'Execution journal is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "WorkflowExecutionClaim_append_only"
BEFORE UPDATE OR DELETE ON "WorkflowExecutionClaim"
FOR EACH ROW EXECUTE FUNCTION "rejectWorkflowJournalMutation"();

CREATE TRIGGER "WorkflowExecutionObservation_append_only"
BEFORE UPDATE OR DELETE ON "WorkflowExecutionObservation"
FOR EACH ROW EXECUTE FUNCTION "rejectWorkflowJournalMutation"();

CREATE TRIGGER "WorkflowExecutionQaVerification_append_only"
BEFORE UPDATE OR DELETE ON "WorkflowExecutionQaVerification"
FOR EACH ROW EXECUTE FUNCTION "rejectWorkflowJournalMutation"();

CREATE TRIGGER "WorkflowExecutionClaim_no_truncate"
BEFORE TRUNCATE ON "WorkflowExecutionClaim"
FOR EACH STATEMENT EXECUTE FUNCTION "rejectWorkflowJournalMutation"();

CREATE TRIGGER "WorkflowExecutionObservation_no_truncate"
BEFORE TRUNCATE ON "WorkflowExecutionObservation"
FOR EACH STATEMENT EXECUTE FUNCTION "rejectWorkflowJournalMutation"();

CREATE TRIGGER "WorkflowExecutionQaVerification_no_truncate"
BEFORE TRUNCATE ON "WorkflowExecutionQaVerification"
FOR EACH STATEMENT EXECUTE FUNCTION "rejectWorkflowJournalMutation"();

COMMIT;
