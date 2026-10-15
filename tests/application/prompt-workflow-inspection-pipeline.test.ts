import { generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  workflowExecutionGrantSigningPayload,
  type WorkflowExecutionGrantPayload,
  type WorkflowAttemptRecord
} from "../../packages/application/src/prompt-workflow-execution";
import { workflowManifestDigest } from "../../packages/application/src/prompt-workflow-orchestration";
import { executeAndVerifyScopedInspection } from "../../packages/runtime/src/workflow-inspection-pipeline";
import { ScopedGitHubReadExecutor } from "../../packages/runtime/src/workflow-scoped-github-executor";
import { PinnedInspectionQaVerifier } from "../../packages/runtime/src/workflow-observation-qa";

const source = JSON.parse(readFileSync(
  new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url),
  "utf8"
));
const workflow = {...source, status: "approved"};
const keyPair = generateKeyPairSync("ed25519");
const publicKey = keyPair.publicKey.export({format:"pem",type:"spki"}).toString();
const now = new Date("2026-10-13T03:05:00.000Z");
const context = {
  projectId: workflow.project.id, repository: workflow.project.repo,
  appHead: "a".repeat(40),
  canonicalDigest: "sha256:" + "b".repeat(64),
  policyVersion: "1.3.0"
};
const path = "src/visa/form.ts";
const actualSource = "real source bytes from pinned GitHub";
const file = (text: string) => ({
  type: "file", path, size: Buffer.byteLength(text),
  encoding: "base64", content: Buffer.from(text).toString("base64")
});

function signedGrant(override: Partial<WorkflowExecutionGrantPayload> = {}) {
  const payload: WorkflowExecutionGrantPayload = {
    schemaVersion: "1.0.0",
    projectId: context.projectId, repository: context.repository,
    workflowId: workflow.workflowId, workflowVersion: workflow.workflowVersion,
    workflowDigest: workflowManifestDigest(workflow),
    templateId: workflow.templateId,
    nodeId: "inventory", appHead: context.appHead,
    canonicalDigest: context.canonicalDigest, policyVersion: context.policyVersion,
    issuerId: "trusted-operator",
    nonce: "0123456789abcdef0123456789abcdef",
    issuedAt: "2026-10-13T03:00:00.000Z",
    expiresAt: "2026-10-13T03:10:00.000Z",
    mode: "inspect-scoped",
    allowedPaths: [path],
    maxAttempts: 1, maxFiles: 1, maxTokenEstimate: 1000,
    ...override
  };
  return { ...payload, signature: sign(
    null, Buffer.from(workflowExecutionGrantSigningPayload(payload)),
    keyPair.privateKey
  ).toString("base64") };
}

function setup(config: {
  readonly qaBytes?: string;
  readonly qaHttpStatus?: number;
  readonly unauthorized?: boolean;
  readonly noAdoption?: boolean;
  readonly corruptJournal?: boolean;
  readonly noClaim?: boolean;
  readonly qaForgetsSource?: boolean;
  readonly failSourceBeforeAction?: boolean;
} = {}) {
  const journalRows = new Map<string, WorkflowAttemptRecord[]>();
  const claims = new Set<string>();
  const sourceHttp = vi.fn(async (url: RequestInfo | URL) => {
    if (config.failSourceBeforeAction) throw new Error("GitHub source unreachable");
    expect(String(url)).toContain("?ref=" + context.appHead);
    return new Response(JSON.stringify(file(actualSource)), {status:200});
  });
  const qaHttp = vi.fn(async (url: RequestInfo | URL) => {
    expect(String(url)).toContain("?ref=" + context.appHead);
    return new Response(JSON.stringify(file(config.qaBytes ?? actualSource)), {status:config.qaHttpStatus ?? 200});
  });
  const journal = {
    claim: vi.fn(async (id: string) => {
      if (claims.has(id)) return false;
      claims.add(id);
      journalRows.set(id,[]);
      return true;
    }),
    append: vi.fn(async (id: string, record: WorkflowAttemptRecord) => {
      if (!journalRows.has(id)) throw new Error("claim not found");
      journalRows.get(id)!.push(structuredClone(record));
    }),
    read: vi.fn(async (id: string) => ({
      claimed: config.noClaim ? false : claims.has(id),
      attempts: config.corruptJournal
        ? [{attempt:1,outcome:"succeeded",observationDigest:"sha256:" + "f".repeat(64),evidenceReferences:[],filesTouched:[],tokensUsed:0}]
        : [...(journalRows.get(id) ?? [])]
    }))
  };
  const authority = {
    publicKeyFor: () => publicKey,
    assertAdopted: async () => {
      if (config.noAdoption) throw new Error("Workflow not adopted");
    },
    assertMayExecute: async () => {
      if (config.unauthorized) throw new Error("Execution not permitted");
    }
  };
  const freshness = {assertCurrent: vi.fn(async () => {})};
  const runner = new ScopedGitHubReadExecutor({
    repository: context.repository, http: sourceHttp as unknown as typeof fetch
  });
  const verifier = new PinnedInspectionQaVerifier({
    http: qaHttp as unknown as typeof fetch
  });
  const qa = {
    verify: async (...args: Parameters<typeof verifier.verify>) => {
      const checked = await verifier.verify(...args);
      return config.qaForgetsSource
        ? {...checked,sourceRevision:"c".repeat(40)}
        : checked;
    }
  };
  const deps = {
    source: {list:async () => []},
    trust: {publicKeyFor:()=>null},
    verifier: {verify:async()=>false},
    authority, journal, runner, freshness, qa, clock:()=>now
  };
  return {execute:(g:unknown=signedGrant(),w=workflow)=>executeAndVerifyScopedInspection(g,w,context,deps),journal,sourceHttp,qaHttp,freshness};
}

describe("signed workflow inspection → durable journal → independent QA", () => {
  it("verifies genuine independent pinned bytes but cannot mint receipts or PASS gates", async () => {
    const h=setup();
    const result=await h.execute();
    expect(result.status).toBe("independently-verified");
    expect(result.qa?.status).toBe("verified-inspection-bytes");
    expect(result.execution.observations).toHaveLength(1);
    expect(result.execution.observations[0]?.outcome).toBe("succeeded");
    expect(result.completionReceiptIssued).toBe(false);
    expect(result.qualityGatePassed).toBe(false);
    expect(result.productionAuthorized).toBe(false);
    expect(h.journal.read).toHaveBeenCalledOnce();
    expect(h.sourceHttp).toHaveBeenCalledOnce();
    expect(h.qaHttp).toHaveBeenCalledOnce();
    await expect(h.execute()).rejects.toThrow(/replay/i);
    expect(h.sourceHttp).toHaveBeenCalledOnce();
  });

  it("refuses another byte stream rather than trusting runner SUCCESS", async () => {
    const h=setup({qaBytes:"tampered source at same path"});
    await expect(h.execute()).rejects.toThrow(/digest mismatch/);
    expect(h.journal.read).toHaveBeenCalledOnce();
  });

  it("blocks absent, corrupted or contradictory durable journal read-back", async () => {
    const lost=setup({noClaim:true});
    await expect(lost.execute()).rejects.toThrow(/Durable execution journal/);
    expect(lost.qaHttp).not.toHaveBeenCalled();
    const altered=setup({corruptJournal:true});
    await expect(altered.execute()).rejects.toThrow(/Durable execution journal/);
    expect(altered.qaHttp).not.toHaveBeenCalled();
  });

  it("fails closed when independent GitHub QA is unavailable", async () => {
    const h=setup({qaHttpStatus:503});
    await expect(h.execute()).rejects.toThrow(/independent pinned evidence unavailable/i);
    expect(h.journal.read).toHaveBeenCalledOnce();
  });

  it("blocks forged QA metadata after correct byte match", async () => {
    const h=setup({qaForgetsSource:true});
    await expect(h.execute()).rejects.toThrow(/Independent QA response is not bound/);
  });

  it("rejects invalid workflow, altered grant and unavailable authority before running", async () => {
    const candidate=setup();
    await expect(candidate.execute(signedGrant(),source)).rejects.toThrow(/approved execution/);
    expect(candidate.sourceHttp).not.toHaveBeenCalled();
    const tampered=setup();
    await expect(tampered.execute({...signedGrant(),allowedPaths:["private/secret.ts"]}))
      .rejects.toThrow(/signature/);
    expect(tampered.sourceHttp).not.toHaveBeenCalled();
    const auth=setup({unauthorized:true});
    await expect(auth.execute()).rejects.toThrow(/not permitted/);
    expect(auth.sourceHttp).not.toHaveBeenCalled();
    const adoption=setup({noAdoption:true});
    await expect(adoption.execute()).rejects.toThrow(/not adopted/);
    expect(adoption.sourceHttp).not.toHaveBeenCalled();
  });

  it("does not start edit-scoped jobs through the inspection-only QA path", async () => {
    const h=setup();
    await expect(h.execute(signedGrant({mode:"edit-scoped"})))
      .rejects.toThrow(/capability|inspection grants/);
    expect(h.sourceHttp).not.toHaveBeenCalled();
  });

  it("runner failures cannot become independently verified outcomes", async () => {
    const h=setup({failSourceBeforeAction:true});
    const out=await h.execute();
    expect(out.status).toBe("verification-blocked");
    expect(out.qa).toBeNull();
    expect(out.execution.status).toBe("stopped");
    expect(out.completionReceiptIssued).toBe(false);
    expect(h.qaHttp).not.toHaveBeenCalled();
  });
});
