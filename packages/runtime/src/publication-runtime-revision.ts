import { execFileSync } from "node:child_process";

const exactRevision = /^[a-f0-9]{40}$/;

/** Only a fresh, clean local production build may supply this provenance. */
export function localPublicationBuildRevision(cwd: string): string {
  const gitEnv = { ...process.env };
  for (const name of Object.keys(gitEnv)) {
    if (/^GIT_/i.test(name)) delete gitEnv[name];
  }
  const git = (...args: string[]) => execFileSync("git", args, {
    cwd, encoding: "utf8", timeout: 10000, windowsHide: true,
    env: { ...gitEnv, GIT_OPTIONAL_LOCKS: "0" }
  }).trim();
  const root = git("rev-parse", "--show-toplevel");
  const index = git("-C", root, "ls-files", "-v", "-z");
  if (index.split("\0").some(entry => /^[a-zS] /.test(entry))) {
    throw new Error("Local constitution publication requires a complete visible Git index");
  }
  const revision = git("-C", root, "rev-parse", "--verify", "HEAD^{commit}");
  if (!exactRevision.test(revision) || git("-C", root, "-c", "core.fsmonitor=false", "status", "--porcelain=v1", "--untracked-files=all") !== "") {
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
