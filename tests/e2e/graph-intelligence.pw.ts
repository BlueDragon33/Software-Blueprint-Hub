import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import type { QualityGate, WorkPackage } from "../../packages/contracts/src";
import { collectComputedContrast, evaluateComputedContrast } from "../helpers/rendered-contrast.mjs";
import { authenticateGraphRole, businessSnapshot, graphQaDatabase, graphQaProject,
  graphQaRoute, graphQaWork, type GraphQaDatabase } from "./graph-runtime-support";

let db: GraphQaDatabase;
const heading = (page: Page) => page.getByRole("heading", { name: "Graph Intelligence Studio", exact: true });
test.beforeAll(() => { db = graphQaDatabase(); });
test.afterAll(async () => { await db?.end(); });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("blueprint:hub:language", "en"));
  await page.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1"
    ? route.continue() : route.abort());
});

test("Graph runtime rejects signed-out, invalid-session, unassigned and foreign-project reads", async ({ page }) => {
  let response = await page.goto(graphQaRoute);
  await expect(page.getByRole("heading", { name: "Đăng nhập để mở dự án này." })).toBeVisible();
  expect(await response!.text()).not.toContain("Verify platform foundation");
  await page.context().addCookies([{ name: "authjs.session-token", value: "invalid-qa-session",
    url: "http://127.0.0.1:3000", httpOnly: true, secure: false, sameSite: "Lax" }]);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Đăng nhập để mở dự án này." })).toBeVisible();
  await authenticateGraphRole(page, "DENIED");
  response = await page.goto(graphQaRoute);
  await expect(page.locator("#project-forbidden-title")).toBeVisible();
  expect(await response!.text()).not.toContain("Verify platform foundation");
  await authenticateGraphRole(page, "VIEWER");
  response = await page.goto("/projects/project%3Ap6-registry-alpha/evidence-graph");
  await expect(page.locator("#project-forbidden-title")).toBeVisible();
  expect(await response!.text()).not.toContain("Registry Alpha canonical");
});

test("Graph runtime scopes VIEWER EDITOR REVIEWER OWNER reads and never mutates business state", async ({ page }) => {
  const before = await businessSnapshot(db);
  for (const role of ["VIEWER", "EDITOR", "REVIEWER", "OWNER"]) {
    await authenticateGraphRole(page, role);
    const response = await page.goto(graphQaRoute);
    await expect(heading(page)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Registry Beta canonical", exact: true })).toBeVisible();
    expect(await response!.text()).not.toContain("Registry Alpha canonical");
    await page.getByRole("combobox", { name: "View scope", exact: true }).selectOption("records");
    await page.getByRole("searchbox", { name: "Search graph", exact: true }).fill(graphQaWork);
    await expect(page.locator("button[data-kind='work-package']")).toHaveCount(1);
    await page.locator("button[data-kind='work-package']").click();
    const detail = page.locator('[id$="-detail"]');
    await expect(detail).toContainText("recorded:testing");
    await expect(detail).toContainText("canonical-record");
    await expect(detail).toContainText("not-conferred");
    await page.getByRole("button", { name: "Impact only", exact: true }).click();
    await page.getByRole("button", { name: "Reset filters", exact: true }).click();
    expect(await businessSnapshot(db)).toBe(before);
  }
});

test("Graph runtime rechecks a persisted role revocation and recovers after regrant", async ({ page }) => {
  const values = [graphQaProject, "principal:graph-runtime-REVOKED"];
  await db.query('INSERT INTO "ProjectAuthority" ("projectId","principalId","role","createdAt","updatedAt") VALUES ($1,$2,\'VIEWER\',NOW(),NOW())', values);
  try {
    await authenticateGraphRole(page, "REVOKED");
    await page.goto(graphQaRoute); await expect(heading(page)).toBeVisible();
    await db.query('DELETE FROM "ProjectAuthority" WHERE "projectId"=$1 AND "principalId"=$2', values);
    const response = await page.reload();
    await expect(page.locator("#project-forbidden-title")).toBeVisible();
    await expect(heading(page)).toHaveCount(0);
    expect(await response!.text()).not.toContain("Verify platform foundation");
    await db.query('INSERT INTO "ProjectAuthority" ("projectId","principalId","role","createdAt","updatedAt") VALUES ($1,$2,\'VIEWER\',NOW(),NOW())', values);
    await page.reload(); await expect(heading(page)).toBeVisible();
  } finally {
    await db.query('DELETE FROM "ProjectAuthority" WHERE "projectId"=$1 AND "principalId"=$2', values);
  }
});

test("Graph runtime reflects persisted revisions and rejects broken canonical evidence without fallback", async ({ page }) => {
  await authenticateGraphRole(page, "VIEWER");
  await page.goto(graphQaRoute); await expect(heading(page)).toBeVisible();
  const original = (await db.query('SELECT "document" FROM "WorkPackage" WHERE "id"=$1', [graphQaWork])).rows[0]!.document as WorkPackage;
  const changed: WorkPackage = { ...original, title: "Graph runtime revised canonical work",
    meta: { ...original.meta, recordVersion: original.meta.recordVersion + 1, updatedAt: new Date().toISOString() } };
  const update = await db.query('UPDATE "WorkPackage" SET "document"=$1::jsonb,"recordVersion"=$2,"updatedAt"=NOW() WHERE "id"=$3 AND "recordVersion"=$4',
    [JSON.stringify(changed), changed.meta.recordVersion, graphQaWork, original.meta.recordVersion]);
  expect(update.rowCount).toBe(1);
  try {
    await page.reload();
    await page.getByRole("searchbox", { name: "Search graph", exact: true }).fill(graphQaWork);
    await page.locator("button[data-kind='work-package']").click();
    await expect(page.locator('[id$="-detail"]')).toContainText(changed.title);
    await expect(page.locator('[id$="-detail"]')).toContainText("recordVersion:" + changed.meta.recordVersion);
  } finally {
    const restored = { ...original, meta: { ...original.meta, recordVersion: changed.meta.recordVersion + 1, updatedAt: new Date().toISOString() } };
    await db.query('UPDATE "WorkPackage" SET "document"=$1::jsonb,"recordVersion"=$2,"updatedAt"=NOW() WHERE "id"=$3',
      [JSON.stringify(restored), restored.meta.recordVersion, graphQaWork]);
  }
  const gateId = "gate:quality:evidence";
  const gate = (await db.query('SELECT "document" FROM "QualityGate" WHERE "id"=$1', [gateId])).rows[0]!.document as QualityGate;
  const invalid = { ...gate, evidenceIds: ["evidence:graph-runtime-missing"], meta: { ...gate.meta, recordVersion: gate.meta.recordVersion + 1 } };
  await db.query('UPDATE "QualityGate" SET "document"=$1::jsonb,"recordVersion"=$2 WHERE "id"=$3', [JSON.stringify(invalid), invalid.meta.recordVersion, gateId]);
  try {
    await page.reload();
    await expect(page.locator("#project-runtime-title")).toBeVisible();
    await expect(heading(page)).toHaveCount(0);
    await expect(page.getByText("Synthetic Graph QA fixture", { exact: false })).toHaveCount(0);
    expect((await db.query('SELECT "document" FROM "QualityGate" WHERE "id"=$1', [gateId])).rows[0]!.document).toEqual(invalid);
  } finally {
    const restored = { ...gate, meta: { ...gate.meta, recordVersion: invalid.meta.recordVersion + 1, updatedAt: new Date().toISOString() } };
    await db.query('UPDATE "QualityGate" SET "document"=$1::jsonb,"recordVersion"=$2 WHERE "id"=$3', [JSON.stringify(restored), restored.meta.recordVersion, gateId]);
  }
  await page.getByRole("button", { name: "Retry canonical read" }).click();
  await expect(heading(page)).toBeVisible();
});

test("Graph runtime fails closed on a real database permission outage and retries the same source", async ({ page }) => {
  await authenticateGraphRole(page, "VIEWER");
  const before = await businessSnapshot(db);
  await db.query('REVOKE SELECT ON "WorkPackage" FROM graph_runtime_app');
  try {
    const response = await page.goto(graphQaRoute);
    await expect(page.locator("#project-runtime-title")).toBeVisible();
    expect(await response!.text()).not.toContain("Verify platform foundation");
    await expect(heading(page)).toHaveCount(0);
  } finally { await db.query('GRANT SELECT ON "WorkPackage" TO graph_runtime_app'); }
  await page.getByRole("button", { name: "Retry canonical read" }).click();
  await expect(heading(page)).toBeVisible();
  expect(await businessSnapshot(db)).toBe(before);
});

test("Graph runtime renders canonical data with computed contrast and responsive layout", async ({ page }, info) => {
  await authenticateGraphRole(page, "VIEWER");
  await page.goto(graphQaRoute); await expect(heading(page)).toBeVisible();
  const studio = heading(page).locator("xpath=ancestor::section[1]");
  const text = studio.locator("h2,p,label,summary,button[data-kind] strong,button[data-kind] small,dt,dd");
  const measurements = [];
  for (const element of await text.all()) {
    if (!await element.isVisible() || !(await element.innerText()).trim()) continue;
    const sample = await element.evaluate(collectComputedContrast);
    const result = evaluateComputedContrast(sample);
    measurements.push(result);
    expect(result.status, (await element.innerText()).slice(0, 90)).toBe("PASS");
  }
  expect(measurements.length).toBeGreaterThan(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(studio).not.toContainText(process.env.AUTH_SECRET!);
  await info.attach("real-runtime-computed-contrast", { body: JSON.stringify(measurements), contentType: "application/json" });
  await page.screenshot({ path: `artifacts/graph-runtime-${info.project.name}.png`, fullPage: true });
});

test("Graph runtime records a canonical checkpoint for process recovery", async ({ page }) => {
  await authenticateGraphRole(page, "VIEWER");
  await page.goto(graphQaRoute); await expect(heading(page)).toBeVisible();
  mkdirSync("artifacts", { recursive: true });
  writeFileSync("artifacts/graph-runtime-checkpoint.json", JSON.stringify({
    projectId: graphQaProject, businessDigest: await businessSnapshot(db), sourceRevision: process.env.RELEASE_GATE_REVISION
  }));
});

test("Graph runtime preserves canonical state after process restart", async ({ page }) => {
  expect(process.env.GRAPH_QA_RESTART_STAGE).toBe("true");
  const saved = JSON.parse(readFileSync("artifacts/graph-runtime-checkpoint.json", "utf8"));
  expect(saved.projectId).toBe(graphQaProject);
  expect(saved.sourceRevision).toBe(process.env.RELEASE_GATE_REVISION);
  expect(await businessSnapshot(db)).toBe(saved.businessDigest);
  await authenticateGraphRole(page, "VIEWER");
  await page.goto(graphQaRoute); await expect(heading(page)).toBeVisible();
  await page.getByRole("searchbox", { name: "Search graph", exact: true }).fill(graphQaWork);
  await expect(page.locator("button[data-kind='work-package']")).toHaveCount(1);
  expect(await businessSnapshot(db)).toBe(saved.businessDigest);
});
