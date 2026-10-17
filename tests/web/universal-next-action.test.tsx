import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import { UniversalNextAction } from "../../apps/web/app/_components/universal-next-action";
import {
  canonicalNextAction, trackedNextAction, type CanonicalNextActionKind
} from "../../apps/web/src/lib/universal-next-action";

const fromWeb = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { renderToStaticMarkup } = fromWeb("react-dom/server") as {
  renderToStaticMarkup: (component: unknown) => string
};
const { createElement } = fromWeb("react") as {
  createElement: (...args: unknown[]) => unknown
};

const current = JSON.parse(readFileSync(
  new URL("../../control/governance-current-view.v1.json", import.meta.url), "utf8"
)) as { repositories: {projectId:string;repository:string;registrationState:string}[] };
const privateServices = JSON.parse(readFileSync(
  new URL("../../control/private-execution-service-onboarding.v1.json", import.meta.url), "utf8"
)) as { entries: {projectId:string;repository:string;registrationState:string}[] };

function markup(action: ReturnType<typeof canonicalNextAction>): string {
  return renderToStaticMarkup(createElement(UniversalNextAction, {action}));
}

describe("Blueprint OS universal Next Action is never missing", () => {
  const kinds: CanonicalNextActionKind[] = [
    "define-gate", "resolve-failed-gate", "unblock-work",
    "review-candidate", "prepare-gate", "continue-work", "verify-release"
  ];

  it("maps every canonical Next Action kind to project-scoped live navigation without granting execution", () => {
    for(const kind of kinds){
      const projectId = "project:math-bauman";
      const result = canonicalNextAction({
        projectId, kind, label:"Readiness-specific task", reason:"Actual gate evidence is pending"
      });
      expect(result.executionAuthorized).toBe(false);
      expect(result.primary.href).toContain(encodeURIComponent(projectId));
      expect(result.secondary.href).toContain(encodeURIComponent(projectId));
      expect(result.primary.href).not.toBe(result.secondary.href);
      expect(result.primary.label).toBeTruthy();
      const html = markup(result);
      expect(html).toContain("Công việc tiếp theo");
      expect(html).toContain("data-execution-authorized=\"false\"");
      expect(html).toContain("Readiness-specific task");
      expect((html.match(/href=/g) ?? [])).toHaveLength(2);
      expect(html).not.toContain("Thực thi ngay");
    }
  });

  it("covers every tracked repository, including pending and baseline entries lacking canonical profile", () => {
    const repos=[...current.repositories,...privateServices.entries];
    expect(repos.length).toBeGreaterThan(15);
    const ids=new Set<string>();
    for(const item of repos){
      expect(ids.has(item.projectId)).toBe(false);
      ids.add(item.projectId);
      const result=trackedNextAction({
        projectId:item.projectId,
        repository:item.repository,
        hasCanonicalProfile:false,
        registrationState:item.registrationState as "sealed-baseline" | "admitted-registration" | "pending-onboarding"
      });
      expect(result.state).toBe("onboarding-required");
      expect(result.executionAuthorized).toBe(false);
      expect(result.primary.href).toBe("/projects/new");
      expect(result.secondary.href).toContain(item.repository);
      const html=markup(result);
      expect(html).toContain("Công việc tiếp theo");
      expect((html.match(/href=/g) ?? [])).toHaveLength(2);
      expect(html).not.toContain("data-execution-authorized=\"true\"");
    }
  });

  it("prevents pending-onboarding from inheriting execution-ready status even with a Profile", () => {
    const pending=trackedNextAction({
      projectId:"project:software-blueprint-qa-worker",
      repository:"BlueDragon33/Software-Blueprint-QA-Worker",
      hasCanonicalProfile:true,
      registrationState:"pending-onboarding"
    });
    expect(pending.state).toBe("onboarding-required");
    expect(pending.primary.href).toContain("/profile");
    expect(pending.executionAuthorized).toBe(false);
    const readyProfile=trackedNextAction({
      projectId:"project:blueprint-os",
      repository:"BlueDragon33/Software-Blueprint-Hub",
      hasCanonicalProfile:true,
      registrationState:"sealed-baseline"
    });
    expect(readyProfile.state).toBe("canonical-guidance");
    expect(readyProfile.primary.href).toContain("/projects/");
    expect(readyProfile.executionAuthorized).toBe(false);
  });
});
