import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { ProjectActionGuidance } from "../../apps/web/app/projects/[projectId]/_components/project-action-guidance";

const fromWeb = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { renderToStaticMarkup } = fromWeb("react-dom/server") as {
  renderToStaticMarkup: (element: unknown) => string
};
const { createElement } = fromWeb("react") as {
  createElement: (...args: unknown[]) => unknown
};
const source = readFileSync(new URL(
  "../../apps/web/app/projects/[projectId]/_components/readiness-overview.tsx", import.meta.url
), "utf8");
const guideSource = readFileSync(new URL(
  "../../apps/web/app/projects/[projectId]/_components/project-action-guidance.tsx", import.meta.url
), "utf8");
const contract = JSON.parse(readFileSync(new URL(
  "../../control/unified-next-action.candidate.v1.json", import.meta.url
), "utf8"));

describe("R33 contextual action controls — review-only acceptance", () => {
  it("renders a real keyboard-accessible HƯỚNG DẪN button bound to a specific project", () => {
    const markup = renderToStaticMarkup(createElement(ProjectActionGuidance, {
      projectId: "project:blueprint-os",
      profileVersion: 3,
      actionTitle: "Review the exact constitutional candidate",
      reason: "Canonical readiness must remain source-bound"
    }));
    expect(markup).toContain("<button");
    expect(markup).toContain('type="button"');
    expect(markup).toContain("HƯỚNG DẪN");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("aria-controls=");
    expect(markup).not.toContain("CHAT → WORK");
    expect(markup).not.toContain("WORK → CHAT");
  });

  it("help actually toggles local presentation, without backend dispatch", () => {
    expect(guideSource).toContain("onClick={() => setOpen((current) => !current)}");
    expect(guideSource).toContain("{open ? (");
    expect(guideSource).toContain("role=\"region\"");
    expect(guideSource).not.toMatch(/dispatchExecution\(|workflowExecutionJournal\.claim\(/);
  });

  it("keeps ONE independent NEXT ACTION form wired to server reauthorization", () => {
    expect(source).toContain("<ProjectActionGuidance");
    expect(source).toContain("NEXT ACTION — {nextAction.label}");
    expect(source).toContain("action={continueCanonicalNextAction.bind(");
    expect(source.split("<form").length - 1).toBe(1);
    expect(source).toContain('type="submit"');
  });

  it("does not disguise read-only navigation as end-to-end executor", () => {
    expect(contract.preflight.allowsWorkPackageExecution).toBe(false);
    expect(contract.futureExecutor.status).toBe("not-integrated");
    expect(contract.contextualActionControls.endToEnd.whenAbsent)
      .toBe("show-truthful-disabled-or-guidance-state");
    expect(contract.contextualActionControls.nextAction.actualBehavior)
      .toBe("server-reauthorize-and-navigate");
  });

  it("requires separate real guidance + action proof before app adoption", () => {
    const c = contract.contextualActionControls;
    expect(c.distinctSemantics).toBe(true);
    expect(c.guidance.mustBeOperableButton).toBe(true);
    expect(c.nextAction.mustBeOperableControl).toBe(true);
    expect(c.adoptionProofs).toContain("interactive-help-toggle");
    expect(c.hubPilot.status).toMatch(/not-live-accepted/);
  });
});
