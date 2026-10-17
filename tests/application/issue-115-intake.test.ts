import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { QualityGate, WorkPackage } from "@blueprint-os/contracts";
import {
  admitIssue115Candidate,
  validateIssue115Candidate,
  type Issue115AdmissionBoundary
} from "../../packages/runtime/src/issue-115-intake";
import proposal from "../../docs/work-packages/issue-115-admission.payload.json";

const project = "project:blueprint-os";
const owner = {principalId: "principal:real-owner-test-only"};
const editor = {principalId: "principal:editor-test-only"};
const viewer = {principalId: "principal:viewer-test-only"};
type Store = {works: WorkPackage[]; gates: QualityGate[]};
const cloned = <T>(v: T): T => structuredClone(v);

function harness(options: { readonly version?: number; readonly breakReadback?: boolean } = {}) {
  const state: Store = {works: [], gates: []};
  let transactions = 0;
  let writes = 0;
  const auth: Issue115AdmissionBoundary["requireMutate"] = async (actor, id) => {
    if (!actor || id !== project || actor.principalId === viewer.principalId) {
      throw new Error("Authorization denied for PROJECT_MUTATE");
    }
  };
  const service = (db: Store) => ({
    listWorkPackages: async (_actor: typeof owner | null, id: string) =>
      id === project ? cloned(db.works) : [],
    listQualityGates: async (_actor: typeof owner | null, id: string) =>
      id === project ? cloned(db.gates.map(gate => ({gate, evidence: []}))) : [],
    createWorkPackage: async (_actor: typeof owner | null, v: WorkPackage) => {
      if (db.works.some(x => x.id === v.id)) throw new Error("duplicate work");
      writes++;
      db.works.push(cloned(v));return v;
    },
    createQualityGate: async (_actor: typeof owner | null, v: QualityGate) => {
      if (db.gates.some(x => x.id === v.id)) throw new Error("duplicate gate");
      writes++;
      db.gates.push(cloned(v));return v;
    }
  });
  const boundary: Issue115AdmissionBoundary = {
    requireMutate: auth,
    profileVersion: async (_actor, id) => id === project ? (options.version ?? 1) : null,
    atomic: async action => {
      transactions++;
      const tx=cloned(state);
      const output=await action(service(tx));
      state.works=tx.works;state.gates=tx.gates;
      return output;
    },
    readback: service(state)
  };
  if (options.breakReadback) boundary.readback.listWorkPackages = async () => [];
  return {boundary,state,get transactions(){return transactions;},get writes(){return writes;}};
}

describe("Issue #115 canonical candidate-only authenticated admission", () => {
  it("pins the machine payload to the reviewed proposal document; no second registry", () => {
    const text=readFileSync(
      new URL("../../docs/work-packages/ISSUE-115-SIGNED-SOURCE-INSPECTION-CANDIDATE.md", import.meta.url),"utf8");
    const blocks=Array.from(text.matchAll(/```json\n([\s\S]*?)\n```/g)).map(m=>JSON.parse(m[1]!));
    expect(blocks).toHaveLength(2);
    expect(proposal.workPackage).toEqual(blocks[0]);
    expect(proposal.qualityGates).toEqual(blocks[1]);
    const checked=validateIssue115Candidate(proposal);
    expect(checked.work.status).toBe("blocked");
    expect(checked.gates).toHaveLength(4);
    expect(checked.gates.every(x=>x.status==="not-ready"&&x.evidenceIds.length===0)).toBe(true);
  });

  it("keeps admission on same-origin POST Server Actions with no permissive origin allowlist", () => {
    // Config/source regression only; a live cross-origin browser POST remains
    // UNVERIFIED until a localhost Next server is available for testing.
    const action = readFileSync(
      new URL("../../apps/web/app/projects/[projectId]/roadmap/actions.ts", import.meta.url), "utf8");
    const config = readFileSync(
      new URL("../../apps/web/next.config.ts", import.meta.url), "utf8");
    expect(action.trimStart().startsWith('"use server";')).toBe(true);
    expect(action).toContain('formData.get("confirmBlockedIntake")');
    expect(action).toContain('"PROJECT_MUTATE"');
    expect(action).toContain('loadProjectWorkspace(');
    expect(config).not.toMatch(/allowedOrigins|allowedDevOrigins/);
  });

  it("rejects anonymous, VIEWER, wrong project and stale profile before any write", async () => {
    const h=harness();
    await expect(admitIssue115Candidate(h.boundary,null,project,1)).rejects.toThrow(/authenticated/);
    await expect(admitIssue115Candidate(h.boundary,viewer,project,1)).rejects.toThrow(/PROJECT_MUTATE/);
    await expect(admitIssue115Candidate(h.boundary,editor,"project:application-management",1)).rejects.toThrow(/exact-project/);
    await expect(admitIssue115Candidate(h.boundary,owner,project,2)).rejects.toThrow(/version changed/);
    expect(h.transactions).toBe(0);
    expect(h.writes).toBe(0);
  });

  it("never admits spoofed PASS, another project or altered package identities", async () => {
    for(const corrupted of [
      {...proposal,qualityGates:proposal.qualityGates.map((g,i)=>i===0?{...g,status:"pass"}:g)},
      {...proposal,qualityGates:proposal.qualityGates.map((g,i)=>i===0?{...g,projectId:"project:evil"}:g)},
      {...proposal,workPackage:{...proposal.workPackage,status:"completed"}},
      {...proposal,workPackage:{...proposal.workPackage,qualityGateIds:["gate:p2-115-authority"]}}
    ]) {
      const h=harness();
      await expect(admitIssue115Candidate(h.boundary,owner,project,1,corrupted))
        .rejects.toThrow(/wrong scope|forged PASS/);
      expect(h.writes).toBe(0);
    }
  });

  it("atomically creates only blocked work and 4 not-ready gates; repeat is idempotent with recordVersion readback", async () => {
    const h=harness();
    const first=await admitIssue115Candidate(h.boundary,editor,project,1);
    expect(first).toMatchObject({state:"created",workRecordVersion:1,executionAuthorized:false,allNotReady:true});
    expect(h.state.works).toHaveLength(1);
    expect(h.state.gates).toHaveLength(4);
    expect(h.state.works[0]?.status).toBe("blocked");
    expect(h.state.gates.every(x=>x.meta.recordVersion===1&&x.status==="not-ready")).toBe(true);
    const second=await admitIssue115Candidate(h.boundary,editor,project,1);
    expect(second.state).toBe("already-present");
    expect(h.writes).toBe(5);
    expect(h.state.works).toHaveLength(1);
    expect(h.state.gates).toHaveLength(4);
  });

  it("blocks partial/contradictory existing records and a second active canonical package", async () => {
    const partial=harness();partial.state.gates.push(cloned(proposal.qualityGates[0] as QualityGate));
    await expect(admitIssue115Candidate(partial.boundary,owner,project,1)).rejects.toThrow(/partially/);
    expect(partial.writes).toBe(0);

    const conflicting=harness();
    conflicting.state.works.push({...cloned(proposal.workPackage) as WorkPackage,title:"different"});
    conflicting.state.gates.push(...cloned(proposal.qualityGates) as QualityGate[]);
    await expect(admitIssue115Candidate(conflicting.boundary,owner,project,1)).rejects.toThrow(/conflict/);
    expect(conflicting.writes).toBe(0);

    const active=harness();
    active.state.works.push({...cloned(proposal.workPackage) as WorkPackage,id:"work:other-active"});
    await expect(admitIssue115Candidate(active.boundary,owner,project,1)).rejects.toThrow(/another active/);
    expect(active.writes).toBe(0);
  });

  it("handles a concurrent unique or serialization collision ONLY when committed canonical readback is identical", async () => {
    for (const code of ["P2002", "P2034"]) {
      const winning = harness();
      await admitIssue115Candidate(winning.boundary, owner, project, 1);
      winning.boundary.atomic = async () => {
        throw Object.assign(new Error("injected concurrent collision"), {code});
      };
      const idempotent = await admitIssue115Candidate(winning.boundary, owner, project, 1);
      expect(idempotent).toMatchObject({
        state: "already-present", workRecordVersion: 1, executionAuthorized: false
      });
      expect(winning.state.works).toHaveLength(1);
      expect(winning.state.gates).toHaveLength(4);

      const noWinner = harness();
      noWinner.boundary.atomic = async () => {
        throw Object.assign(new Error("injected concurrent collision"), {code});
      };
      await expect(admitIssue115Candidate(noWinner.boundary, owner, project, 1))
        .rejects.toThrow(/injected concurrent collision/);
      expect(noWinner.state.works).toHaveLength(0);

      const partialWinner = harness();
      partialWinner.state.gates.push(cloned(proposal.qualityGates[0] as QualityGate));
      partialWinner.boundary.atomic = async () => {
        throw Object.assign(new Error("injected concurrent collision"), {code});
      };
      await expect(admitIssue115Candidate(partialWinner.boundary, owner, project, 1))
        .rejects.toThrow(/injected concurrent collision/);
    }
  });

  it("fails closed when committed canonical records cannot be independently read back", async () => {
    const h=harness({breakReadback:true});
    await expect(admitIssue115Candidate(h.boundary,owner,project,1)).rejects.toThrow(/readback/);
  });
});
