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
    expect(ui).toContain('option value="end-to-end"');
    expect(ui).toContain('onClick={() => void run(scope)}');
    expect(ui).toContain("TRONG QUYỀN HIỆN CÓ");
  });
  it("never advertises a read-only inspection as completed implementation",()=>{
    expect(ui).toContain("NEXT ACTION — TỰ LẬP KẾ HOẠCH & KIỂM TRA");
    expect(ui).toContain("KIỂM TRA TOÀN BỘ KẾ HOẠCH");
    expect(ui).toContain("MỞ BƯỚC TƯƠNG ỨNG TRONG DỰ ÁN (CHỈ ĐIỀU HƯỚNG)");
    expect(ui).toContain("fallbackHref");
    expect(ui).not.toContain("onClick={() => void run(\\"end-to-end\\")}");
    expect(ui).toContain("Chưa chạy sửa mã");
    expect(ui).toContain("Đã thực hiện");
    expect(ui).toContain("Chưa thực hiện / chờ điều kiện");
    expect(ui).toContain('result.state==="STALE"');
    expect(ui).toContain('if (response.state==="UNVERIFIED_MANUAL_OUTPUT") {');
    expect(ui).toContain('setCommandOutput("")');
    expect(ui).toContain("inFlight.current");
  });
  it("renders exactly one primary Next Action and one project-scoped fallback",()=>{
    expect(ui.match(/className="primary-button"/g)).toHaveLength(1);
    expect(ui.match(/href={fallbackHref}/g)).toHaveLength(1);
    expect(ui).toContain('value={scope}');
    expect(ui).toContain('disabled={busy}');
    expect(ui).toContain('run(scope)');
    expect(ui).not.toContain('onClick={() => void run("end-to-end")}');
    expect(ui).toContain('Chưa chạy sửa mã');
  });
  it("CMD analysis auto-rechecks canonical checkpoint without granting QA PASS",()=>{
    expect(ui).toContain('const refreshed = await startGuidedNextAction(');
    expect(ui).toContain('projectId,profileVersion,actionKind,actionLabel,"next"');
    expect(ui).toContain("setResult(refreshed)");
    expect(ui).toContain('refreshed.state==="STALE"');
    expect(ui).toContain('refreshed.state==="BLOCKED"');
    expect(ui).toContain("Kết quả CMD thủ công không đóng Quality Gate");
    expect(ui).toContain('if (response.state==="UNVERIFIED_MANUAL_OUTPUT") {');
    expect(actions).toContain("state:analyzed.status");
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
