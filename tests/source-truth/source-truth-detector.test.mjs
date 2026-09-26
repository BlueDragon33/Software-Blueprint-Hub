import assert from "node:assert/strict";
import test from "node:test";

import {
  findSourceTruthViolations,
  parseCompassActiveWork,
  parsePhase9WorkPackages
} from "../../scripts/source-truth-lib.mjs";

const roadmap = [
  "# Phase 9",
  "",
  "Status: **P9-001 COMPLETE / P9-002 ACTIVE — COMPASS CONSTRUCTION**",
  "",
  ...Array.from({ length: 20 }, (_, index) => {
    const id = `P9-${String(index + 1).padStart(3, "0")}`;
    const status = index === 0 ? "COMPLETE" : index === 1 ? "ACTIVE / DEVELOPMENT CANDIDATE" : "PLANNED";
    return `### ${id} — Work ${index + 1}\nStatus: **${status}**\n`;
  })
].join("\n");

const compass = `
const projection = Object.freeze({
  currentStorey: Object.freeze({
    number: 12,
    total: 20,
    name: "Compass"
  }),
  releaseAuthority: "not-authorized",
  activeWork: Object.freeze({
    id: "P9-002",
    title: "Compass dashboard",
    storey: 12,
    status: "active"
  })
});
`;

const contract = JSON.stringify({
  readiness: { productionDeployment: "not-authorized" },
  policy: {
    metadataOnly: true,
    applicationManagementMayInventOperations: false,
    applicationManagementMayMutateCanonicalBlueprintState: false,
    applicationManagementMayPassQualityGates: false,
    applicationManagementMayAuthorizeProductionRelease: false
  }
});

const coherent = {
  readme: "Phase 9 Compass Construction: **ACTIVE**\nPhase 8 Reference Import Gate: **PASS — DEVELOPMENT BASELINE**",
  blueprint: "PHASE 8 REFERENCE IMPORT PASS — PHASE 9 COMPASS CONSTRUCTION ACTIVE",
  roadmap,
  compass,
  contract
};

test("parses one sequential active Work Package", () => {
  const items = parsePhase9WorkPackages(roadmap);
  assert.equal(items.length, 20);
  assert.equal(items.filter((item) => item.state === "active")[0].id, "P9-002");
});

test("parses Compass work/storey authority", () => {
  assert.deepEqual(parseCompassActiveWork(compass), {
    activeId: "P9-002",
    activeStorey: 12,
    currentStorey: 12,
    releaseAuthority: "not-authorized"
  });
});

test("passes a coherent source set", () => {
  assert.deepEqual(findSourceTruthViolations(coherent), []);
});

test("fails stale README and roadmap/Compass disagreement", () => {
  const broken = {
    ...coherent,
    readme: coherent.readme + "\nDesign bootstrap only",
    compass: compass.replace('id: "P9-002"', 'id: "P9-003"')
  };
  const violations = findSourceTruthViolations(broken);
  assert.ok(violations.some((item) => item.includes("Design bootstrap only")));
  assert.ok(violations.some((item) => item.includes("contradicts roadmap")));
});
