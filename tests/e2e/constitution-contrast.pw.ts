import { expect, test } from "@playwright/test";
import { collectComputedContrast, evaluateComputedContrast } from "../helpers/rendered-contrast.mjs";

test("Constitution contrast negative fixture sees final global important overrides", async ({ page }) => {
  await page.setContent(`<style>body{background:white}.hero{background:rgb(12,12,12);color:white}
    h1{font:700 32px sans-serif;color:rgb(24,24,24)!important}
    .kpi{font:400 16px sans-serif;color:rgb(24,24,24)!important}</style>
    <div class="hero"><h1>Review title</h1><span class="kpi">Evidence count</span></div>`);
  for (const selector of ["h1", ".kpi"]) {
    const computed = await page.locator(selector).evaluate(collectComputedContrast);
    expect(evaluateComputedContrast(computed).status).toBe("FAIL");
  }
  // A scoped surface repair must beat the actual cascade, not merely declare a token.
  await page.addStyleTag({ content: ".hero h1,.hero .kpi{color:rgb(255,255,255)!important}" });
  for (const selector of ["h1", ".kpi"]) {
    const computed = await page.locator(selector).evaluate(collectComputedContrast);
    expect(evaluateComputedContrast(computed).status).toBe("PASS");
  }
});

test("Constitution complex surfaces stay unverified without rendered pixel evidence", async ({ page }) => {
  await page.setContent(`<style>body{background:white}.hero{background:linear-gradient(black,white);color:white}
    h1{font:700 32px sans-serif}</style><div class="hero"><h1>Gradient review</h1></div>`);
  const computed = await page.locator("h1").evaluate(collectComputedContrast);
  expect(evaluateComputedContrast(computed).status).toBe("UNVERIFIED");
});

test("Constitution unsupported rendering effects cannot produce a false PASS", async ({ page }) => {
  for (const effect of ["filter:brightness(0)", "backdrop-filter:blur(2px)",
    "mix-blend-mode:multiply", "-webkit-text-fill-color:black"]) {
    await page.setContent(`<style>body{background:black;color:white}h1{font:700 32px sans-serif;${effect}}</style><h1>Effect review</h1>`);
    const computed = await page.locator("h1").evaluate(collectComputedContrast);
    expect(evaluateComputedContrast(computed).status).toBe("UNVERIFIED");
  }
});
