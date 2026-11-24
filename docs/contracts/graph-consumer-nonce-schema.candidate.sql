-- C30 CANDIDATE ONLY. NOT A MIGRATION. NOT APPLIED TO ANY DATABASE.
-- Prerequisites: human-reviewed migration, DB role least privilege, audited
-- lifecycle/retention and deletion strategy, PostgreSQL concurrency QA.
-- Do not use a process-local nonce Set in a multi-instance deployment.
CREATE TABLE blueprint_graph_proof_nonces (
  issuer TEXT NOT NULL,
  key_id TEXT NOT NULL,
  nonce TEXT NOT NULL,
  project_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blueprint_graph_proof_nonces_primary
    PRIMARY KEY (issuer, key_id, nonce)
);
-- Future reviewed operations must enforce retention and least-privilege;
-- expiry cleanup must NOT re-admit a token while it can still be accepted.
