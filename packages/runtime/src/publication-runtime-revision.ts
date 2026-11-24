import { execFileSync } from "node:child_process";

const exactRevision = /^[a-f0-9]{40}$/;

/** Only a fresh, clean local production build may supply this provenance. */
export function localPublicationBuildRevision(cwd: string): string {
  const git = (...args: string[]) => execFileSync("git", args, {
    cwd, encoding: "utf8", timeout: 10000, windowsHide: true,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" }
  }).trim();
  const revision = git("rev-parse", "--verify", "HEAD^{commit}");
  if (!exactRevision.test(revision) || git("status", "--porcelain=v1", "--untracked-files=all") !== "") {
    throw new Error("Local constitution publication requires a clean exact Git checkout");
  }
  return revision;
}

/** These inputs are server/build provenance, never request or chat parameters. */
export function publicationRuntimeRevision(local: string | undefined, legacy: string | undefined): string | undefined {
  const supplied = [local, legacy].filter((value): value is string => value !== undefined && value !== "");
  if (supplied.length === 0 || supplied.some(value => !exactRevision.test(value)) || new Set(supplied).size !== 1) return undefined;
  return supplied[0];
}
