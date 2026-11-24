import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../../apps/web/app/projects/[projectId]/_components/universal-next-action.candidate.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../../apps/web/app/projects/[projectId]/_components/universal-next-action.candidate.module.css",import.meta.url),"utf8");
test("visible primary and secondary control without compulsory confirmation",()=>{
 assert.match(src,/Tiếp tục công việc/);
 assert.match(src,/Xem kế hoạch và bổ sung nhiệm vụ/);
 assert.match(src,/aria-expanded=\{reviewOpen\}/);
 assert.doesNotMatch(src,/\[approved,setApproved\]/);
 assert.doesNotMatch(src,/type="checkbox"/);
});
test("primary navigation never claims Agent execution",()=>{
 assert.match(src,/window.location.assign\(view.action.href\)/);
 assert.match(src,/Mở Workspace · Gỡ nút thắt/);
 assert.match(src,/Agent không tự chạy/);
});
test("scope changes only save PLANNED through the authorized server action",()=>{
 assert.match(src,/saveReviewedNextActionAction/);
 assert.match(src,/Lưu nhiệm vụ PLANNED/);
 assert.match(src,/requestIdRef.current=null/);
});
test("CSS preserves readable keyboard, mobile and reduced motion affordances",()=>{
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(css, /prefers-reduced-motion/);
 assert.match(css,/\.actions/);
});
