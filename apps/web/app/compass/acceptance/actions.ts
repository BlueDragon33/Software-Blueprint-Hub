"use server";

import {
  buildCompassAcceptancePreflight,
  compassAcceptanceGateId,
  compassAcceptanceReceipt,
  evaluateConstitutionalCompliance,
  p9019ProfessionalReviewCandidate,
  verifyFinalReleaseGateMetadata
} from "@blueprint-os/application";
import type { GateEvidence, QualityGate } from "@blueprint-os/contracts";
import { revalidatePath } from "next/cache";

import { resolveWebActor } from "../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../src/server/runtime";

const repository = "BlueDragon33/Software-Blueprint-Hub";

async function githubJson(path: string): Promise<unknown> {
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Blueprint-OS-P9-020"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) {
    throw new Error(`GitHub Release Gate verification failed (${response.status}).`);
  }
  return response.json();
}

export async function recordCompassAcceptanceAction(runId: number): Promise<{
  readonly ok: boolean;
  readonly message: string;
}> {
  try {
    const actor = await resolveWebActor();
    if (!actor) throw new Error("Sign in before recording acceptance.");
    const revision = process.env.VERCEL_GIT_COMMIT_SHA?.trim().toLowerCase();
    if (!revision || !/^[a-f0-9]{40}$/.test(revision)) {
      throw new Error("Exact Vercel deployment revision is unavailable.");
    }
    if (!Number.isSafeInteger(runId) || runId <= 0) {
      throw new Error("Enter the numeric final Release Gate run ID.");
    }

    const runtime = getBlueprintServerRuntime();
    const projectId = p9019ProfessionalReviewCandidate.projectId;
    await runtime.authority.require(actor, projectId, "PROJECT_REVIEW");
    const [decision, project, gateBundles] = await Promise.all([
      runtime.professionalReview.currentDecision(actor),
      runtime.profiles.read(actor, projectId),
      runtime.workQuality.listQualityGates(actor, projectId)
    ]);
    const preflight = buildCompassAcceptancePreflight({
      reviewDecision: decision,
      constitutionAudit: project
        ? evaluateConstitutionalCompliance({ blueprint: project.blueprint, gateBundles })
        : null
    });
    if (preflight.state !== "ready-for-final-evidence") {
      throw new Error(`P9-020 dependencies remain locked: ${preflight.blockers.join(", ")}`);
    }

    const gateId = compassAcceptanceGateId(revision);
    const existing = gateBundles.find((bundle) => bundle.gate.id === gateId);
    if (existing?.gate.status === "pass") {
      if (!compassAcceptanceReceipt({ revision, gateBundles }).accepted) {
        throw new Error("An invalid acceptance gate already exists for this revision.");
      }
      return { ok: true, message: `P9-020 already accepted for ${revision}.` };
    }

    const [runResponse, jobsResponse, artifactsResponse] = await Promise.all([
      githubJson(`/actions/runs/${runId}`),
      githubJson(`/actions/runs/${runId}/jobs?per_page=100`),
      githubJson(`/actions/runs/${runId}/artifacts?per_page=100`)
    ]);
    const run = runResponse as Parameters<typeof verifyFinalReleaseGateMetadata>[0]["run"];
    const jobs = (jobsResponse as { jobs?: Parameters<typeof verifyFinalReleaseGateMetadata>[0]["jobs"] }).jobs ?? [];
    const artifacts = (artifactsResponse as { artifacts?: Parameters<typeof verifyFinalReleaseGateMetadata>[0]["artifacts"] }).artifacts ?? [];
    const verified = verifyFinalReleaseGateMetadata({ revision, run, jobs, artifacts });

    const now = new Date().toISOString();
    const evidenceId = `evidence:compass:p9-020:${revision}`;
    const source = `${verified.runUrl}/artifacts/${verified.artifactId}#${verified.artifactDigest}`;
    const gate: QualityGate = existing?.gate ?? {
      id: gateId,
      projectId,
      name: "P9-020 Compass Acceptance",
      requirements: [
        "P9-019 approved; Universal Constitution compliant; final exact-revision Release Gate, authority, truth and browser E2E audits PASS."
      ],
      status: "not-ready",
      evidenceIds: [],
      meta: { schemaVersion: "1.0.0", recordVersion: 1, createdAt: now, updatedAt: now }
    };
    if (!existing) await runtime.workQuality.createQualityGate(actor, gate);
    if (existing && (gate.projectId !== projectId || gate.status !== "not-ready")) {
      throw new Error("An incompatible acceptance gate already exists.");
    }
    const evidence: GateEvidence = {
      id: evidenceId,
      gateId,
      kind: "artifact",
      source,
      revision,
      createdAt: now
    };
    const prior = existing?.evidence.find((item) => item.id === evidenceId);
    if (prior && (prior.source !== source || prior.revision !== revision)) {
      throw new Error("Acceptance evidence conflicts with an existing record.");
    }
    if (!prior) await runtime.workQuality.addGateEvidence(actor, evidence);
    await runtime.workQuality.updateQualityGate(actor, {
      ...gate,
      status: "pass",
      evidenceIds: [evidenceId],
      meta: { ...gate.meta, recordVersion: gate.meta.recordVersion + 1, updatedAt: now }
    }, gate.meta.recordVersion);

    revalidatePath("/compass/acceptance");
    revalidatePath("/compass");
    return { ok: true, message: `P9-020 accepted for exact revision ${revision}. Production authority remains false.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "P9-020 acceptance could not be recorded."
    };
  }
}
