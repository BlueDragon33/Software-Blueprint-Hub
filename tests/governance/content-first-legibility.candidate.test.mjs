import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = path => readFileSync(root + path, "utf8");
const candidate = JSON.parse(read("control/content-first-legibility.candidate.v1.json"));
const published = JSON.parse(read("control/universal-constitution.contract.json"));
const version = JSON.parse(read("control/universal-constitution-version.json"));
const normative = read("docs/UNIVERSAL-CONSTITUTION.md");
const proposal = read("docs/amendments/CONSTITUTION-CONTENT-FIRST-LEGIBILITY-20261111-PROPOSAL.md");

test("candidate cannot masquerade as ratified law or release authority", () => {
  assert.equal(candidate.status, "PROPOSED_ONLY_NOT_RATIFIED");
  assert.deepEqual([candidate.authority.ratified,candidate.authority.published,candidate.authority.productionAuthority],[false,false,false]);
});
test("existing published Constitution version remains unchanged", () => {
  assert.equal(version.policyVersion, "1.3.0");
  assert.equal(candidate.effectiveConstitution, version.policyVersion);
  assert.match(normative, /## 11\. Computed contrast and legibility/);
});
test("inherit the existing UX gate rather than creating duplicate authority", () => {
  assert.equal(candidate.existingUxGate, published.computedContrast.requirementId);
  assert.equal(candidate.authority.newQualityGate, false);
  assert.equal(candidate.authority.newRegistry, false);
  assert.equal(candidate.authority.newDatabase, false);
});
test("normal, large and meaningful non-text thresholds cannot be weakened", () => {
  assert.ok(candidate.inheritRatiosFromPublishedContract);
  assert.ok(candidate.minimums.normalText >= published.computedContrast.normalTextRatio);
  assert.ok(candidate.minimums.largeText >= published.computedContrast.largeTextRatio);
  assert.ok(candidate.minimums.meaningfulNonText >= published.computedContrast.meaningfulNonTextRatio);
});
test("background is subordinate to meaningful content", () => {
  assert.equal(candidate.rule, "MEANINGFUL_CONTENT_PRIMARY_BACKGROUND_SUPPORTIVE");
  assert.match(proposal, /NỘI DUNG TRƯỚC, NỀN SAU/);
  for (const violation of ["dark-on-dark-essential-text","light-on-light-essential-text","low-opacity-required-text","media-or-gradient-obscures-content"]) {
    assert.ok(candidate.forbid.includes(violation));
  }
});
test("forms tables modals tooltips meaningful placeholders and documents covered", () => {
  for (const surface of ["data-table","modal","tooltip","form-field","placeholder-meaningful","long-document","document-export"]) {
    assert.ok(candidate.surfaces.includes(surface), surface);
  }
});
test("all important UI states and viewing modes are covered", () => {
  for (const state of ["focus-visible","disabled","error","selected","offline"]) assert.ok(candidate.states.includes(state));
  for (const mode of ["mobile-320-to-430","dark-theme","light-theme","controlled-print-or-pdf"]) assert.ok(candidate.environments.includes(mode));
});
test("no static-token-only PASS and no misleading ecosystem compliance", () => {
  assert.ok(candidate.forbid.includes("infer-pass-from-token-only"));
  assert.equal(candidate.evidence.finalCompositedBackground, true);
  assert.equal(candidate.evidence.gradientWorstCase, true);
  assert.equal(candidate.evidence.unknownComposite,"UNVERIFIED");
  assert.equal(candidate.adoption.noPortfolioPassAssumption, true);
});
test("historical active law already has release-blocking contrast", () => {
  assert.match(normative, /release-blocking UX gate/);
  assert.match(proposal, /Human Constitutional Authority/);
});
function linear(c) { const s=c/255; return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4; }
function luminance(hex) { const a=hex.replace("#","").match(/.{2}/g).map(x=>linear(parseInt(x,16)));return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]; }
function ratio(f,b) { const a=luminance(f), c=luminance(b);return (Math.max(a,c)+0.05)/(Math.min(a,c)+0.05); }
test("negative example identical foreground and background fails, clear dark on light passes", () => {
  assert.equal(ratio("#777777","#777777"),1);
  assert.ok(ratio("#777777","#777777") < candidate.minimums.normalText);
  assert.ok(ratio("#101010","#ffffff") >= candidate.minimums.normalText);
});
