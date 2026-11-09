import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { ProjectActionGuidance } from "../../apps/web/app/projects/[projectId]/_components/project-action-guidance";
import { buildNextActionBlueprintCandidate } from "../../packages/application/src/next-action-blueprint.candidate";

const fromWeb = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { renderToStaticMarkup } = fromWeb("react-dom/server") as {
  renderToStaticMarkup: (element: unknown) => string
};
const { createElement } = fromWeb("react") as { createElement: (...args: unknown[]) => unknown };
const source = readFileSync(new URL(
  "../../apps/web/app/projects/[projectId]/_components/readiness-overview.tsx", import.meta.url
), "utf8");
const ecosystemSource = readFileSync(new URL(
  "../../apps/web/app/ecosystem/ecosystem-directory.tsx", import.meta.url
), "utf8");
const guideSource = readFileSync(new URL(
  "../../apps/web/app/projects/[projectId]/_components/project-action-guidance.tsx", import.meta.url
), "utf8");
const contract = JSON.parse(readFileSync(new URL(
  "../../control/unified-next-action.candidate.v1.json", import.meta.url
), "utf8"));

const blueprint = buildNextActionBlueprintCandidate({
  projectId: "project:blueprint-os", profileVersion: 3,
  actionKind: "review-candidate",
  actionLabel: "Review the exact constitutional candidate",
  reason: "Canonical readiness requires source-bound review",
  readinessState: "attention", evidenceFreshness: "recorded-unverified"
});

describe("R33 centrally-sourced contextual actions — review-only", () => {
  it("renders functional HƯỚNG DẪN disclosure alongside one server NEXT ACTION", () => {
    const markup = renderToStaticMarkup(createElement(ProjectActionGuidance, { blueprint }));
    expect(markup).toContain("<button");
    expect(markup).toContain('type="button"');
    expect(markup).toContain("HƯỚNG DẪN");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("aria-controls=");
    expect(markup).not.toContain("CHAT → WORK");
    expect(markup).not.toContain("WORK → CHAT");
  });

  it("guidance toggles and explains the automatic plan without a clipboard prerequisite", () => {
    expect(guideSource).toContain("onClick={() => setOpen(value => !value)}");
    expect(guideSource).toContain("KẾ HOẠCH & ĐỊNH HƯỚNG");
    expect(guideSource).toContain("NEXT ACTION");
    expect(guideSource).not.toContain("navigator.clipboard.writeText");
    expect(guideSource).toContain("aria-expanded");
    expect(guideSource).toContain("Không cần sao chép");
    expect(guideSource).not.toMatch(/dispatchExecution\(|workflowExecutionJournal\.claim\(/);
  });

  it("has one clickable NEXT ACTION runner and sources prompts centrally", () => {
    expect(source).toContain("<ProjectActionGuidance blueprint={blueprint}");
    expect(source).toContain("buildNextActionBlueprintCandidate(");
    expect(source).toContain("<ProjectNextActionRunner");
    expect(source).toContain("<ProjectNextActionRunner");
    expect(source.split("<ProjectNextActionRunner").length - 1).toBe(1);
    expect(source).not.toContain("<form action=");
  });

  it("supports canonical and pending onboarding with one true primary route and a source fallback", () => {
    expect(ecosystemSource).toContain('registrationState === "pending-onboarding"');
    expect(ecosystemSource).toContain('eligible ? (');
    expect(ecosystemSource).toContain('href={provisioned.has(selected.projectId)');
    expect(ecosystemSource).toContain('"/projects/new"');
    expect(ecosystemSource).toContain(' + "/profile"');
    expect(ecosystemSource).toContain('href={"https://github.com/" + selected.repository}');
    expect(ecosystemSource).toContain('Mở hồ sơ không cấp quyền thực thi');
    expect(ecosystemSource).not.toContain("dispatchExecution(");
  });

  it("never treats prompt copy as execution or invents a source HEAD", () => {
    expect(source).toContain("sourceRevision: null");
    expect(contract.preflight.allowsWorkPackageExecution).toBe(false);
    expect(contract.futureExecutor.status).toBe("not-integrated");
    expect(contract.contextualActionControls.endToEnd.whenAbsent)
      .toBe("bounded-read-only-plan-run-with-explicit-runner-blocker");
    expect(contract.nextActionBlueprint.interactionModel.noCopyPromptAsPrerequisite).toBe(true);
  });

  it("prohibits app-specific prompt constitutions and keeps adoption unverified", () => {
    const c = contract.nextActionBlueprint;
    expect(c.mandatorySections.map((x: { id: string }) => x.id))
      .toEqual(["guide","direction","next-prompt","end-to-end-prompt"]);
    expect(c.adoptionDefault).toBe("NOT_ADOPTED");
    expect(c.prohibit).toContain("duplicate-constitutions");
    expect(c.requiredPerAppEvidence).toContain("real-current-source-HEAD");
    expect(c.hubPilot.status).toMatch(/not-verified/);
  });
});
