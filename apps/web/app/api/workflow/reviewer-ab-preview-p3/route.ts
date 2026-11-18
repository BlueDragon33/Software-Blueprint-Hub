import { CONSTITUTION_POLICY_VERSION } from "@blueprint-os/application";

import { resolveGitHubPublicationToken, resolveWebActor } from "../../../../src/auth/server-actor";
import { reviewerAbP3Binding } from "../../../../src/server/prompt-workflow";
import {
  makeReviewerAbP3WorkPackage,
  REVIEWER_AB_P3_ISSUER,
  REVIEWER_AB_P3_WORKFLOW,
  verifyReviewerAbP3DraftHeads
} from "../../../../src/server/reviewer-ab-preview-p3";
import { getBlueprintServerRuntime } from "../../../../src/server/runtime";

const reply = (body: object, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST only. An active authenticated System Owner must confirm the exact binding. */
export async function POST(request: Request): Promise<Response> {
  const binding = reviewerAbP3Binding();
  if (!binding) return reply({ error: "Isolated Preview P3 is not configured." }, 404);
  if (request.headers.get("origin") !== binding.origin ||
      new URL(request.url).origin !== binding.origin) {
    return reply({ error: "Open this command in the configured loopback Hub." }, 403);
  }
  try {
    const actor = await resolveWebActor();
    if (!actor) return reply({ error: "Sign in to Hub as the System Owner." }, 401);
    const runtime = getBlueprintServerRuntime();
    if (!(await runtime.authority.canExerciseConstitutionalAuthority(actor))) {
      return reply({ error: "System Owner authority is required." }, 403);
    }
    // The form carries only a review digest, never principal, key, SHA or project inputs.
    if (!(request.headers.get("content-type") ?? "").startsWith("application/x-www-form-urlencoded")) {
      return reply({ error: "Submit the reviewed binding from Workflow Studio." }, 415);
    }
    const raw = await request.text();
    if (raw.length > 256) return reply({ error: "Binding confirmation is too large." }, 413);
    const fields = new URLSearchParams(raw);
    if ([...fields.keys()].length !== 1 || fields.get("reviewDigest") !== binding.reviewDigest) {
      return reply({ error: "Preview binding changed. Review the current candidate revisions and issuer." }, 409);
    }
    const token = process.env.WORKFLOW_RECEIPT_GITHUB_READ_TOKEN?.trim() ||
      await resolveGitHubPublicationToken();
    try {
      await verifyReviewerAbP3DraftHeads(binding.revisions, token);
    } catch {
      return reply({ error: "Could not match all three live Draft HEADs with the configured revisions." }, 409);
    }
    const result = await runtime.workflowExecutionAuthority.recordInitialPreviewBinding({
      workPackage: makeReviewerAbP3WorkPackage(binding, new Date().toISOString()),
      workflowId: REVIEWER_AB_P3_WORKFLOW,
      workflowDigest: binding.workflowDigest,
      policyVersion: CONSTITUTION_POLICY_VERSION,
      issuerId: REVIEWER_AB_P3_ISSUER,
      publicKeyPem: binding.publicKeyPem,
      actorPrincipalId: actor.principalId
    });
    return reply({
      status: result.status,
      workPackageId: result.workPackage.id,
      recordVersion: result.workPackage.meta.recordVersion,
      workflowDigest: result.adoption.workflowDigest,
      issuerId: result.issuer.issuerId,
      issuerFingerprint: binding.issuerFingerprint,
      pilotStatus: "NOT_RUN",
      productionAuthorized: false
    }, result.status === "created" ? 201 : 200);
  } catch {
    return reply({ error: "The binding could not be recorded. Check P3 access and the current authority state." }, 409);
  }
}
