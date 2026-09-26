import { encode } from "@auth/core/jwt";
import { expect, test, type Page } from "@playwright/test";

const e2eAuthSecret = process.env.AUTH_SECRET ?? "";

const registryAlphaName = "Registry Alpha canonical";
const registryBetaName = "Registry Beta canonical";

async function authenticatePrincipal(
  page: Page,
  subject: string,
  email: string
): Promise<void> {
  await page.setExtraHTTPHeaders({ "x-forwarded-proto": "http" });
  const cookieName = "authjs.session-token";
  const token = await encode({
    secret: e2eAuthSecret,
    salt: cookieName,
    token: {
      sub: subject,
      email,
      blueprintProvider: "github",
      blueprintProviderSubject: subject
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

async function authenticateRegistryOwner(page: Page): Promise<void> {
  return authenticatePrincipal(
    page,
    "p6-e2e-owner",
    "p6-e2e@example.test"
  );
}

async function authenticateNoAccessUser(page: Page): Promise<void> {
  return authenticatePrincipal(
    page,
    "p7-e2e-no-access",
    "p7-no-access@example.test"
  );
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

test("P7-004 forbidden project reads stay distinct from runtime outages", async ({
  page
}) => {
  await authenticateNoAccessUser(page);
  await page.goto("/projects/project%3Ap6-registry-beta");

  await expect(
    page.getByRole("heading", {
      name: "You do not have access to this project."
    })
  ).toBeVisible();

  await expect(
    page.getByText(/did not expose project metadata/i)
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /Retry canonical read/i })
  ).toHaveCount(0);

  await expect(
    page.getByText(/Preview mode|Build with evidence, not guesswork/i)
  ).toHaveCount(0);

  await expect(
    page.getByRole("link", { name: "Back to readable projects" })
  ).toHaveAttribute("href", "/");
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
    page.getByText("revision-p6-beta-quality", { exact: true }).first()
  ).toBeVisible();

  await page.screenshot({
    path: `artifacts/p6-003-workspace-quality-${testInfo.project.name}.png`,
    fullPage: true
  });

  await page.getByRole("link", { name: /^Prompt/ }).click();
  await expect(
    page.getByRole("heading", { name: "Derived execution projection" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Export .md" })).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Prompt Projection snapshots" })
  ).toBeVisible();

  if (testInfo.project.name === "desktop-chromium") {
    await expect(page.getByText("Stale", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText(/Canonical state has changed since this prompt was generated/)
    ).toBeVisible();
    await expect(
      page.getByText("2026-09-26T00:20:00.000Z", { exact: true }).first()
    ).toBeVisible();

    await page.getByRole("button", { name: "Regenerate" }).click();
    await expect(page.getByText("Fresh", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText(/This prompt matches the current canonical source revision/)
    ).toBeVisible();
    await expect(page.getByText("2 snapshots", { exact: true })).toBeVisible();
  } else {
    await expect(
      page.getByText(/^(Fresh|Stale)$/).first()
    ).toBeVisible();
  }

  await page.screenshot({
    path: `artifacts/p6-007-prompt-workspace-${testInfo.project.name}.png`,
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
    page.getByRole("heading", {
      name: "Exact revisions, rollback history and reusable learning"
    })
  ).toBeVisible();
  await expect(page.getByText("v1.0.0", { exact: true })).toBeVisible();
  await expect(
    page.getByText("revision-p6-006-e2e", { exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText("evidence:p6-006-release", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Release evidence must match the shipped revision", {
      exact: true
    })
  ).toBeVisible();
  await expect(
    page.getByText("release:p6-006-beta-v1", { exact: true }).first()
  ).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") {
    const activeReleaseLink = page
      .getByRole("navigation", { name: "Project workspace views" })
      .getByRole("link", { name: /Releases & Lessons/ });

    await expect(activeReleaseLink).toHaveAttribute("aria-current", "page");

    const activeTabVisible = await activeReleaseLink.evaluate((element) => {
      const shell = element.closest(".project-workspace-nav-shell");
      if (!(shell instanceof HTMLElement)) return false;

      const activeBox = element.getBoundingClientRect();
      const shellBox = shell.getBoundingClientRect();

      return (
        activeBox.left >= shellBox.left - 1 &&
        activeBox.right <= shellBox.right + 1
      );
    });

    expect(activeTabVisible).toBe(true);
  }

  await page.screenshot({
    path: `artifacts/p6-006-releases-lessons-${testInfo.project.name}.png`,
    fullPage: true
  });

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

test("Phase 6 Product UX Gate traverses the canonical product without dead ends", async ({
  page
}) => {
  await authenticateRegistryOwner(page);

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true })
  ).toBeVisible();

  await page.getByRole("link", { name: new RegExp(registryBetaName) }).click();
  await expect(
    page.getByRole("heading", { name: registryBetaName })
  ).toBeVisible();

  const workspaceNav = page.getByRole("navigation", {
    name: "Project workspace views"
  });

  const journey = [
    ["Overview", /Readiness is blocked by canonical engineering state/],
    ["Profile", /Canonical Project Profile/],
    ["Blueprint", /Resolved engineering requirements/],
    ["Roadmap", /Dependency-aware Work Packages/],
    ["Quality", /Quality Gates and revision-specific evidence/],
    ["Prompt", /Derived execution projection/],
    ["Decisions", /Architecture Decisions/],
    ["Risks & Debt", /Risks & Technical Debt/],
    ["Releases & Lessons", /Exact revisions, rollback history and reusable learning/]
  ] as const;

  for (const [label, heading] of journey) {
    const link = workspaceNav.getByRole("link", { name: new RegExp(label) });
    await link.click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Project workspace views" })
        .getByRole("link", { name: new RegExp(label) })
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Project cannot be opened.")).toHaveCount(0);
  }

  await page.goto("/knowledge");
  await expect(
    page.getByRole("heading", { name: "Knowledge Library", exact: true })
  ).toBeVisible();
  await expect(
    page.getByText(/Reusable definitions are never project completion state/)
  ).toBeVisible();

  await page.getByRole("link", { name: "Use knowledge in guided setup" }).click();
  await expect(
    page.getByRole("heading", { name: "Build with evidence, not guesswork." })
  ).toBeVisible();
  await expect(page.getByText("Preview mode")).toBeVisible();

  await expect(
    page.getByText(/Not Found|Project cannot be opened|temporarily unavailable/)
  ).toHaveCount(0);
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

  const knowledgeCards = page.locator(".knowledge-card");
  await expect(knowledgeCards.first()).toBeVisible();
  await expect(
    page.locator(".knowledge-card", { hasText: "project:p6-registry-beta" })
  ).toHaveCount(0);
  await expect(
    page.locator(".knowledge-card", { hasText: "Project readiness" })
  ).toHaveCount(0);
  await expect(
    page.locator(".knowledge-card", { hasText: "Quality Gate PASS" })
  ).toHaveCount(0);
  await expect(
    page.locator(".knowledge-meta dt", { hasText: "Project" })
  ).toHaveCount(0);
  await expect(
    page.locator(".knowledge-meta dt", { hasText: "Gate" })
  ).toHaveCount(0);

  await page.screenshot({
    path: `artifacts/p6-005-knowledge-${testInfo.project.name}.png`,
    fullPage: true
  });
});

test("P7-003 critical surfaces provide usable keyboard landmarks and focus", async ({
  page
}, testInfo) => {
  await page.goto("/knowledge");

  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await expect(page.locator('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])')).toHaveCount(0);

  const disclosureSummary = page.locator("details.knowledge-disclosure summary").first();
  await disclosureSummary.focus();
  const focusStyle = await disclosureSummary.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth
    };
  });
  expect(focusStyle.outlineStyle).not.toBe("none");
  expect(focusStyle.outlineWidth).not.toBe("0px");

  await authenticateRegistryOwner(page);
  await page.goto("/projects/project%3Ap6-registry-beta/quality");

  const workspaceNav = page.getByRole("navigation", {
    name: "Project workspace views"
  });
  await expect(workspaceNav).toBeVisible();

  const qualityLink = workspaceNav.getByRole("link", { name: /Quality/ });
  await expect(qualityLink).toHaveAttribute("aria-current", "page");

  const qualitySkip = page.getByRole("link", { name: "Skip to main content" });
  await qualitySkip.focus();
  await expect(qualitySkip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  const gateStatus = page
    .locator(".workspace-quality-card", { hasText: "gate:quality:evidence" })
    .getByText(/candidate|pass|fail|not-ready/i)
    .first();
  await expect(gateStatus).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") {
    await page.screenshot({
      path: "artifacts/p7-003-accessibility-mobile.png",
      fullPage: true
    });
  }
});

test("P7-002 disclosures preserve critical truth and are keyboard operable", async ({
  page
}, testInfo) => {
  await authenticateRegistryOwner(page);

  await page.goto("/projects/project%3Ap6-registry-beta/quality");
  await expect(
    page.getByText("revision-p6-beta-quality", { exact: true }).first()
  ).toBeVisible();

  const qualityGateCard = page.locator(".workspace-quality-card", {
    hasText: "gate:quality:evidence"
  });
  const qualityDisclosure = qualityGateCard.locator(
    "details.quality-disclosure"
  );
  await expect(qualityDisclosure).not.toHaveAttribute("open", "");
  const qualitySummary = qualityDisclosure.locator("summary");
  await qualitySummary.focus();
  await page.keyboard.press("Enter");
  await expect(qualityDisclosure).toHaveAttribute("open", "");
  await expect(
    qualityDisclosure.getByText("evidence:p6-beta-quality", { exact: true })
  ).toBeVisible();

  await page.goto("/knowledge");
  await expect(
    page.getByText("Universal Constitution v0", { exact: true })
  ).toBeVisible();
  const knowledgeDisclosure = page
    .locator("details.knowledge-disclosure")
    .first();
  await expect(knowledgeDisclosure).not.toHaveAttribute("open", "");
  await knowledgeDisclosure.locator("summary").focus();
  await page.keyboard.press("Space");
  await expect(knowledgeDisclosure).toHaveAttribute("open", "");

  await page.goto("/projects/project%3Ap6-registry-beta/prompt");
  await expect(
    page.getByText(/^(Fresh|Stale)$/).first()
  ).toBeVisible();
  await expect(
    page.getByText("Current canonical source revision", { exact: true })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" })).toBeEnabled();
  await expect(page.locator(".prompt-card pre")).toBeVisible();

  const historyDisclosure = page.locator(
    "details.prompt-history-disclosure"
  );
  await expect(historyDisclosure).not.toHaveAttribute("open", "");
  await historyDisclosure.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(historyDisclosure).toHaveAttribute("open", "");
  await expect(
    historyDisclosure.locator(".prompt-history-row").first()
  ).toBeVisible();

  await page.goto(
    "/projects/project%3Ap6-registry-beta/releases-lessons"
  );
  await expect(page.getByText("v1.0.0", { exact: true })).toBeVisible();
  await expect(
    page.getByText("revision-p6-006-e2e", { exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText("evidence:p6-006-release", { exact: true })
  ).toBeVisible();

  const releaseDisclosure = page
    .locator("details.release-disclosure")
    .first();
  await expect(releaseDisclosure).not.toHaveAttribute("open", "");
  await releaseDisclosure.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(releaseDisclosure).toHaveAttribute("open", "");
  await expect(
    releaseDisclosure.getByText(/Rollback plan/)
  ).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") {
    await page.screenshot({
      path: "artifacts/p7-002-progressive-disclosure-mobile.png",
      fullPage: true
    });
  }
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
