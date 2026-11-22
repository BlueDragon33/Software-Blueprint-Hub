-- Disposable Graph runtime QA only. Never run against an application database.
DO $$ BEGIN
  IF current_database() <> 'blueprint_graph_runtime' THEN
    RAISE EXCEPTION 'Graph QA requires blueprint_graph_runtime';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'graph_runtime_app') THEN
    CREATE ROLE graph_runtime_app LOGIN PASSWORD 'graph-runtime-ci-only';
  END IF;
END $$;

INSERT INTO "Principal" ("id", "provider", "providerSubject", "email", "createdAt", "updatedAt")
SELECT 'principal:graph-runtime-' || role, 'github', 'graph-runtime-' || role,
       role || '@graph-qa.example.test', NOW(), NOW()
FROM unnest(ARRAY['VIEWER','EDITOR','REVIEWER','OWNER','REVOKED','DENIED']) AS role
ON CONFLICT ("provider", "providerSubject") DO NOTHING;

INSERT INTO "ProjectAuthority" ("projectId", "principalId", "role", "createdAt", "updatedAt")
SELECT 'project:p6-registry-beta', 'principal:graph-runtime-' || role, role, NOW(), NOW()
FROM unnest(ARRAY['VIEWER','EDITOR','REVIEWER','OWNER']) AS role;

GRANT USAGE ON SCHEMA public TO graph_runtime_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO graph_runtime_app;
-- Session resolution upserts a principal. The graph itself has SELECT-only business access.
GRANT INSERT, UPDATE ON "Principal" TO graph_runtime_app;
