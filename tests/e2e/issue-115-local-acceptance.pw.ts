import { execFileSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { expect, test, type Page, type Route } from "@playwright/test";

// Browser-only canonical readback; importing the generated Prisma .ts ESM
// client directly into the Playwright CJS transformer would be incompatible.
// Database reads are performed by the real Next.js canonical Roadmap and
// Quality pages; no Playwright SQL, seeded actor or fabricated authority.
const optIn = process.env.BLUEPRINT_ISSUE115_LOCAL_ACCEPTANCE === "enabled";
const projectId = "project:blueprint-os";
const path = "/projects/project%3Ablueprint-os/roadmap";
const qualityPath = "/projects/project%3Ablueprint-os/quality";
const workId = "work:p2-115-blueprint-signed-source-inspection";
const gateIds = [
  "gate:p2-115-authority", "gate:p2-115-inspection",
  "gate:p2-115-independent-qa", "gate:p2-115-receipt"
];

function checkedEnvironment(): {
  ownerState: string; editorState: string; viewerState: string;
} {
  const dbUrl = new URL(process.env.DATABASE_URL ?? "");
  const host = dbUrl.hostname.replace(/^\[|\]$/g, "");
  const name = decodeURIComponent(dbUrl.pathname.replace(/^\//, ""));
  if (!["postgres:", "postgresql:"].includes(dbUrl.protocol) ||
      !["localhost", "127.0.0.1", "::1"].includes(host) ||
      !/^blueprint_issue115_e2e_[a-z0-9_-]+$/i.test(name)) {
    throw new Error("STOP: use a new disposable localhost-only blueprint_issue115_e2e_* PostgreSQL database");
  }
  const expectedSha = process.env.BLUEPRINT_ISSUE115_EXPECTED_SHA ?? "";
  const sourceSha = execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim();
  if (!/^[0-9a-f]{40}$/.test(expectedSha) || sourceSha !== expectedSha) {
    throw new Error("STOP: local source SHA does not match the reviewed Draft HEAD");
  }
  const states = [
    process.env.BLUEPRINT_ISSUE115_OWNER_STORAGE,
    process.env.BLUEPRINT_ISSUE115_EDITOR_STORAGE,
    process.env.BLUEPRINT_ISSUE115_VIEWER_STORAGE
  ];
  if (states.some(p => !p || !existsSync(p))) {
    throw new Error("STOP: three distinct real signed-in local role storageState files required");
  }
  const resolved = states.map(p => realpathSync(p!));
  if (new Set(resolved).size !== 3) {
    throw new Error("STOP: Owner/Editor/Viewer authenticated sessions must be distinct");
  }
  if (process.env.BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH !== "true" ||
      !process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    throw new Error("STOP: signed localhost Auth.js configuration is required");
  }
  return {ownerState:resolved[0]!,editorState:resolved[1]!,viewerState:resolved[2]!};
}

async function assertEmptyCanonical(page: Page): Promise<void> {
  await page.goto(path);
  await expect(page.getByText("No canonical Work Package exists for this project yet.")).toBeVisible();
  await expect(page.getByText(/Project Profile v1/)).toBeVisible();
  await page.goto(qualityPath);
  await expect(page.getByText("No canonical Quality Gate exists for this project yet.")).toBeVisible();
}

async function assertCommittedReadback(page: Page): Promise<void> {
  await page.goto(path);
  await expect(page.getByText(/Work Package hiện có/)).toBeVisible();
  await expect(page.getByText(workId, {exact:true}).first()).toBeVisible();
  await expect(page.getByText(/v1 · blocked/)).toBeVisible();
  const cards = page.locator(".workspace-work-card");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText(workId);
  await expect(cards.first()).toContainText("blocked");
  await expect(page.locator(".workspace-fact").filter({hasText:"Total work"}).locator("strong")).toHaveText("1");
  await expect(page.locator(".workspace-fact").filter({hasText:"Blocked"}).locator("strong")).toHaveText("1");
  await page.goto(qualityPath);
  await expect(page.locator(".workspace-fact").filter({hasText:"Tracked gates"}).locator("strong")).toHaveText("4");
  await expect(page.locator(".workspace-fact").filter({hasText:"Evidence records"}).locator("strong")).toHaveText("0");
  await expect(page.locator(".workspace-fact").filter({hasText:"PASS"}).locator("strong")).toHaveText("0");
  await expect(page.locator(".workspace-quality-card")).toHaveCount(4);
  for (const id of gateIds) {
    const card=page.locator(".workspace-quality-card").filter({hasText:id});
    await expect(card).toHaveCount(1);
    await expect(card.locator(".status-chip")).toHaveText("not ready");
    await expect(card.getByText("No canonical evidence record is available for this gate.").first())
      .toBeVisible();
  }
}

test.describe("Issue #115 — opt-in genuine localhost browser acceptance (NOT CI fixture)", () => {
  test.skip(!optIn, "No permission to simulate real human authority or touch a real project");

  test("auth roles, wrong-Origin POST, two concurrent submissions, real canonical readback", async ({browser}) => {
    const env = checkedEnvironment();
    const contexts: Array<Awaited<ReturnType<typeof browser.newContext>>> = [];
    try {
      const [owner,editor,viewer,anonymous] = await Promise.all([
        browser.newContext({storageState:env.ownerState}),
        browser.newContext({storageState:env.editorState}),
        browser.newContext({storageState:env.viewerState}),
        browser.newContext()
      ]);
      contexts.push(owner,editor,viewer,anonymous);
      const [ownerPage,editorPage,viewerPage,anonPage] = await Promise.all([
        owner.newPage(),editor.newPage(),viewer.newPage(),anonymous.newPage()
      ]);
      // Precondition: Profile exists as previously admitted by real authority,
      // while this fresh disposable local DB contains no WorkPackages/Gates.
      await assertEmptyCanonical(ownerPage);
      await Promise.all([ownerPage.goto(path),editorPage.goto(path),
        viewerPage.goto(path),anonPage.goto(path)]);
      const button = "Nhập hồ sơ đề xuất và kiểm tra dữ liệu đã lưu";
      await expect(ownerPage.getByRole("button",{name:button})).toBeVisible();
      await expect(editorPage.getByRole("button",{name:button})).toBeVisible();
      await expect(viewerPage.getByRole("button",{name:button})).toHaveCount(0);
      await expect(anonPage.getByRole("button",{name:button})).toHaveCount(0);
      await expect(anonPage.getByText(/đăng nhập để mở dự án này/i)).toBeVisible();

      let originChanged=0;
      const crossOrigin: (route:Route)=>Promise<void> = async route => {
        const request=route.request();
        if (request.method()==="POST" && new URL(request.url()).pathname.endsWith("/roadmap")) {
          originChanged++;
          await route.continue({headers:{...request.headers(),origin:"https://cross-origin.invalid"}});
        } else {
          await route.continue();
        }
      };
      await ownerPage.route("**/*",crossOrigin);
      await ownerPage.locator('input[name="confirmBlockedIntake"]').check();
      const deniedPost=ownerPage.waitForResponse(response =>
        response.request().method()==="POST" &&
        new URL(response.url()).pathname.endsWith("/roadmap"));
      await ownerPage.getByRole("button",{name:button}).click();
      const response=await deniedPost;
      expect(originChanged).toBe(1);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
      await ownerPage.unroute("**/*",crossOrigin);
      await assertEmptyCanonical(ownerPage);

      await Promise.all([ownerPage.goto(path),editorPage.goto(path)]);
      await Promise.all([
        ownerPage.locator('input[name="confirmBlockedIntake"]').check(),
        editorPage.locator('input[name="confirmBlockedIntake"]').check()
      ]);
      const results=await Promise.allSettled([
        ownerPage.getByRole("button",{name:button}).click(),
        editorPage.getByRole("button",{name:button}).click()
      ]);
      if (results.every(x=>x.status==="rejected")) {
        throw new Error("STOP: both authorized browser POSTs failed");
      }
      // Re-fetch real canonical PostgreSQL-backed state through two distinct
      // authenticated application read models. No direct raw SQL or fake PASS.
      await assertCommittedReadback(ownerPage);
    } finally {
      await Promise.allSettled(contexts.map(c=>c.close()));
    }
  });
});
