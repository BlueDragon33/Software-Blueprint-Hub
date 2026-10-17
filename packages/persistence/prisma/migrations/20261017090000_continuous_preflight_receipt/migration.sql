CREATE TABLE "ContinuousPreflightReceipt" (
  "id" VARCHAR(160) NOT NULL,
  "projectId" VARCHAR(160) NOT NULL,
  "workId" VARCHAR(160) NOT NULL,
  "sequence" INTEGER NOT NULL,
  "decision" VARCHAR(16) NOT NULL,
  "profileVersion" INTEGER NOT NULL,
  "workVersion" INTEGER NOT NULL,
  "canonicalDigest" VARCHAR(80) NOT NULL,
  "appHead" VARCHAR(40) NOT NULL,
  "gateDigest" VARCHAR(80) NOT NULL,
  "policyVersion" VARCHAR(32) NOT NULL,
  "checks" JSONB NOT NULL,
  "note" VARCHAR(900) NOT NULL,
  "actorPrincipalId" VARCHAR(160) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "productionReleaseAuthority" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ContinuousPreflightReceipt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContinuousPreflightReceipt_validity" CHECK (
    "decision" IN ('attest','revoke') AND
    "sequence" > 0 AND "profileVersion" > 0 AND "workVersion" > 0 AND
    "canonicalDigest" ~ '^sha256:[a-f0-9]{64}$' AND
    "appHead" ~ '^[a-f0-9]{40}$' AND
    "gateDigest" ~ '^sha256:[a-f0-9]{64}$' AND
    "productionReleaseAuthority" = false
  )
);
CREATE UNIQUE INDEX "ContinuousPreflightReceipt_projectId_workId_sequence_key"
  ON "ContinuousPreflightReceipt"("projectId","workId","sequence");
CREATE INDEX "ContinuousPreflightReceipt_projectId_workId_createdAt_idx"
  ON "ContinuousPreflightReceipt"("projectId","workId","createdAt");
ALTER TABLE "ContinuousPreflightReceipt"
  ADD CONSTRAINT "ContinuousPreflightReceipt_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContinuousPreflightReceipt"
  ADD CONSTRAINT "ContinuousPreflightReceipt_actorPrincipalId_fkey"
  FOREIGN KEY ("actorPrincipalId") REFERENCES "Principal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION continuous_preflight_append_only_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Continuous preflight receipts are append-only';
END;
$$;
CREATE TRIGGER continuous_preflight_no_update_delete
  BEFORE UPDATE OR DELETE ON "ContinuousPreflightReceipt"
  FOR EACH ROW EXECUTE FUNCTION continuous_preflight_append_only_guard();
CREATE TRIGGER continuous_preflight_no_truncate
  BEFORE TRUNCATE ON "ContinuousPreflightReceipt"
  FOR EACH STATEMENT EXECUTE FUNCTION continuous_preflight_append_only_guard();
