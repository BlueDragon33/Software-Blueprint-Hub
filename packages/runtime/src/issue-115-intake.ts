import { isDeepStrictEqual } from "node:util";
import type { AuthenticatedActor } from "@blueprint-os/core";
import { WorkQualityApplicationService } from "@blueprint-os/application";
import { PostgresWorkQualityRepository, type BlueprintPrismaClient } from "@blueprint-os/persistence";
import rawCandidate from "../../../docs/work-packages/issue-115-admission.payload.json";
import type { BlueprintServerRuntime } from "./index";

type QualityGate = Parameters<WorkQualityApplicationService["createQualityGate"]>[1];
type WorkPackage = Parameters<WorkQualityApplicationService["createWorkPackage"]>[1];

const PROJECT = "project:blueprint-os";
const WORK_ID = "work:p2-115-blueprint-signed-source-inspection";
const GATE_IDS = [
  "gate:p2-115-authority",
  "gate:p2-115-inspection",
  "gate:p2-115-independent-qa",
  "gate:p2-115-receipt"
] as const;

type GateRead = {readonly gate: QualityGate; readonly evidence: readonly unknown[]};
type WorkQualityBoundary = Pick<WorkQualityApplicationService,
  "listWorkPackages" | "listQualityGates" | "createWorkPackage" | "createQualityGate">;
export interface Issue115AdmissionBoundary {
  requireMutate(actor: AuthenticatedActor | null, projectId: string): Promise<void>;
  profileVersion(actor: AuthenticatedActor, projectId: string): Promise<number | null>;
  atomic<T>(run: (service: WorkQualityBoundary) => Promise<T>): Promise<T>;
  readback: WorkQualityBoundary;
}
export type Issue115AdmissionResult = Readonly<{
  state: "created" | "already-present";
  workId: string;
  workRecordVersion: number;
  gateIds: readonly string[];
  allNotReady: true;
  executionAuthorized: false;
}>;

export function validateIssue115Candidate(raw: unknown): Readonly<{
  work: WorkPackage;
  gates: readonly QualityGate[];
}> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) ||
      !("authority" in raw) || raw.authority !== "draft-proposal-only-not-approved" ||
      !("workPackage" in raw) || !("qualityGates" in raw) ||
      !Array.isArray(raw.qualityGates) || raw.qualityGates.length !== 4) {
    throw new Error("Issue 115 admission payload is not an authorized scoped proposal");
  }
  const work: WorkPackage = raw.workPackage as WorkPackage;
  const gates: QualityGate[] = raw.qualityGates as QualityGate[];
  // The trusted application service performs full AJV schema validation on
  // creation. These narrower checks also protect already-present readbacks.
  if (!work || typeof work !== "object" || !Array.isArray(work.qualityGateIds) ||
      !Array.isArray(work.dependencies) || !work.meta ||
      work.id !== WORK_ID ||
      work.projectId !== PROJECT || work.status !== "blocked" ||
      work.dependencies.length !== 0 || work.meta.recordVersion !== 1 ||
      !isDeepStrictEqual([...work.qualityGateIds], [...GATE_IDS]) ||
      gates.some((gate, i) => !gate || typeof gate !== "object" ||
        !gate.meta || !Array.isArray(gate.evidenceIds) ||
        gate.id !== GATE_IDS[i] || gate.projectId !== PROJECT ||
        gate.status !== "not-ready" || gate.meta.recordVersion !== 1 ||
        gate.evidenceIds.length !== 0)) {
    throw new Error("Issue 115 candidate has a wrong scope, duplicate identity or forged PASS");
  }
  return Object.freeze({work, gates: Object.freeze(gates)});
}

// Ignore server-assigned timestamps ONLY; every functional field, exact
// identity, frozen candidate requirement and recordVersion must still match.
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "createdAt" && key !== "updatedAt")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => [key, stable(v)]));
  }
  return value;
}
const equivalent = (a: unknown, b: unknown) =>
  isDeepStrictEqual(stable(a), stable(b));

function inspectRecords(
  allWorks: readonly WorkPackage[],
  allGates: readonly GateRead[],
  expected: {work: WorkPackage; gates: readonly QualityGate[]}
): "empty" | "complete" {
  const work = allWorks.find(x => x.id === WORK_ID);
  const tracked = allGates.filter(x => GATE_IDS.includes(x.gate.id as typeof GATE_IDS[number]));
  const activeOthers = allWorks.some(x => x.id !== WORK_ID &&
    !["completed", "archived"].includes(x.status));
  if (activeOthers) throw new Error("Issue 115 admission blocked by another active canonical Work Package");
  if (!work && tracked.length === 0) return "empty";
  if (!work || tracked.length !== 4 ||
      !equivalent(work, expected.work) ||
      expected.gates.some(g => {
        const row = tracked.find(x => x.gate.id === g.id);
        return !row || !equivalent(row.gate, g) || row.evidence.length !== 0;
      })) {
    throw new Error("Issue 115 canonical records conflict or are only partially present");
  }
  return "complete";
}

async function snapshot(
  service: WorkQualityBoundary, actor: AuthenticatedActor,
): Promise<{works: readonly WorkPackage[]; gates: readonly GateRead[]}> {
  const [works, gates] = await Promise.all([
    service.listWorkPackages(actor, PROJECT),
    service.listQualityGates(actor, PROJECT)
  ]);
  return {works, gates};
}

export async function admitIssue115Candidate(
  boundary: Issue115AdmissionBoundary,
  actor: AuthenticatedActor | null,
  projectId: string,
  expectedProfileVersion: number,
  candidate: unknown = rawCandidate
): Promise<Issue115AdmissionResult> {
  if (projectId !== PROJECT || !actor ||
      !Number.isSafeInteger(expectedProfileVersion) || expectedProfileVersion < 1) {
    throw new Error("Issue 115 requires an authenticated exact-project profile binding");
  }
  await boundary.requireMutate(actor, projectId);
  const version = await boundary.profileVersion(actor, projectId);
  if (version !== expectedProfileVersion) {
    throw new Error("Issue 115 canonical profile version changed or unavailable");
  }
  const expected = validateIssue115Candidate(candidate);
  const makeResult = (state: Issue115AdmissionResult["state"]): Issue115AdmissionResult =>
    Object.freeze({
      state, workId: WORK_ID,
      workRecordVersion: 1,
      gateIds: Object.freeze([...GATE_IDS]), allNotReady: true as const,
      executionAuthorized: false as const
    });

  const result = await boundary.atomic(async service => {
    const prior = await snapshot(service, actor);
    if (inspectRecords(prior.works, prior.gates, expected) === "complete") {
      return makeResult("already-present");
    }
    // The caller provides a real Prisma transaction. No partial gate records
    // may commit if the final Work Package create or readback fails.
    const timestamp = new Date().toISOString();
    for (const gate of expected.gates) {
      await service.createQualityGate(actor, {
        ...gate, meta: {...gate.meta, createdAt: timestamp, updatedAt: timestamp}
      });
    }
    await service.createWorkPackage(actor, {
      ...expected.work, meta: {...expected.work.meta, createdAt: timestamp, updatedAt: timestamp}
    });
    const persisted = await snapshot(service, actor);
    if (inspectRecords(persisted.works, persisted.gates, expected) !== "complete") {
      throw new Error("Issue 115 in-transaction readback did not match proposed records");
    }
    return makeResult("created");
  });
  // The post-commit readback uses the canonical runtime service, not the
  // in-memory request, and refuses a missing or contradictory transaction.
  const after = await snapshot(boundary.readback, actor);
  if (inspectRecords(after.works, after.gates, expected) !== "complete") {
    throw new Error("Issue 115 committed canonical readback is missing or contradictory");
  }
  return result;
}

/** Trusted server adapter; never call directly from an anonymous API route. */
export async function admitIssue115FromRuntime(
  runtime: BlueprintServerRuntime,
  actor: AuthenticatedActor | null,
  projectId: string,
  expectedProfileVersion: number
): Promise<Issue115AdmissionResult> {
  return admitIssue115Candidate({
    requireMutate: (authenticated, id) => runtime.authority.require(authenticated, id, "PROJECT_MUTATE"),
    profileVersion: async (authenticated, id) => {
      const found = await runtime.profiles.read(authenticated, id);
      return found?.profile.meta.recordVersion ?? null;
    },
    atomic: callback => runtime.prisma.$transaction(async tx => {
      // Prisma's interactive transaction exposes the same WorkQuality
      // delegates as PrismaClient. Only the existing application service
      // writes; this is not a raw SQL or new authority path.
      const repo = new PostgresWorkQualityRepository(tx as unknown as BlueprintPrismaClient);
      const service = new WorkQualityApplicationService(repo, runtime.authority);
      return callback(service);
    }),
    readback: runtime.workQuality
  }, actor, projectId, expectedProfileVersion);
}
