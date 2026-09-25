import { expect, test } from "@playwright/test";

test("critical preview journey stays understandable and evidence-honest", async ({
  page
}, testInfo) => {
  await page.goto("/");
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

  await expect(page.getByText("Human UX review")).toBeVisible();
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
  await expect(page.getByText("Deterministic")).toBeVisible();
  await expect(page.locator("pre")).toContainText(
    "Review the first App Shell journey"
  );

  await page.screenshot({
    path: `artifacts/fnd009-${testInfo.project.name}.png`,
    fullPage: true
  });
});

test("keyboard path can reach the primary journey action", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Project name").focus();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
});
