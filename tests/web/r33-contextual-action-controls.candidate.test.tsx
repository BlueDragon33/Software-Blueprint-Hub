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

  it("guidance toggles sections and provides inspectable two copy-only prompts", () => {
    expect(guideSource).toContain("onClick={() => setOpen((current) => !current)}");
    expect(guideSource).toContain('setPanel("next")');
    expect(guideSource).toContain('setPanel("end-to-end")');
    expect(guideSource).toContain('navigator.clipboard.writeText(source)');
    expect(guideSource).toContain('readOnly');
    expect(guideSource).toContain('aria-live="polite"');
    expect(guideSource).not.toMatch(/dispatchExecution\(|workflowExecutionJournal\.claim\(/);
  });

  it("has one real NEXT ACTION revalidation form and sources prompts centrally", () => {
    expect(source).toContain("<ProjectActionGuidance blueprint={blueprint}");
    expect(source).toContain("buildNextActionBlueprintCandidate(");
    expect(source).toContain("NEXT ACTION — {nextAction.label}");
    expect(source).toContain("action={continueCanonicalNextAction.bind(");
    expect(source.split("<form").length - 1).toBe(1);
    expect(source).toContain('type="submit"');
  });

  it("never treats prompt copy as execution or invents a source HEAD", () => {
    expect(source).toContain("sourceRevision: null");
    expect(contract.preflight.allowsWorkPackageExecution).toBe(false);
    expect(contract.futureExecutor.status).toBe("not-integrated");
    expect(contract.contextualActionControls.endToEnd.whenAbsent)
      .toBe("show-truthful-disabled-or-guidance-state");
    expect(contract.nextActionBlueprint.display.promptCopiesAreNotExecutionButtons).toBe(true);
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
