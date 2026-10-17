#!/usr/bin/env node
/**
 * Local Windows / offline-first AUTHORITY PROVENANCE preflight.
 * READ-ONLY: no bootstrap, signing, grant minting, adoption, migration,
 * runner invocation, HTTP server, Work session or release.
 *
 * Usage (PowerShell, from a clean exact-HEAD checkout):
 *   node --env-file=.env.local scripts/check-local-e2e-authority.mjs
 *
 * Must explicitly set BLUEPRINT_E2E_EXPECTED_HEAD,
 * BLUEPRINT_E2E_DISPOSABLE_DB=true, and a localhost-only DATABASE_URL.
 * Optional scoped metadata: BLUEPRINT_E2E_WORK_PACKAGE_ID,
 * BLUEPRINT_E2E_WORKFLOW_ID, BLUEPRINT_E2E_WORKFLOW_DIGEST,
 * BLUEPRINT_E2E_ISSUER_ID. Never print or copy credentials into chat.
 */
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";
import {dirname, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const PROJECT_ID = "project:blueprint-os";
const POLICY = "1.3.0";
const EXPECTED_PORT = "55432";

export function localDbTarget(databaseUrl, disposableAcknowledged) {
  if (!disposableAcknowledged) return "DISPOSABLE_DB_NOT_ACKNOWLEDGED";
  if (typeof databaseUrl !== "string" || !databaseUrl.trim()) {
    return "DATABASE_URL_NOT_CONFIGURED";
  }
  try {
    const u = new URL(databaseUrl);
    // Refuse proxies, external hosts, default 5432 or any unusual connection.
    if (!["postgres:", "postgresql:"].includes(u.protocol) ||
        u.hostname !== "127.0.0.1" || u.port !== EXPECTED_PORT ||
        !/^\/[A-Za-z0-9_-]+$/.test(u.pathname) ||
        u.search || u.hash) {
      return "DATABASE_TARGET_NOT_ISOLATED_LOOPBACK";
    }
  } catch {
    return "DATABASE_URL_INVALID";
  }
  return null;
}

export function latestUnambiguous(rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  if (rows.length > 1 &&
      new Date(rows[0].decidedAt).getTime() ===
        new Date(rows[1].decidedAt).getTime()) return null;
  return rows[0];
}

export function preliminaryBlockers(input) {
  const blocked = [];
  if (!SHA.test(input.expectedHead ?? "")) blocked.push("EXPECTED_HEAD_MISSING");
  if (!SHA.test(input.actualHead ?? "") ||
      input.actualHead !== input.expectedHead) blocked.push("EXACT_GIT_HEAD_MISMATCH");
  if (input.clean !== true) blocked.push("WORKTREE_NOT_CLEAN");
  const dbReason = localDbTarget(input.databaseUrl, input.disposableAcknowledged);
  if (dbReason) blocked.push(dbReason);
  if (input.nodeMajor !== 24) blocked.push("NODE_24_REQUIRED");
  return blocked;
}

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT, encoding: "utf8", timeout: 3000,
      windowsHide: true, stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function configured(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validScope(e) {
  return /^work:[A-Za-z0-9:_./-]+$/.test(e.BLUEPRINT_E2E_WORK_PACKAGE_ID ?? "") &&
    /^[a-z][a-z0-9-]{1,79}$/.test(e.BLUEPRINT_E2E_WORKFLOW_ID ?? "") &&
    DIGEST.test(e.BLUEPRINT_E2E_WORKFLOW_DIGEST ?? "") &&
    /^[a-z][a-z0-9-]{1,79}$/.test(e.BLUEPRINT_E2E_ISSUER_ID ?? "");
}

async function databaseReadOnly(url, e) {
  // Require the locally installed, pinned pg dependency of persistence.
  // There is no need for a web server, Auth.js cookie or synthetic Owner.
  const requireFromPersistence = createRequire(
    new URL("../packages/persistence/package.json", import.meta.url)
  );
  const {Client} = requireFromPersistence("pg");
  const client = new Client({connectionString:url, connectionTimeoutMillis:3000});
  await client.connect();
  let opened = false;
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    opened = true;
    const [principals, owner, project] = await Promise.all([
      client.query('SELECT count(*)::int AS n FROM "Principal"'),
      client.query('SELECT count(*)::int AS n FROM "SystemBootstrap" WHERE "id" = $1', ["system"]),
      client.query('SELECT count(*)::int AS n FROM "Project" WHERE "id" = $1', [PROJECT_ID])
    ]);
    const result = {
      principalRecordsPresent: principals.rows[0].n > 0,
      canonicalOwnerRecordPresent: owner.rows[0].n === 1,
      canonicalProjectPresent: project.rows[0].n === 1,
      scopedWorkflowAdopted: false,
      scopedIssuerAllowed: false,
      exactWorkBindingCurrent: false,
      scopeMetadataSupplied: validScope(e)
    };
    if (result.scopeMetadataSupplied && result.canonicalProjectPresent) {
      const workflowId=e.BLUEPRINT_E2E_WORKFLOW_ID;
      const workflowDigest=e.BLUEPRINT_E2E_WORKFLOW_DIGEST;
      const issuerId=e.BLUEPRINT_E2E_ISSUER_ID;
      const workId=e.BLUEPRINT_E2E_WORK_PACKAGE_ID;
      const [adoptions,issuers,bindings,works] = await Promise.all([
        client.query('SELECT "decision", "decidedAt", "policyVersion" FROM "WorkflowExecutionAdoptionDecision" WHERE "projectId"=$1 AND "workflowId"=$2 AND "workflowDigest"=$3 ORDER BY "decidedAt" DESC, "id" DESC LIMIT 2', [PROJECT_ID,workflowId,workflowDigest]),
        client.query('SELECT "decision", "decidedAt", "policyVersion" FROM "WorkflowExecutionIssuerDecision" WHERE "projectId"=$1 AND "workflowId"=$2 AND "issuerId"=$3 ORDER BY "decidedAt" DESC, "id" DESC LIMIT 2', [PROJECT_ID,workflowId,issuerId]),
        client.query('SELECT "decision", "workflowId", "workflowDigest", "appHead", "policyVersion", "workPackageRecordVersion" FROM "NextActionWorkBindingDecision" WHERE "projectId"=$1 AND "workPackageId"=$2 ORDER BY "decisionSequence" DESC LIMIT 1', [PROJECT_ID,workId]),
        client.query('SELECT "recordVersion", "status" FROM "WorkPackage" WHERE "projectId"=$1 AND "id"=$2', [PROJECT_ID,workId])
      ]);
      const a=latestUnambiguous(adoptions.rows);
      const i=latestUnambiguous(issuers.rows);
      const b=bindings.rows[0];
      const w=works.rows[0];
      result.scopedWorkflowAdopted=!!a && a.decision==="adopt" && a.policyVersion===POLICY;
      result.scopedIssuerAllowed=!!i && i.decision==="allow" && i.policyVersion===POLICY;
      result.exactWorkBindingCurrent=!!b && !!w && b.decision==="bind" &&
        b.workflowId===workflowId && b.workflowDigest===workflowDigest &&
        b.appHead===e.BLUEPRINT_E2E_EXPECTED_HEAD &&
        b.policyVersion===POLICY &&
        b.workPackageRecordVersion===w.recordVersion &&
        ["ready","in-progress"].includes(w.status);
    }
    await client.query("COMMIT");
    opened=false;
    return result;
  } finally {
    if (opened) await client.query("ROLLBACK").catch(()=>{});
    await client.end().catch(()=>{});
  }
}

export async function run(e=process.env) {
  const expectedHead=e.BLUEPRINT_E2E_EXPECTED_HEAD ?? "";
  const actualHead=git(["rev-parse","HEAD"]);
  const gitStatus=git(["status","--porcelain"]);
  const blockers=preliminaryBlockers({
    expectedHead, actualHead, clean:gitStatus==="",
    databaseUrl:e.DATABASE_URL,
    disposableAcknowledged:e.BLUEPRINT_E2E_DISPOSABLE_DB==="true",
    nodeMajor:Number(process.versions.node.split(".")[0])
  });
  const report={
    status:"BLOCKED", expectedHead:SHA.test(expectedHead)?expectedHead:null,
    checkedHead:SHA.test(actualHead ?? "")?actualHead:null,
    authJsEnvironment:{
      authSecretPresent:configured(e.AUTH_SECRET),
      githubClientIdPresent:configured(e.GITHUB_ID),
      githubClientSecretPresent:configured(e.GITHUB_SECRET),
      ownerProviderPresent:configured(e.BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER),
      ownerSubjectPresent:configured(e.BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT)
    },
    canonicalDatabase:null,
    genuineOwnerSession:"NOT_VERIFIED_BY_READ_ONLY_CLI",
    signedEd25519Grant:"NOT_VERIFIED_BY_READ_ONLY_CLI",
    internalAuthorizedEntrypoint:"NOT_AVAILABLE_IN_PR_152",
    e2e:"NOT_RUN",
    releaseAuthority:false,
    blockers
  };
  if (blockers.length===0) {
    try {
      report.canonicalDatabase=await databaseReadOnly(e.DATABASE_URL,e);
      const db=report.canonicalDatabase;
      if(!db.canonicalOwnerRecordPresent) blockers.push("CANONICAL_OWNER_NOT_ESTABLISHED");
      if(!db.canonicalProjectPresent) blockers.push("CANONICAL_PROJECT_MISSING");
      if(!db.scopeMetadataSupplied) blockers.push("WORKFLOW_SCOPE_NOT_SUPPLIED");
      if(db.scopeMetadataSupplied && !db.scopedWorkflowAdopted) blockers.push("WORKFLOW_NOT_ADOPTED");
      if(db.scopeMetadataSupplied && !db.scopedIssuerAllowed) blockers.push("ISSUER_NOT_ALLOWED");
      if(db.scopeMetadataSupplied && !db.exactWorkBindingCurrent) blockers.push("WORK_BINDING_NOT_CURRENT");
    }catch(err) {
      // No full error, SQL, connection string, URL, password or stack in output.
      blockers.push(err?.code==="MODULE_NOT_FOUND"?"PG_CLIENT_NOT_INSTALLED":"LOCAL_DB_READ_FAILED");
    }
  }
  if(!Object.values(report.authJsEnvironment).every(Boolean)) {
    blockers.push("LOCAL_AUTHJS_CONFIGURATION_INCOMPLETE");
  }
  blockers.push("Genuine_OWNER_SESSION_AND_SIGNED_GRANT_NOT_VERIFIED");
  blockers.push("TRUSTED_INTERNAL_E2E_ENTRYPOINT_NOT_CONFIGURED");
  return report;
}

if (process.argv[1] &&
    import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  run().then(result=>{
    console.log("BLUEPRINT_LOCAL_E2E_PREFLIGHT="+JSON.stringify(result));
    process.exitCode=2; // An infrastructure scan is NEVER an authorized E2E PASS.
  }).catch(()=>{
    console.error("BLUEPRINT_LOCAL_E2E_PREFLIGHT=BLOCKED_UNEXPECTED_ERROR");
    process.exitCode=2;
  });
}
