import assert from "node:assert/strict";
import test from "node:test";
import { evaluateComputedContrast } from "../helpers/rendered-contrast.mjs";

const sample = (foreground, background) => ({ foreground,
  backgrounds: [{ color: background, image: "none", opacity: "1" }],
  fontSizePx: 16, fontWeight: 400, disabled: false });

test("computed color evidence rejects dark-on-dark overrides and accepts repaired colors", () => {
  assert.equal(evaluateComputedContrast(sample("rgb(24, 24, 24)", "rgb(12, 12, 12)")).status, "FAIL");
  assert.equal(evaluateComputedContrast(sample("rgb(255, 255, 255)", "rgb(12, 12, 12)")).status, "PASS");
});
test("malformed/nonfinite/out-of-range RGB and unsupported spaces fail closed", () => {
  for (const value of ["rgb(0,0,no)", "rgb(999,0,0)", "rgba(0,0,0,NaN)", "rgba(0,0,0,2)", "color(display-p3 1 1 1)"]) {
    assert.equal(evaluateComputedContrast(sample(value, "rgb(0,0,0)")).status, "UNVERIFIED");
  }
});
test("final alpha composition affects contrast instead of ignoring transparency", () => {
  assert.equal(evaluateComputedContrast(sample("rgba(255,255,255,0.1)", "rgb(0,0,0)")).status, "FAIL");
  const x = sample("rgb(0,0,0)", "rgba(255,255,255,0.5)");
  x.backgrounds.push({ color: "rgb(0,0,0)", image: "none", opacity: "1" });
  assert.equal(evaluateComputedContrast(x).status, "PASS");
});
test("complex media/gradients and group opacity cannot pass from token colors alone", () => {
  const x = sample("rgb(255,255,255)", "rgb(0,0,0)");
  x.backgrounds[0].image = "linear-gradient(black,white)";
  assert.equal(evaluateComputedContrast(x).status, "UNVERIFIED");
  x.backgrounds[0].image = "none";
  x.backgrounds[0].opacity = "0.5";
  assert.equal(evaluateComputedContrast(x).status, "UNVERIFIED");
});
test("large-text thresholds use exact 14pt bold without rounding contrast upward", () => {
  const x = sample("rgb(148,148,148)", "rgb(255,255,255)");
  assert.equal(evaluateComputedContrast(x).status, "FAIL");
  x.fontSizePx = 56 / 3; x.fontWeight = 700;
  assert.equal(evaluateComputedContrast(x).minimumRatio, 3);
  x.fontSizePx = 18.6;
  assert.equal(evaluateComputedContrast(x).minimumRatio, 4.5);
});
test("only an actual disabled control gets the applicable contrast exemption", () => {
  const x = sample("rgb(12,12,12)", "rgb(12,12,12)");
  x.disabled = true;
  assert.equal(evaluateComputedContrast(x).status, "EXEMPT");
});

test("rendering effects cannot pass using ordinary computed ink alone", () => {
  for (const effect of [{ filter: "brightness(0)" }, { backdropFilter: "blur(2px)" },
    { mixBlendMode: "multiply" }, { textFillColor: "rgb(0,0,0)" }]) {
    const x = sample("rgb(255,255,255)", "rgb(0,0,0)");
    Object.assign(x.backgrounds[0], effect);
    assert.equal(evaluateComputedContrast(x).status, "UNVERIFIED");
  }
});
