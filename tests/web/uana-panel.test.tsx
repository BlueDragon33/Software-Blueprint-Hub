import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../apps/web/app/projects/[projectId]/prompt/actions", () => ({
  verifyUanaSourceForCopyAction: vi.fn(async () => ({ok:false,message:"NOT_RUN_IN_SSR"}))
}));

import { UanaPanel } from "../../apps/web/app/projects/[projectId]/prompt/uana-panel";
import { createUanaProposal, type UanaSource } from "../../packages/application/src/universal-active-next-action";

// This is React semantic SSR, not interactive Playwright or Owner Preview acceptance.
const fromWeb = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const {renderToStaticMarkup} = fromWeb("react-dom/server") as {
  renderToStaticMarkup: (node: unknown) => string;
};
const {createElement} = fromWeb("react") as {
  createElement: (...args: unknown[]) => unknown;
};
const input: UanaSource = {
  projectId:"project:blueprint-os",
  projectName:"Software Blueprint Hub",
  constitutionVersion:"1.3.0",
  sourceRevision:"sha256:"+"a".repeat(64),
  projectionRevision:"sha256:"+"a".repeat(64),
  projectionId:"prompt:fixture",
  requiredGateIds:["REQUIRED_QA"],
  workPackages:[{
    projectId:"project:blueprint-os",id:"WP-UANA",title:"Preview feedback",
    status:"in-progress",dependencies:[],qualityGateIds:["REQUIRED_QA"]
  }],
  gates:[{projectId:"project:blueprint-os",id:"REQUIRED_QA",name:"Owner Preview",status:"candidate",evidenceComplete:true}]
};
describe("UANA responsive semantic React render (no host submission)", () => {
 it("renders 2 real radio choices and a single default recommendation behind active gate", () => {
   const proposal=createUanaProposal(input)!;
   const markup=renderToStaticMarkup(createElement(UanaPanel,{proposal}));
   expect(markup.match(/type="radio"/g)).toHaveLength(2);
   expect(markup.match(/checked=""/g)).toHaveLength(1);
   expect(markup).toContain("B — Gỡ chặn bằng chứng");
   expect(markup).toContain("Xem Active Next Action");
   expect(markup).not.toContain("<textarea");
   expect(markup).not.toContain("Sao chép để gửi");
 });
 it("displays fail-closed notice and no interactive choice on absent source", () => {
   const markup=renderToStaticMarkup(createElement(UanaPanel,{
     proposal:null,notice:"Nguồn chuẩn chưa được xác minh"
   }));
   expect(markup).toContain("Nguồn chuẩn chưa được xác minh");
   expect(markup).not.toContain('type="radio"');
   expect(markup).not.toContain("<textarea");
 });
 it("renders optional third option only after all relevant gates are PASS", () => {
   const proposal=createUanaProposal({...input,gates:[
     {...input.gates[0]!,status:"pass"}
   ]})!;
   const markup=renderToStaticMarkup(createElement(UanaPanel,{proposal}));
   expect(markup.match(/type="radio"/g)).toHaveLength(3);
   expect(markup).toContain("C — Thẩm định mở rộng dài hạn");
   expect(markup).toContain("UANA không tự gửi tin nhắn");
 });
});
