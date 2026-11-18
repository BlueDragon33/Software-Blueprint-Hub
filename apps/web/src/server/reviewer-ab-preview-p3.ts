import { createHash, createPublicKey } from "node:crypto";

import {
  CONSTITUTION_POLICY_VERSION,
  workflowManifestDigest
} from "@blueprint-os/application";
import type { WorkPackage } from "@blueprint-os/contracts";

type WorkflowManifest = Parameters<typeof workflowManifestDigest>[0];

export const REVIEWER_AB_P3_PROJECT = "project:blueprint-os";
export const REVIEWER_AB_P3_WORKFLOW = "blueprint-reviewer-ab-source-inspection";
export const REVIEWER_AB_P3_ISSUER = "reviewer-ab-preview-p3";
const P3_DATABASE = "ep-dawn-band-b3r8ahco.c-4.ap-southeast-1.aws.neon.tech";
const SHA = /^[a-f0-9]{40}$/;
const candidates = [
  { role: "Hub", repository: "BlueDragon33/Software-Blueprint-Hub", number: 167, shaVar: "BLUEPRINT_AB_P3_HUB_SHA" },
  { role: "A", repository: "BlueDragon33/Software-Blueprint-Reviewer-A", number: 6, shaVar: "BLUEPRINT_AB_P3_A_SHA" },
  { role: "B", repository: "BlueDragon33/Software-Blueprint-QA-Worker", number: 10, shaVar: "BLUEPRINT_AB_P3_B_SHA" }
] as const;

const digest = (value: string) => "sha256:" + createHash("sha256").update(value).digest("hex");

/** The Hub Owner action is enabled only on the existing isolated P3 endpoint. */
export function prepareReviewerAbP3Binding(
  manifest: WorkflowManifest | null,
  env: NodeJS.ProcessEnv = process.env
) {
  if (env.BLUEPRINT_AB_P3_MODE !== "isolated-loopback" || env.VERCEL_ENV ||
      manifest?.project.id !== REVIEWER_AB_P3_PROJECT ||
      manifest.project.repo !== candidates[0].repository ||
      manifest.workflowId !== REVIEWER_AB_P3_WORKFLOW || manifest.status !== "candidate") {
    return null;
  }
  const auth = URL.parse(env.AUTH_URL ?? "");
  const database = URL.parse(env.DATABASE_URL ?? "");
  if (!auth || !["http:", "https:"].includes(auth.protocol) ||
      !["127.0.0.1", "localhost", "[::1]"].includes(auth.hostname) ||
      auth.username || auth.password || auth.pathname !== "/" || auth.search || auth.hash ||
      !database || !["postgresql:", "postgres:"].includes(database.protocol) ||
      database.hostname !== P3_DATABASE || database.pathname !== "/neondb" ||
      (database.port && database.port !== "5432") || database.hash ||
      !["require", "verify-full"].includes(database.searchParams.get("sslmode") ?? "") ||
      [...database.searchParams.keys()].some((key) =>
        !["sslmode", "channel_binding"].includes(key) || database.searchParams.getAll(key).length !== 1) ||
      (database.searchParams.has("channel_binding") && database.searchParams.get("channel_binding") !== "require")) {
    return null;
  }
  const revisions = candidates.map(({ role, repository, number, shaVar }) => ({
    role, repository, number, sha: env[shaVar] ?? ""
  }));
  if (revisions.some(({ sha }) => !SHA.test(sha))) return null;

  const publicKeyPem = env.BLUEPRINT_AB_P3_ISSUER_PUBLIC_KEY?.trim().replace(/\r\n/g, "\n");
  if (!publicKeyPem?.startsWith("-----BEGIN PUBLIC KEY-----\n") || publicKeyPem.length > 4096) return null;
  try {
    const key = createPublicKey(publicKeyPem);
    if (key.asymmetricKeyType !== "ed25519" ||
        key.export({ type: "spki", format: "pem" }).toString().trim() !== publicKeyPem) return null;
  } catch {
    return null;
  }

  // Adoption is for the approved projection of this exact registered candidate.
  // Keep the Git manifest a candidate and bind both digests in the review.
  const candidateDigest = workflowManifestDigest(manifest);
  const workflowDigest = workflowManifestDigest({ ...manifest, status: "approved" });
  const issuerFingerprint = digest(publicKeyPem);
  const reviewDigest = digest(JSON.stringify([
    REVIEWER_AB_P3_PROJECT, REVIEWER_AB_P3_WORKFLOW, CONSTITUTION_POLICY_VERSION,
    P3_DATABASE, candidateDigest, workflowDigest, REVIEWER_AB_P3_ISSUER, issuerFingerprint, revisions
  ]));
  return {
    origin: auth.origin,
    revisions,
    candidateDigest,
    workflowDigest,
    issuerFingerprint,
    publicKeyPem,
    reviewDigest,
    workPackageId: "work-package:p3-ab-" + reviewDigest.slice(7, 39)
  };
}

type PreviewBinding = NonNullable<ReturnType<typeof prepareReviewerAbP3Binding>>;

export async function verifyReviewerAbP3DraftHeads(
  revisions: PreviewBinding["revisions"],
  token: string | null,
  http: typeof fetch = fetch
): Promise<void> {
  await Promise.all(revisions.map(async ({ repository, number, sha }) => {
    const response = await http("https://api.github.com/repos/" + repository + "/pulls/" + number, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: "Bearer " + token } : {})
      }
    });
    if (!response.ok) throw new Error("Draft PR metadata unavailable for " + repository);
    const pr = await response.json();
    if (pr?.number !== number || pr.state !== "open" || pr.draft !== true || pr.head?.sha !== sha ||
        pr.head?.repo?.full_name !== repository || pr.base?.repo?.full_name !== repository) {
      throw new Error("Draft PR identity or HEAD changed for " + repository);
    }
  }));
}

export function makeReviewerAbP3WorkPackage(binding: PreviewBinding, now: string): WorkPackage {
  return {
    id: binding.workPackageId,
    projectId: REVIEWER_AB_P3_PROJECT,
    title: "Reviewer A/B Preview P3 readiness",
    purpose: "Verify exact candidate identity and canonical journal access in the isolated P3 runtime. " + binding.reviewDigest,
    dependencies: [],
    acceptanceCriteria: [
      "Verify distinct A and B principals, scoped GitHub reads and separate runs at the reviewed candidate SHAs.",
      "Read back the canonical P3 journal with restricted credentials and verify ZERO-SPEND runtime evidence."
    ],
    qualityGateIds: [],
    status: "planned",
    meta: { schemaVersion: "1.0.0", recordVersion: 1, createdAt: now, updatedAt: now }
  };
}
