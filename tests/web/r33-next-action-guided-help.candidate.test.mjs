import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const runner = readFileSync(new URL("../../apps/web/app/projects/[projectId]/_components/project-next-action-runner.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../../apps/web/app/projects/[projectId]/_components/project-action-guidance.module.css", import.meta.url), "utf8");
const readiness = readFileSync(new URL("../../apps/web/app/projects/[projectId]/_components/readiness-overview.tsx", import.meta.url), "utf8");

test("support button calls current scoped read-only server action in one click", () => {
  assert.match(runner,/HỖ TRỢ NEXT ACTION — HƯỚNG DẪN TỪNG BƯỚC/);
  assert.match(runner,/onClick=\{\(\) => void run\("next", true\)\}/);
  assert.match(runner,/startGuidedNextAction\(projectId,profileVersion,actionKind,actionLabel,mode\)/);
});
test("the helper is readback-driven, not a copied prompt or new backend", () => {
  assert.match(runner,/assistanceSteps\(result\)/);
  assert.match(runner,/setShowAssistance\(guided\)/);
  assert.doesNotMatch(runner,/navigator\.clipboard|GenUI\.issueNewTurn|dispatchExecution\(/);
});
test("stale canonical action requires fresh checkpoint", () => {
  assert.match(runner,/result\.state === "STALE"/);
  assert.match(runner,/Không chạy theo checkpoint cũ/);
});
test("blocked authority requires scoped real grant; does not auto-approve", () => {
  assert.match(runner,/result\.mode === "requires-granted-runner"/);
  assert.match(runner,/không tự duyệt hay deploy/);
  assert.match(runner,/Không tự cấp grant, chứng nhận reviewer, QA PASS hay Production/);
});
test("CMD instructions are conditional and require redaction", () => {
  assert.match(runner,/if \(result\.command\)/);
  assert.match(runner,/Loại bỏ token, mật khẩu và dữ liệu cá nhân/);
  assert.match(runner,/CHƯA XÁC MINH/);
});
test("accessible responsive help command and panel are present", () => {
  assert.match(runner,/disabled=\{busy\}/);
  assert.doesNotMatch(runner,/aria-pressed=\{showAssistance\}/);
  assert.match(runner,/aria-label="Hỗ trợ NEXT ACTION theo Blueprint OS 1\.3\.0"/);
  assert.match(css,/\.assistPanel\s*\{/);
  assert.match(css,/\.runWrap > button \{ width: 100%/);
});
test("one shared runner remains on canonical project readiness view", () => {
  assert.equal(readiness.split("<ProjectNextActionRunner").length-1, 1);
  assert.match(runner,/generatedPlan/);
  assert.match(runner,/readback\?\.currentSourceRevision \?\? "UNVERIFIED"/);
});
