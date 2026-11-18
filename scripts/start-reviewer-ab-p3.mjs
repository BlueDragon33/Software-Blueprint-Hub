import { execFileSync, spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const [pathA, pathB] = process.argv.slice(2);

function checkedHead(cwd, repository, number) {
  const git = (args) => execFileSync("git", args, {
    cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 8_000
  }).trim();
  if (git(["status", "--porcelain"])) throw new Error("A candidate worktree has uncommitted changes.");
  const sha = git(["rev-parse", "--verify", "HEAD"]);
  const pr = JSON.parse(execFileSync("gh", ["pr", "view", String(number), "--repo", repository,
    "--json", "headRefOid,isCrossRepository,isDraft,state"], {
    cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 12_000,
    env: { ...process.env, GH_PROMPT_DISABLED: "1" }
  }));
  if (!/^[0-9a-f]{40}$/.test(sha) || pr.headRefOid !== sha || pr.isCrossRepository !== false ||
    pr.isDraft !== true || pr.state !== "OPEN") {
    throw new Error("A worktree does not match its open Draft PR HEAD.");
  }
  console.log(repository + " #" + number + " " + sha);
  return sha;
}

try {
  if (!pathA || !pathB || process.argv.length !== 4) {
    throw new Error("Pass the Reviewer A and Reviewer B worktree paths.");
  }
  const pins = {
    BLUEPRINT_AB_P3_HUB_SHA: checkedHead(root, "BlueDragon33/Software-Blueprint-Hub", 167),
    BLUEPRINT_AB_P3_A_SHA: checkedHead(resolve(pathA), "BlueDragon33/Software-Blueprint-Reviewer-A", 6),
    BLUEPRINT_AB_P3_B_SHA: checkedHead(resolve(pathB), "BlueDragon33/Software-Blueprint-QA-Worker", 10)
  };
  const env = { ...process.env, ...pins,
    BLUEPRINT_AB_P3_MODE: "isolated-loopback", AUTH_URL: "http://127.0.0.1:3000" };
  // GitHub CLI authentication is used for HEAD verification only.
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;
  delete env.BLUEPRINT_GITHUB_APP_PRIVATE_KEY;
  delete env.REVIEWER_A_APP_PRIVATE_KEY;
  delete env.REVIEWER_B_APP_PRIVATE_KEY;
  const child = spawn("pnpm", ["--filter", "@blueprint-os/web", "dev",
    "--hostname", "127.0.0.1", "--port", "3000"], {
    cwd: root, env, stdio: "inherit", shell: process.platform === "win32"
  });
  child.on("error", () => {
    process.stderr.write("Could not start Hub with pnpm.\n");
    process.exitCode = 1;
  });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
} catch (error) {
  const message = error?.code || error instanceof SyntaxError
    ? "Git or GitHub Draft PR metadata is unavailable." : error.message;
  process.stderr.write("Preview P3 blocked. " + message + "\n");
  process.exitCode = 1;
}
