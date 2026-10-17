import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";

import { UniversalNextAction } from "../../apps/web/app/_components/universal-next-action";
import { canonicalNextAction, trackedNextAction } from "../../apps/web/src/lib/universal-next-action";

const fromWeb = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { renderToStaticMarkup } = fromWeb("react-dom/server") as {
  renderToStaticMarkup: (value: unknown) => string
};
const { createElement } = fromWeb("react") as {
  createElement: (...args: unknown[]) => unknown
};

function makeMarkup(action: ReturnType<typeof canonicalNextAction>): string {
  return renderToStaticMarkup(createElement(UniversalNextAction, {action}));
}

const stylesheet = readFileSync(
  new URL("../../apps/web/app/globals.css", import.meta.url), "utf8"
);
function documentFor(action: ReturnType<typeof canonicalNextAction>): string {
  // Actual shared React component and application CSS; NO fixture endpoint or
  // fake signed-in actor is allowed to be mistaken for full Next.js runtime.
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>${stylesheet}</style></head><body>
    <main style="max-width:620px;margin:auto;padding:12px">${makeMarkup(action)}</main>
    </body></html>`;
}

test("canonical Project Profile: offline Chromium renders visible task links without fake executor", async ({page}) => {
  const action = canonicalNextAction({
    projectId:"project:blueprint-os",
    kind:"unblock-work",
    label:"Xác minh SHA runtime sau khởi động",
    reason:"Work Package phải hoàn thành kiểm định restart/readback"
  });
  await page.setViewportSize({width:390,height:844});
  await page.setContent(documentFor(action));
  const region=page.getByRole("region",{name:"Công việc tiếp theo"});
  await expect(region).toBeVisible();
  await expect(region).toHaveAttribute("data-next-action-state","canonical-guidance");
  await expect(region).toHaveAttribute("data-execution-authorized","false");
  await expect(region.getByRole("heading",{name:"Xác minh SHA runtime sau khởi động"})).toBeVisible();
  const links=region.getByRole("link");
  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveAttribute("href","/projects/project%3Ablueprint-os/roadmap");
  await expect(links.nth(1)).toHaveAttribute("href","/projects/project%3Ablueprint-os/quality");
  for (let i=0;i<2;i++){
    const rect=await links.nth(i).boundingBox();
    expect(rect).not.toBeNull();
    expect(rect!.width).toBeGreaterThan(170);
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x+rect!.width).toBeLessThanOrEqual(390);
  }
  await page.keyboard.press("Tab");
  await expect(links.first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(links.nth(1)).toBeFocused();
  expect(await region.locator("button").count()).toBe(0);
});

test("pending-onboarding without Profile: offline Chromium displays only truthful setup/source links", async ({page}) => {
  const action = trackedNextAction({
    projectId:"project:blueprint-russian-expert-engine",
    repository:"BlueDragon33/Russian-Expert-Engine",
    hasCanonicalProfile:false,
    registrationState:"pending-onboarding"
  });
  await page.setViewportSize({width:360,height:780});
  await page.setContent(documentFor(action));
  const region=page.getByRole("region",{name:"Công việc tiếp theo"});
  await expect(region).toBeVisible();
  await expect(region).toHaveAttribute("data-next-action-state","onboarding-required");
  await expect(region).toHaveAttribute("data-execution-authorized","false");
  await expect(region).toContainText("chưa có");
  const links=region.getByRole("link");
  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveAttribute("href","/projects/new");
  await expect(links.nth(1)).toHaveAttribute("href","https://github.com/BlueDragon33/Russian-Expert-Engine");
  for (let i=0;i<2;i++){
    const rect=await links.nth(i).boundingBox();
    expect(rect).not.toBeNull();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x+rect!.width).toBeLessThanOrEqual(360);
  }
  expect(await region.locator('[data-execution-authorized="true"]').count()).toBe(0);
});

/*
 * This deliberately isolated offline browser smoke validates the actual
 * shared React component, navigation hrefs, keyboard and mobile layout.
 * It does NOT claim to test Next.js route navigation, live Auth/User session,
 * canonical ProjectProfile readback, App-Manager embedding or signed Gateway.
 * Those require separate authorized local acceptance, not a CI fixture.
 */
