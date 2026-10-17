import { execFileSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { expect, test, type Route } from "@playwright/test";
import { createPrismaClient } from "../../packages/persistence/src/client";

// Opt-in and local-only. Never run as part of the default all-project E2E
// suite; requires independently signed-in real identities and disposable DB.
// This is an authenticated *acceptance* test, not a CI fixture authorization.
const optIn = process.env.BLUEPRINT_ISSUE115_LOCAL_ACCEPTANCE === "enabled";
const projectId = "project:blueprint-os";
const path = "/projects/project%3Ablueprint-os/roadmap";
const workId = "work:p2-115-blueprint-signed-source-inspection";
const gateIds = [
  "gate:p2-115-authority", "gate:p2-115-inspection",
  "gate:p2-115-independent-qa", "gate:p2-115-receipt"
];

function checkedEnvironment(): {
  databaseUrl: string;
  ownerState: string;
  editorState: string;
  viewerState: string;
} {
  const urlText = process.env.DATABASE_URL ?? "";
  const url = new URL(urlText);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const db = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "::1"].includes(host) ||
      !/^blueprint_issue115_e2e_[a-z0-9_-]+$/i.test(db)) {
    throw new Error("STOP: disposable localhost PostgreSQL (blueprint_issue115_e2e_*) is required");
  }
  const expectedSha = process.env.BLUEPRINT_ISSUE115_EXPECTED_SHA ?? "";
  const checkoutSha = execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim();
  if (!/^[a-f0-9]{40}$/.test(expectedSha) || expectedSha !== checkoutSha) {
    throw new Error("STOP: exact checked-out Draft PR SHA must equal BLUEPRINT_ISSUE115_EXPECTED_SHA");
  }
  const paths = [
    process.env.BLUEPRINT_ISSUE115_OWNER_STORAGE,
    process.env.BLUEPRINT_ISSUE115_EDITOR_STORAGE,
    process.env.BLUEPRINT_ISSUE115_VIEWER_STORAGE
  ];
  if (paths.some(v => !v || !existsSync(v))) {
    throw new Error("STOP: externally authenticated Owner/Editor/Viewer Playwright storageState is required");
  }
  const canonical = paths.map(p => realpathSync(p!));
  if (new Set(canonical).size !== 3) {
    throw new Error("STOP: separate authenticated role sessions are required");
  }
  if (process.env.BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH !== "true" ||
      !process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    throw new Error("STOP: localhost Auth.js server configuration must already be valid");
  }
  return {databaseUrl: urlText, ownerState: canonical[0]!,
    editorState:canonical[1]!, viewerState:canonical[2]!};
}

test.describe("Issue 115 — real localhost authenticated acceptance, no authority fixtures", () => {
  test.skip(!optIn, "Requires manually authorized local-only authenticated acceptance session");

  test("rejects wrong-Origin POST, honors actual roles, and persists exactly one blocked proposal for parallel submissions", async ({browser}) => {
    const env = checkedEnvironment();
    const prisma = createPrismaClient(env.databaseUrl);
    const contexts: Array<Awaited<ReturnType<typeof browser.newContext>>> = [];
    try {
      const before = await Promise.all([
        prisma.projectProfile.findUnique({where:{projectId}}),
        prisma.workPackage.findMany({where:{projectId}}),
        prisma.qualityGate.findMany({where:{projectId}})
      ]);
      // Refuse to test against an unexpected profile revision or existing
      // canonical state. Do not clean/reset/seed any database here.
      if (!before[0] || before[0].recordVersion !== 1 ||
          before[1].length !== 0 || before[2].length !== 0) {
        throw new Error("STOP: isolated project Profile v1 and completely empty Work/Gate records required");
      }
      const owner = await browser.newContext({storageState:env.ownerState});
      const editor = await browser.newContext({storageState:env.editorState});
      const viewer = await browser.newContext({storageState:env.viewerState});
      const anonymous = await browser.newContext();
      contexts.push(owner,editor,viewer,anonymous);
      const ownerPage = await owner.newPage();
      const editorPage = await editor.newPage();
      const viewerPage = await viewer.newPage();
      const anonPage = await anonymous.newPage();

      await Promise.all([
        ownerPage.goto(path),editorPage.goto(path),
        viewerPage.goto(path),anonPage.goto(path)
      ]);
      const submitName = "Nhập hồ sơ đề xuất và kiểm tra dữ liệu đã lưu";
      const ownerSubmit = ownerPage.getByRole("button",{name:submitName});
      const editorSubmit = editorPage.getByRole("button",{name:submitName});
      await expect(ownerSubmit).toBeVisible();
      await expect(editorSubmit).toBeVisible();
      await expect(viewerPage.getByRole("button",{name:submitName})).toHaveCount(0);
      await expect(anonPage.getByRole("button",{name:submitName})).toHaveCount(0);
      await expect(anonPage.getByText(/đăng nhập để mở dự án này/i)).toBeVisible();

      // Exercise the actual framework Server Action POST. A wrong Origin must
      // be rejected before the existing Action can insert any canonical data.
      let modified = 0;
      const wrongOrigin = async (route: Route) => {
        const request = route.request();
        if (request.method() === "POST" &&
            new URL(request.url()).pathname.includes("/roadmap")) {
          modified++;
          await route.continue({headers:{...request.headers(),
            origin:"https://cross-origin.invalid"}});
        } else {
          await route.continue();
        }
      };
      await ownerPage.route("**/*", wrongOrigin);
      await ownerPage.locator('input[name="confirmBlockedIntake"]').check();
      const rejected = ownerPage.waitForResponse(r =>
        r.request().method() === "POST" &&
        new URL(r.url()).pathname.includes("/roadmap"));
      await ownerSubmit.click();
      const response = await rejected;
      expect(modified).toBe(1);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
      expect(await prisma.workPackage.count({where:{projectId}})).toBe(0);
      expect(await prisma.qualityGate.count({where:{projectId}})).toBe(0);
      await ownerPage.unroute("**/*", wrongOrigin);

      // Return to fresh canonical GET; actual owner/editor sessions remain.
      await Promise.all([ownerPage.goto(path),editorPage.goto(path)]);
      await Promise.all([
        ownerPage.locator('input[name="confirmBlockedIntake"]').check(),
        editorPage.locator('input[name="confirmBlockedIntake"]').check()
      ]);
      const clicks = await Promise.allSettled([
        ownerPage.getByRole("button",{name:submitName}).click(),
        editorPage.getByRole("button",{name:submitName}).click()
      ]);
      // Both accepted or one explicitly failed-closed is permissible; state
      // integrity, not UI optimism, is the authoritative acceptance proof.
      if (clicks.every(x => x.status === "rejected")) {
        throw new Error("STOP: both authorized intake POSTs failed");
      }
      await expect.poll(async () => prisma.workPackage.count({where:{projectId}}))
        .toBe(1);
      await expect.poll(async () => prisma.qualityGate.count({where:{projectId}}))
        .toBe(4);
      const [works,gates] = await Promise.all([
        prisma.workPackage.findMany({where:{projectId}}),
        prisma.qualityGate.findMany({where:{projectId}})
      ]);
      expect(works).toHaveLength(1);
      expect(works[0]).toMatchObject({id:workId,status:"blocked",recordVersion:1});
      expect(new Set(gates.map(g => g.id))).toEqual(new Set(gateIds));
      expect(gates.every(g => g.status === "not-ready" && g.recordVersion === 1)).toBe(true);
      expect(works[0]?.document).toMatchObject({status:"blocked",meta:{recordVersion:1}});
      for (const gate of gates) {
        expect(gate.document).toMatchObject({
          status:"not-ready",evidenceIds:[],meta:{recordVersion:1}
        });
      }
      await ownerPage.goto(path);
      await expect(ownerPage.getByText(/Work Package hiện có/)).toBeVisible();
      await expect(ownerPage.getByText(/v1 · blocked/)).toBeVisible();
      // This scope only covers a blocked proposal, NOT issuer adoption,
      // Quality Gate PASS, signed completion or full three-service E2E.
    } finally {
      await Promise.allSettled(contexts.map(c=>c.close()));
      await prisma.$disconnect();
    }
  });
});
