import { encode } from "@auth/core/jwt";
import { expect, test, type Page } from "@playwright/test";

const e2eAuthSecret = process.env.AUTH_SECRET ?? "";

const registryAlphaName = "Registry Alpha canonical";
const registryBetaName = "Registry Beta canonical";

async function authenticateRegistryOwner(page: Page): Promise<void> {
  await page.setExtraHTTPHeaders({ "x-forwarded-proto": "http" });
  const cookieName = "authjs.session-token";
  const token = await encode({
    secret: e2eAuthSecret,
    salt: cookieName,
    token: {
      sub: "p6-e2e-owner",
      email: "p6-e2e@example.test",
      blueprintProvider: "github",
      blueprintProviderSubject: "p6-e2e-owner"
    }
  });

  await page.context().addCookies([
    {
      name: cookieName,
      value: token,
      url: "http://127.0.0.1:3000",
      httpOnly: true,
      secure: false,
      sameSite: "Lax"
    }
  ]);
}

test("signed-out root protects the canonical project registry", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sign in to open your project registry." })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText(/does not expose canonical project names/i)).toBeVisible();
  await page.screenshot({
    path: `artifacts/p6-001-registry-signed-out-${testInfo.project.name}.png`,
    fullPage: true
  });
});

test("System Owner sees canonical multi-project registry and opens a project", async ({
  page
}, testInfo) => {
  await authenticateRegistryOwner(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await expect(page.getByText(registryAlphaName, { exact: true })).toBeVisible();
  await expect(page.getByText(registryBetaName, { exact: true })).toBeVisible();
  await expect(page.getByText("System Owner", { exact: true }).first()).toBeVisible();

  await page.screenshot({
    path: `artifacts/p6-001-registry-authenticated-${testInfo.project.name}.png`,
    fullPage: true
  });

  await page.getByRole("link", { name: new RegExp(registryBetaName) }).click();
  await expect(
    page.getByRole("heading", { name: registryBetaName })
  ).toBeVisible();
  await expect(page.getByText("Canonical", { exact: true })).toBeVisible();
  await expect(page.getByText("B4", { exact: true }).first()).toBeVisible();
});

test("canonical B4 project surfaces truthful readiness without percentages", async ({
  page
}, testInfo) => {
  await authenticateRegistryOwner(page);
  await page.goto("/projects/project%3Ap6-registry-beta");

  await expect(
    page.getByRole("heading", {
      name: "Readiness is blocked by canonical engineering state."
    })
  ).toBeVisible();

  await expect(page.getByText("1 / 4 PASS", { exact: true })).toBeVisible();
  await expect(
    page.getByText("1 required gate records missing", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "Define required gate gate:platform:compatibility"
    })
  ).toBeVisible();

  await expect(
    page.getByText("gate:platform:compatibility", { exact: true }).first()
  ).toBeVisible();

  await expect(
    page.getByText("Revision recorded · currentness unverified", {
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByText("Ship readiness dashboard", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText(
      /Dependency work-package:p6-beta-foundation is testing, not completed/
    )
  ).toBeVisible();

  const readiness = page.getByLabel("Canonical readiness summary");
  await expect(readiness).not.toContainText("%");

  await page.screenshot({
    path: `artifacts/p6-002-readiness-${testInfo.project.name}.png`,
    fullPage: true
  });
});

test("canonical project workspace has stable truthful views", async ({
  page
}, testInfo) => {
  await authenticateRegistryOwner(page);
  await page.goto("/projects/project%3Ap6-registry-beta");

  const workspaceNav = page.getByRole("navigation", {
    name: "Project workspace views"
  });

  await expect(workspaceNav.getByRole("link", { name: /Overview/ })).toHaveAttribute(
    "aria-current",
    "page"
  );

  await workspaceNav.getByRole("link", { name: /Profile/ }).click();
  await expect(
    page.getByRole("heading", { name: "Canonical Project Profile" })
  ).toBeVisible();
  await expect(page.getByText("role-based", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: /Blueprint/ }).click();
  await expect(
    page.getByRole("heading", { name: "Resolved engineering requirements" })
  ).toBeVisible();
  await expect(
    page.getByText("gate:platform:compatibility", { exact: true })
  ).toBeVisible();

  await page.getByRole("link", { name: /Roadmap/ }).click();
  await expect(
    page.getByRole("heading", { name: "Dependency-aware Work Packages" })
  ).toBeVisible();
  await expect(
    page.getByText("Ship readiness dashboard", { exact: true })
  ).toBeVisible();

  await page.getByRole("link", { name: /Quality/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Quality Gates and revision-specific evidence"
    })
  ).toBeVisible();
  await expect(
    page.getByText("revision-p6-beta-quality", { exact: true })
  ).toBeVisible();

  await page.screenshot({
    path: `artifacts/p6-003-workspace-quality-${testInfo.project.name}.png`,
    fullPage: true
  });

  await page.getByRole("link", { name: /Decisions/ }).click();
  await expect(
    page.getByRole("heading", { name: "Architecture Decisions" })
  ).toBeVisible();
  await expect(
    page.getByText("Keep governance state canonical and structured", {
      exact: true
    })
  ).toBeVisible();
  await expect(page.getByText("accepted", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(/Revision revision-p6-004-e2e/)
  ).toBeVisible();

  await page.screenshot({
    path: `artifacts/p6-004-decisions-${testInfo.project.name}.png`,
    fullPage: true
  });

  await page.getByRole("link", { name: /Risks & Debt/ }).click();
  await expect(
    page.getByRole("heading", { name: "Risks & Technical Debt" })
  ).toBeVisible();
  await expect(
    page.getByText("Governance records can drift from implementation", {
      exact: true
    })
  ).toBeVisible();
  await expect(
    page.getByText(
      "Legacy governance notes remain outside structured records",
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    page.getByText("work-package:p6-beta-dashboard", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("work-package:p6-beta-foundation", { exact: true })
  ).toBeVisible();

  await page.screenshot({
    path: `artifacts/p6-004-risks-debt-${testInfo.project.name}.png`,
    fullPage: true
  });

  await page.getByRole("link", { name: /Releases & Lessons/ }).click();
  await expect(
    page.getByRole("heading", { name: "Releases & Lessons" })
  ).toBeVisible();
  await expect(page.getByText("P6-006", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: /Overview/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Readiness is blocked by canonical engineering state."
    })
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Guided project setup" })
  ).toHaveAttribute("href", "/projects/new");

  await page.screenshot({
    path: `artifacts/p6-003-workspace-overview-${testInfo.project.name}.png`,
    fullPage: true
  });
});

test("Knowledge Library exposes reusable truth without project completion state", async ({
  page
}, testInfo) => {
  await page.goto("/knowledge");

  await expect(
    page.getByRole("heading", { name: "Knowledge Library", exact: true })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "Definitions guide projects; they do not claim projects are done."
    })
  ).toBeVisible();

  await expect(
    page.getByText("Universal Constitution v0", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("Template Resolution Contract v1", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("No canonical Patterns published yet.", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("No canonical Anti-patterns published yet.", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("No canonical Reference Cases published yet.", { exact: true })
  ).toBeVisible();

  await expect(page.getByText(/project complete/i)).toHaveCount(0);
  await expect(page.getByText(/gate pass/i)).toHaveCount(0);

  await page.screenshot({
    path: `artifacts/p6-005-knowledge-${testInfo.project.name}.png`,
    fullPage: true
  });
});

test("critical preview journey stays understandable and evidence-honest", async ({
  page
}, testInfo) => {
  await page.goto("/projects/new");
  await expect(
    page.getByRole("heading", { name: "Build with evidence, not guesswork." })
  ).toBeVisible();

  await expect(page.getByText("Preview mode")).toBeVisible();
  await page.getByLabel("Project name").fill("Human UX Review Project");
  await page.getByRole("radio", { name: /B2/ }).click();

  await page.getByRole("button", { name: "Resolve blueprint" }).click();
  await expect(
    page.getByRole("heading", {
      name: "See the engineering depth this project requires."
    })
  ).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Turn the blueprint into dependency-aware work."
    })
  ).toBeVisible();

  await page
    .getByLabel("Work package title")
    .fill("Review the first App Shell journey");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "PASS is a decision backed by evidence." })
  ).toBeVisible();

  await expect(page.getByText("Human UX review", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/authorized reviewer against an exact revision/)
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Add UX review evidence/i })
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Generate preview prompt" }).click();
  await expect(
    page.getByRole("heading", { name: "Project state becomes an executable handoff." })
  ).toBeVisible();
  await expect(page.getByText("Deterministic", { exact: true })).toBeVisible();
  await expect(page.locator("pre")).toContainText(
    "Review the first App Shell journey"
  );

  await page.screenshot({
    path: `artifacts/fnd009-${testInfo.project.name}.png`,
    fullPage: true
  });
});

test("critical preview journey is keyboard-operable", async ({ page }) => {
  await page.goto("/projects/new");

  const projectName = page.getByLabel("Project name");
  await projectName.focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Keyboard Review Project");

  const level = page.getByRole("radio", { name: /B2/ });
  await level.focus();
  await page.keyboard.press("Space");
  await expect(level).toBeChecked();

  const resolve = page.getByRole("button", { name: "Resolve blueprint" });
  await resolve.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "See the engineering depth this project requires."
    })
  ).toBeVisible();

  const continueFromBlueprint = page.getByRole("button", { name: "Continue" });
  await continueFromBlueprint.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "Turn the blueprint into dependency-aware work."
    })
  ).toBeVisible();

  const workTitle = page.getByLabel("Work package title");
  await workTitle.focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Keyboard-operated work package");

  const continueFromWork = page.getByRole("button", { name: "Continue" });
  await continueFromWork.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "PASS is a decision backed by evidence." })
  ).toBeVisible();

  const generate = page.getByRole("button", { name: "Generate preview prompt" });
  await generate.focus();
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("heading", {
      name: "Project state becomes an executable handoff."
    })
  ).toBeVisible();
  await expect(page.locator("pre")).toContainText(
    "Keyboard-operated work package"
  );
});
