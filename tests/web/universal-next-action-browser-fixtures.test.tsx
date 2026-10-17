import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { UniversalNextAction } from "../../apps/web/app/_components/universal-next-action";
import { canonicalNextAction, trackedNextAction } from "../../apps/web/src/lib/universal-next-action";

const fromWeb=createRequire(new URL("../../apps/web/package.json",import.meta.url));
const {renderToStaticMarkup}=fromWeb("react-dom/server") as {
  renderToStaticMarkup:(value:unknown)=>string
};
const {createElement}=fromWeb("react") as {
  createElement:(...args:unknown[])=>unknown
};
const style=readFileSync(
  new URL("../../apps/web/app/globals.css",import.meta.url),"utf8"
);
const outDir=process.env.BLUEPRINT_UI_FIXTURE_DIR;
function documentFor(action:ReturnType<typeof canonicalNextAction>):string {
  const actualReactHtml=renderToStaticMarkup(createElement(UniversalNextAction,{action}));
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${style}</style></head><body><main style="max-width:620px;margin:auto;padding:12px">${actualReactHtml}</main></body></html>`;
}

describe("actual shared React component generates offline Chromium fixture",()=>{
  it("emits two truthful, source-derived static UI states only to the isolated fixture directory",()=>{
    if (!outDir) throw new Error("BLUEPRINT_UI_FIXTURE_DIR is required for offline browser fixture emission");
    const canonical=canonicalNextAction({
      projectId:"project:blueprint-os",
      kind:"unblock-work",
      label:"Xác minh SHA runtime sau khởi động",
      reason:"Work Package phải hoàn thành kiểm định restart/readback"
    });
    const pending=trackedNextAction({
      projectId:"project:blueprint-russian-expert-engine",
      repository:"BlueDragon33/Blueprint-Russian-Expert-Engine",
      hasCanonicalProfile:false,
      registrationState:"pending-onboarding"
    });
    mkdirSync(resolve(process.cwd(),outDir),{recursive:true});
    for (const [name,action] of [["canonical",canonical],["pending",pending]] as const){
      expect(action.executionAuthorized).toBe(false);
      const html=documentFor(action);
      expect(html).toContain('data-execution-authorized="false"');
      expect((html.match(/href=/g)??[])).toHaveLength(2);
      writeFileSync(resolve(process.cwd(),outDir,`${name}.html`),html,{encoding:"utf8",flag:"w"});
    }
  });
});
