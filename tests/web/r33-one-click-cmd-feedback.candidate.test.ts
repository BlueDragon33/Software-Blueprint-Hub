import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const ui=read("apps/web/app/projects/[projectId]/_components/project-next-action-runner.tsx");
const actions=read("apps/web/app/projects/[projectId]/actions.ts");
const guide=read("apps/web/app/projects/[projectId]/_components/project-action-guidance.tsx");
const law=read("docs/amendments/CONSTITUTION-R33-R34-1.4.0-REVIEW.md");

describe("R33 one-click flow and conditional CMD support",()=>{
  it("click runs server workflow instead of copying prompt",()=>{
    expect(ui).toContain("startGuidedNextAction(projectId,profileVersion,actionKind,actionLabel,mode)");
    expect(guide).toContain("Không cần sao chép");
  });
  it("bounded end-to-end stays within actual authorization",()=>{
    expect(ui).toContain('run("end-to-end")');
    expect(ui).toContain("TRONG QUYỀN HIỆN CÓ");
  });
  it("server rechecks current project and action",()=>{
    expect(actions).toContain("loadProjectWorkspace(encodeURIComponent(projectId))");
    expect(actions).toContain("preflightUnifiedNextAction");
    expect(actions).toContain('return empty("STALE"');
  });
  it("plan is created before bounded gate inspection",()=>{
    expect(actions.indexOf("const step = createClickPlanCandidate")).toBeLessThan(
      actions.indexOf("const gates = await workspace.runtime.workQuality.listQualityGates"));
  });
  it("CMD paste is conditional on exact registered canonical task",()=>{
    expect(ui).toContain("{result.command ? (");
    expect(ui).toContain('id="next-action-cmd-output"');
    expect(actions).toContain("recognizedCanonicalCommandId(work.acceptanceCriteria)");
    expect(actions).toContain("work.meta.recordVersion!==displayedWorkVersion");
  });
  it("CMD result never becomes a Quality Gate PASS",()=>{
    expect(ui).toContain("Không tự nâng QA PASS");
    expect(actions).toContain("analyzePastedCommandResult(step.command,output)");
  });
  it("review law requires common task-adaptive interaction",()=>{
    expect(law).toContain("R33.9 — NEXT ACTION is one-click");
  });
});
