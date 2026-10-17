import { describe, expect, it } from "vitest";
import { preflightUnifiedNextAction, unifiedNextActionPresentation } from "../../packages/application/src/unified-next-action";
import type { ProjectReadinessSnapshot } from "../../packages/core/src/project-readiness";

type MinimalSnapshot = Pick<ProjectReadinessSnapshot, "projectId" | "nextAction">;
const projectId = "project:blueprint-os";
const actionKinds: Array<{
  kind: MinimalSnapshot["nextAction"]["kind"];
  route: string;
}> = [
  {kind:"define-gate",route:"quality"},
  {kind:"resolve-failed-gate",route:"quality"},
  {kind:"review-candidate",route:"quality"},
  {kind:"prepare-gate",route:"quality"},
  {kind:"unblock-work",route:"roadmap"},
  {kind:"continue-work",route:"roadmap"},
  {kind:"verify-release",route:"release-orchestration"}
];

function snapshot(kind: MinimalSnapshot["nextAction"]["kind"], id=projectId): MinimalSnapshot {
  return {projectId:id,nextAction:{kind,label:"Canonical next action",reason:"Not a permit to execute"}};
}

describe("Universal Blueprint OS Next Action presentation", () => {
  it.each(actionKinds)("$kind routes to one project-scoped step $route", ({kind,route}) => {
    const result=unifiedNextActionPresentation(snapshot(kind));
    expect(result.buttonCount).toBe(1);
    expect(result.label).toBe("Tiếp tục nhiệm vụ");
    expect(result.href).toBe(`/projects/${encodeURIComponent(projectId)}/${route}`);
    expect(result.behavior).toBe("navigate-to-canonical-workspace");
    expect(result.workHandoff.href).toBeNull();
  });

  it("prevents fake Work button even if a task genuinely needs Work", () => {
    const result=unifiedNextActionPresentation(snapshot("continue-work"),{requiresWork:true});
    expect(result.workHandoff.state).toBe("requires-verified-session");
    expect(result.workHandoff.href).toBeNull();
    expect(result.buttonCount).toBe(1);
  });

  it("does not create a second Work button from a generic chat/project URL", () => {
    const result=unifiedNextActionPresentation(snapshot("unblock-work"),{
      requiresWork:true
    });
    expect(JSON.stringify(result)).not.toMatch(/https:\/\/chatgpt\.com/);
  });

  it("cannot navigate using a noncanonical project identifier or an arbitrary action kind", () => {
    expect(() => unifiedNextActionPresentation(snapshot("continue-work","../admin")))
      .toThrow(/canonical project/);
    expect(() => unifiedNextActionPresentation(snapshot("not-supported" as MinimalSnapshot["nextAction"]["kind"])))
      .toThrow(/Unknown canonical/);
  });

  it("scopes paths to each independently named project (no cross-project state)", () => {
    const first=unifiedNextActionPresentation(snapshot("continue-work","project:bauman"));
    const second=unifiedNextActionPresentation(snapshot("continue-work","project:application-management"));
    expect(first.href).toBe("/projects/project%3Abauman/roadmap");
    expect(second.href).toBe("/projects/project%3Aapplication-management/roadmap");
    expect(first.href).not.toEqual(second.href);
  });
});


describe("One-button server preflight data contract", () => {
  const current={
    projectId:"project:blueprint-os",
    profileVersion:3,
    nextAction:{kind:"continue-work" as const,label:"Continue safely",reason:"Canonical"}
  };
  const intent={
    projectId:current.projectId,
    profileVersion:3,
    actionKind:"continue-work" as const
  };
  it("only permits read-only navigation after exact canonical revalidation", () => {
    const result=preflightUnifiedNextAction(intent,current);
    expect(result).toEqual({
      state:"current",href:"/projects/project%3Ablueprint-os/roadmap",
      mayExecute:false
    });
  });
  it("rejects stale profile recordVersion even if project and action still match", () => {
    expect(preflightUnifiedNextAction(intent,{...current,profileVersion:4}))
      .toMatchObject({state:"stale",reason:"profile-version",mayExecute:false});
  });
  it("rejects changed action instead of silently executing or redirecting elsewhere", () => {
    expect(preflightUnifiedNextAction(intent,{
      ...current,nextAction:{...current.nextAction,kind:"define-gate"}
    })).toMatchObject({state:"stale",reason:"action-changed",mayExecute:false});
  });
  it("rejects wrong-project, path-like and invalid-version intent", () => {
    expect(preflightUnifiedNextAction(intent,{...current,projectId:"project:ru-life"}))
      .toMatchObject({state:"stale",reason:"project"});
    expect(preflightUnifiedNextAction({...intent,projectId:"../admin"},current))
      .toMatchObject({state:"stale",reason:"invalid-intent"});
    expect(preflightUnifiedNextAction({...intent,profileVersion:0},current))
      .toMatchObject({state:"stale",reason:"invalid-intent"});
    expect(preflightUnifiedNextAction({...intent,profileVersion:Infinity},current))
      .toMatchObject({state:"stale",reason:"invalid-intent"});
  });
  it("does not accept a stale action kind that was not derived from a canonical snapshot", () => {
    expect(preflightUnifiedNextAction({
      ...intent,actionKind:"malicious" as typeof intent.actionKind
    },current)).toMatchObject({state:"stale",reason:"action-changed"});
  });
});
