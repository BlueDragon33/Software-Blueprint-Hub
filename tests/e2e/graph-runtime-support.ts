import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";

const fromPersistence = createRequire(resolve("packages/persistence/package.json"));
const fromWeb = createRequire(resolve("apps/web/package.json"));
const { Pool } = fromPersistence("pg") as { Pool: new (args: { connectionString: string }) => {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
  end: () => Promise<void>;
} };
const { encode } = fromWeb("@auth/core/jwt") as { encode: (input: {
  secret: string; salt: string; token: Record<string, string>;
}) => Promise<string> };

export const graphQaProject = "project:p6-registry-beta";
export const graphQaRoute = "/projects/" + encodeURIComponent(graphQaProject) + "/evidence-graph";
export const graphQaWork = "work-package:p6-beta-foundation";

export function graphQaDatabase() {
  const url = process.env.GRAPH_QA_ADMIN_DATABASE_URL ?? "";
  const target = new URL(url);
  if (process.env.BLUEPRINT_GRAPH_RUNTIME_QA !== "true" || target.hostname !== "localhost" ||
      target.pathname !== "/blueprint_graph_runtime" || target.port !== "5432") {
    throw new Error("Graph runtime QA is restricted to the declared loopback disposable database");
  }
  return new Pool({ connectionString: url });
}
export type GraphQaDatabase = ReturnType<typeof graphQaDatabase>;

/** Standard QA session using the test-only secret; no provider login or human approval claim. */
export async function authenticateGraphRole(page: Page, role: string) {
  const secret = process.env.AUTH_SECRET ?? "";
  if (process.env.BLUEPRINT_GRAPH_RUNTIME_QA !== "true" || secret.length < 32) {
    throw new Error("Graph runtime QA session configuration unavailable");
  }
  const subject = "graph-runtime-" + role;
  const cookie = "authjs.session-token";
  const token = await encode({ secret, salt: cookie, token: {
    sub: subject, email: role + "@graph-qa.example.test",
    blueprintProvider: "github", blueprintProviderSubject: subject
  } });
  await page.context().clearCookies();
  await page.context().addCookies([{ name: cookie, value: token,
    url: "http://127.0.0.1:3000", httpOnly: true, sameSite: "Lax", secure: false }]);
}

export async function businessSnapshot(db: GraphQaDatabase): Promise<string> {
  const documents: Record<string, unknown> = {};
  // Fixed allowlist, never a browser-controlled SQL identifier.
  for (const table of ["ProjectProfile", "WorkPackage", "QualityGate", "ReleaseRecord"] as const) {
    const { rows } = await db.query('SELECT "id", "document" FROM "' + table + '" WHERE "projectId" = $1 ORDER BY "id"', [graphQaProject]);
    documents[table] = rows;
  }
  documents.GateEvidence = (await db.query(
    'SELECT e."id", e."document" FROM "GateEvidence" e JOIN "QualityGate" g ON e."gateId"=g."id" WHERE g."projectId"=$1 ORDER BY e."id"', [graphQaProject])).rows;
  return createHash("sha256").update(JSON.stringify(documents)).digest("hex");
}
