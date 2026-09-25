import { encode } from "@auth/core/jwt";
import { expect, test, type Page } from "@playwright/test";

import type { ProjectProfile } from "../../packages/contracts/src";
import {
  createPrismaClient,
  PostgresProjectProfileRepository
} from "../../packages/persistence/src";

const e2eAuthSecret = process.env.AUTH_SECRET ?? "";

function registryProfile(
  projectId: string,
  profileId: string,
  name: string,
  level: ProjectProfile["blueprintLevel"],
  updatedAt: string
): ProjectProfile {
  return {
    id: profileId,
    projectId,
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: updatedAt,
      updatedAt
    },
    name,
    projectType: "web-application",
    blueprintLevel: level,
    primaryUsers: ["software-builder"],
    jobsToBeDone: ["Manage an evidence-backed software blueprint."],
    dataSensitivity: "internal",
    persistence: "server",
    authentication: "required",
    authorization: "role-based",
    offlineRequirement: "none",
    externalIntegrations: [],
    aiUse: "assistive",
    extensibilityRequirement: "templates",
    expectedLifetime: "long-lived",
    expectedScale: "project-defined",
    availabilityRequirement: "recoverable web service",
    complianceSecuritySensitivity: "project-defined",
    deploymentTarget: "managed web platform",
    maintenanceModel: "versioned continuous maintenance"
  };
}

async function seedRegistryForSystemOwner(projectSuffix: string): Promise<{
  readonly firstName: string;
  readonly secondName: string;
}> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for canonical registry E2E");
  }
  if (!e2eAuthSecret) {
    throw new Error("AUTH_SECRET is required for canonical registry E2E");
  }

  const prisma = createPrismaClient(process.env.DATABASE_URL);
  const profiles = new PostgresProjectProfileRepository(prisma);
  const projectIds = [
    `project:p6-registry-alpha-${projectSuffix}`,
    `project:p6-registry-beta-${projectSuffix}`
  ];
  const firstName = `Registry Alpha ${projectSuffix}`;
  const secondName = `Registry Beta ${projectSuffix}`;

  try {
    await prisma.project.deleteMany({ where: { id: { in: projectIds } } });

    await profiles.createProjectWithProfile(
      registryProfile(
        projectIds[0]!,
        `profile:p6-registry-alpha-${projectSuffix}`,
        firstName,
        "B2",
        "2026-09-25T13:00:00Z"
      )
    );
    await profiles.createProjectWithProfile(
      registryProfile(
        projectIds[1]!,
        `profile:p6-registry-beta-${projectSuffix}`,
        secondName,
        "B4",
        "2026-09-25T14:00:00Z"
      )
    );

    await prisma.principal.upsert({
      where: {
        provider_providerSubject: {
          provider: "github",
          providerSubject: "p6-e2e-owner"
        }
      },
      create: {
        id: "principal:p6-e2e-owner",
        provider: "github",
        providerSubject: "p6-e2e-owner",
        email: "p6-e2e@example.test"
      },
      update: {
        email: "p6-e2e@example.test"
      }
    });

    await prisma.systemBootstrap.upsert({
      where: { id: "system" },
      create: {
        id: "system",
        ownerPrincipalId: "principal:p6-e2e-owner"
      },
      update: {
        ownerPrincipalId: "principal:p6-e2e-owner"
      }
    });

    return { firstName, secondName };
  } finally {
    await prisma.$disconnect();
  }
}

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
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
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
  const suffix = testInfo.project.name.replaceAll(/[^a-z0-9]+/gi, "-").toLowerCase();
  const seeded = await seedRegistryForSystemOwner(suffix);
  await authenticateRegistryOwner(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByText(seeded.firstName, { exact: true })).toBeVisible();
  await expect(page.getByText(seeded.secondName, { exact: true })).toBeVisible();
  await expect(page.getByText("System Owner", { exact: true }).first()).toBeVisible();

  await page.screenshot({
    path: `artifacts/p6-001-registry-authenticated-${testInfo.project.name}.png`,
    fullPage: true
  });

  await page.getByRole("link", { name: new RegExp(seeded.secondName) }).click();
  await expect(
    page.getByRole("heading", { name: seeded.secondName })
  ).toBeVisible();
  await expect(page.getByText("Canonical", { exact: true })).toBeVisible();
  await expect(page.getByText("B4", { exact: true }).first()).toBeVisible();
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
