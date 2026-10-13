import {
  applyConstitutionPublicationPatch, attestConstitutionAuthoritySources,
  constitutionPublicationPaths, constitutionPublicationPatchPath, constitutionSourceDigest,
  validateConstitutionAuthoritySetAttestation,
  type ConstitutionPublicationAttestationVerifier, type ConstitutionPublicationCandidate,
  type ConstitutionSourceFiles
} from "@blueprint-os/application";
import { readConstitutionArtifactZip } from "./constitution-artifact";
import type { ConstitutionAuthoritySetAttestation } from "@blueprint-os/core";

const repository = "BlueDragon33/Software-Blueprint-Hub";
const requiredSteps = ["Install dependencies", "Generate Prisma Client", "Validate Prisma schema", "Migrate empty PostgreSQL database",
  "Verify migration status", "Universal Constitution compliance", "Constitution authority-set atomicity", "Constitution ecosystem snapshot",
  "Constitution compliance matrix snapshot", "Generated contract drift", "Schema compatibility", "Source-of-truth contradiction gate",
  "Source-of-truth detector self-test", "Inactive constitutional candidate and adversarial tests", "Lint", "Typecheck", "Architecture boundaries",
  "Unit, contract, authority, and PostgreSQL integration tests", "Production build", "Seed canonical Project Registry E2E data",
  "Install Playwright Chromium", "App Shell E2E + screenshots"];
interface ProviderRun { id: number; run_attempt: number; head_sha: string; status: string; conclusion: string; path: string; event: string; repository: { full_name: string } }
interface ProviderJob { id: number; name: string; run_id: number; head_sha: string; status: string; conclusion: string; steps: { name: string; status: string; conclusion: string }[] }
interface ProviderArtifact { id: number; created_at: string; name: string; expired: boolean; digest: string; workflow_run: { id: number; head_sha: string } }

/** Read-only official GitHub provenance and actual repo/runtime activation; no caller URLs or credentials. */
export class GitHubConstitutionPublicationVerifier implements ConstitutionPublicationAttestationVerifier {
  readonly id = "github:canonical-constitution-publication-readback:v1";
  private readonly http: typeof fetch;
  constructor(private readonly options: { http?: typeof fetch; runtimeRevision?: string; runtimePolicyVersion: string; token?: string; tokenProvider?: () => Promise<string | null> }) {
    this.http = options.http ?? fetch;
  }
  private async request(url: string): Promise<Response> {
    const token = this.options.token ?? await this.options.tokenProvider?.();
    const response = await this.http(url, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: "Bearer " + token } : {}) } });
    if (!response.ok) throw new TypeError("Trusted GitHub evidence unavailable (" + response.status + ")");
    return response;
  }
  private async api<T>(path: string): Promise<T> {
    return (await this.request(`https://api.github.com/repos/${repository}/${path}`)).json() as Promise<T>;
  }
  private async raw(revision: string, path: string): Promise<string> {
    // Authorization is never sent to raw.githubusercontent.com.
    const response = await this.http(`https://raw.githubusercontent.com/${repository}/${revision}/${path}`,
      { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new TypeError("Canonical GitHub source unavailable");
    const bytes = await response.text();
    if (bytes.length > 2_000_000) throw new TypeError("Constitution source exceeds bounded size");
    return bytes;
  }
  private async files(revision: string): Promise<ConstitutionSourceFiles> {
    return Object.fromEntries(await Promise.all(constitutionPublicationPaths.map(async path => [path, await this.raw(revision, path)])));
  }
  private async archive(id: number, digest: string): Promise<Record<string, unknown>> {
    const token = this.options.token ?? await this.options.tokenProvider?.();
    const initial = await this.http(`https://api.github.com/repos/${repository}/actions/artifacts/${id}/zip`, {
      redirect: "manual", signal: AbortSignal.timeout(30000), headers: { Accept: "application/vnd.github+json", ...(token ? { Authorization: "Bearer " + token } : {}) }
    });
    let response = initial;
    if (initial.status === 302) {
      const url = new URL(initial.headers.get("location") ?? "");
      if (url.protocol !== "https:" || !(/^productionresults[a-z0-9]*\.blob\.core\.windows\.net$/.test(url.hostname) || url.hostname.endsWith(".githubusercontent.com"))) throw new TypeError("Untrusted artifact redirect");
      response = await this.http(url, { redirect: "error", signal: AbortSignal.timeout(30000) }); // No bearer token crosses origin.
    }
    if (!response.ok) throw new TypeError("Authenticated GitHub artifact read unavailable");
    const chunks: Uint8Array[] = []; let length = 0;
    if (!response.body) throw new TypeError("Missing artifact stream");
    const reader = response.body.getReader();
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      length += part.value.length;
      if (length > 80_000_000) { await reader.cancel(); throw new TypeError("Artifact exceeds bounded size"); }
      chunks.push(part.value);
    }
    return readConstitutionArtifactZip(Buffer.concat(chunks), digest);
  }
  async prepare(revision: string, runId: string): Promise<ConstitutionPublicationCandidate> {
    if (!/^[a-f0-9]{40}$/.test(revision) || !/^\d+$/.test(runId)) throw new TypeError("Exact publication SHA/run required");
    if (!/^[a-f0-9]{40}$/.test(this.options.runtimeRevision ?? "")) throw new TypeError("Trusted deployment workflow revision unavailable");
    const run = await this.api<ProviderRun>(`actions/runs/${runId}`);
    if (run.id !== Number(runId) || run.head_sha !== revision || run.status !== "completed" || run.conclusion !== "success" ||
        run.repository?.full_name !== repository || !["push", "workflow_dispatch"].includes(run.event) ||
        ![".github/workflows/ci.yml", ".github/workflows/release-gate.yml"].includes(run.path) ||
        !Number.isInteger(run.run_attempt) || run.run_attempt < 1) throw new TypeError("Full Gate provenance mismatch");
    const [{ jobs }, { artifacts }, patch, originals, workflow, trustedWorkflow] = await Promise.all([
      this.api<{ jobs: ProviderJob[] }>(`actions/runs/${runId}/attempts/${run.run_attempt}/jobs?per_page=100`),
      this.api<{ artifacts: ProviderArtifact[] }>(`actions/runs/${runId}/artifacts?per_page=100`),
      this.raw(revision, constitutionPublicationPatchPath), this.files(revision),
      this.raw(revision, run.path), this.raw(this.options.runtimeRevision!, run.path)
    ]);
    if (workflow !== trustedWorkflow) throw new TypeError("Full Gate workflow differs from trusted deployment");
    const gate = jobs.find(job => job.name === "release-gate" && job.run_id === Number(runId) && job.head_sha === revision);
    const manifestStep = run.path.endsWith("ci.yml") ? "Generate exact Release Gate evidence manifest" : "Generate Release Gate evidence manifest";
    if (!gate || gate.status !== "completed" || gate.conclusion !== "success" ||
        !requiredSteps.concat(manifestStep).every(name => gate.steps.some(step => step.name === name && step.status === "completed" && step.conclusion === "success")) ||
        gate.steps.some(step => step.status !== "completed" || step.conclusion !== "success")) throw new TypeError("Full Gate checks incomplete/skipped");
    const artifact = artifacts.filter(item => Number.isInteger(item.id) && item.id > 0 && item.name === `release-gate-evidence-${revision}` && item.expired === false &&
      item.workflow_run?.id === Number(runId) && item.workflow_run.head_sha === revision && /^sha256:[a-f0-9]{64}$/.test(item.digest)).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
    if (!artifact) throw new TypeError("Full Gate artifact missing/expired");
    const files = applyConstitutionPublicationPatch(originals, patch);
    const attestation = validateConstitutionAuthoritySetAttestation(attestConstitutionAuthoritySources(files, revision, runId));
    const evidence = await this.archive(artifact.id, artifact.digest);
    const recorded = evidence["artifacts/constitution-1.3-authority-set.json"] as ConstitutionAuthoritySetAttestation;
    const recordedBaseline = evidence["artifacts/constitution-authority-set.json"] as ConstitutionAuthoritySetAttestation;
    const expectedBaseline = attestConstitutionAuthoritySources(originals, revision, runId);
    const descriptor = evidence["artifacts/constitution-1.3-candidate.json"] as Record<string, unknown>;
    const manifest = evidence["artifacts/release-gate-evidence.json"] as Record<string, unknown>;
    if (JSON.stringify(validateConstitutionAuthoritySetAttestation(recorded)) !== JSON.stringify(attestation) ||
        JSON.stringify(validateConstitutionAuthoritySetAttestation(recordedBaseline)) !== JSON.stringify(expectedBaseline) ||
        descriptor?.status !== "INACTIVE_CANDIDATE_VERIFIED" || descriptor?.candidatePolicyVersion !== attestation.policyVersion ||
        descriptor?.activePolicyVersion !== expectedBaseline.policyVersion ||
        descriptor?.ruleCount !== JSON.parse(files["control/universal-constitution.contract.json"]!).executionRules?.length ||
        descriptor?.sourceRevision !== revision || descriptor?.ciRunId !== runId || descriptor?.authoritySetDigest !== attestation.authoritySetDigest ||
        descriptor?.publicationPatchDigest !== constitutionSourceDigest(patch) || descriptor?.ratification !== "NOT_ASSERTED" ||
        descriptor?.publication !== "NOT_ASSERTED" || descriptor?.productionReleaseAuthority !== false ||
        manifest?.repository !== repository || manifest?.revision !== revision || manifest?.runId !== runId ||
        manifest?.runAttempt !== String(run.run_attempt) || manifest?.productionDeploymentAuthorized !== false) throw new TypeError("Artifact seal/revision/attempt mismatch");
    const results = manifest.testResults as Record<string, { passed: number; failed: number; skipped: number; flaky?: number }>;
    if (!results || !["node", "vitest", "browser"].every(kind => {
      const result = results[kind]; return result && Number.isInteger(result.passed) && result.passed > 0 && result.failed === 0 && result.skipped === 0 && (result.flaky ?? 0) === 0;
    })) throw new TypeError("Actual Full Gate test results missing/failed/skipped");
    return Object.freeze({ attestation, patch, publicationPatchDigest: constitutionSourceDigest(patch),
      artifactDigest: artifact.digest, files });
  }
  async verify(input: ConstitutionAuthoritySetAttestation): Promise<boolean> {
    try {
      const attestation = validateConstitutionAuthoritySetAttestation(input);
      const candidate = await this.prepare(attestation.sourceRevision, attestation.ciRunId);
      if (JSON.stringify(candidate.attestation) !== JSON.stringify(attestation) ||
          this.options.runtimePolicyVersion !== attestation.policyVersion ||
          !/^[a-f0-9]{40}$/.test(this.options.runtimeRevision ?? "")) return false;
      const main = await this.api<{ object: { sha: string } }>("git/ref/heads/main");
      if (main.object.sha !== this.options.runtimeRevision) return false;
      const active = await this.files(main.object.sha);
      return constitutionPublicationPaths.every(path => active[path] === candidate.files[path]) &&
        attestConstitutionAuthoritySources(active, attestation.sourceRevision, attestation.ciRunId).authoritySetDigest === attestation.authoritySetDigest;
    } catch { return false; }
  }
}
