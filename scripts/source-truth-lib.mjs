import fs from "node:fs";
import path from "node:path";

export function parsePhase9WorkPackages(roadmap) {
  const items = [];
  const pattern = /^### (P9-\d{3}) — ([^\n]+)\nStatus: \*\*([^*]+)\*\*/gm;
  for (const match of roadmap.matchAll(pattern)) {
    const rawStatus = match[3].trim();
    const state = rawStatus.startsWith("COMPLETE")
      ? "complete"
      : rawStatus.startsWith("ACTIVE")
        ? "active"
        : rawStatus.startsWith("PLANNED")
          ? "planned"
          : "unknown";
    items.push({
      id: match[1],
      title: match[2].trim(),
      rawStatus,
      state
    });
  }
  return items;
}

export function parseCompassActiveWork(compassSource) {
  const activeMatch = compassSource.match(
    /activeWork:\s*Object\.freeze\(\{\s*id:\s*"([^"]+)"[\s\S]*?storey:\s*(\d+)[\s\S]*?status:\s*"active"/
  );
  const storeyMatch = compassSource.match(
    /currentStorey:\s*Object\.freeze\(\{\s*number:\s*(\d+)/
  );
  const releaseMatch = compassSource.match(
    /releaseAuthority:\s*"([^"]+)"/
  );

  return {
    activeId: activeMatch?.[1] ?? null,
    activeStorey: activeMatch ? Number(activeMatch[2]) : null,
    currentStorey: storeyMatch ? Number(storeyMatch[1]) : null,
    releaseAuthority: releaseMatch?.[1] ?? null
  };
}

function requireContains(violations, label, value, token) {
  if (!value.includes(token)) {
    violations.push(`${label} is missing required truth marker: ${token}`);
  }
}

function forbidContains(violations, label, value, token) {
  if (value.includes(token)) {
    violations.push(`${label} contains stale/forbidden truth marker: ${token}`);
  }
}

export function findSourceTruthViolations(sources) {
  const violations = [];
  const workPackages = parsePhase9WorkPackages(sources.roadmap);
  const compass = parseCompassActiveWork(sources.compass);
  const contract = JSON.parse(sources.contract);

  const expectedIds = Array.from(
    { length: 20 },
    (_, index) => `P9-${String(index + 1).padStart(3, "0")}`
  );

  if (workPackages.length !== 20) {
    violations.push(
      `Phase 9 roadmap must define exactly 20 Work Packages; found ${workPackages.length}`
    );
  }

  const actualIds = workPackages.map((item) => item.id);
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    violations.push("Phase 9 Work Package IDs are missing, duplicated, or out of sequence");
  }

  const active = workPackages.filter((item) => item.state === "active");
  if (active.length !== 1) {
    violations.push(
      `Phase 9 must have exactly one ACTIVE Work Package; found ${active.length}`
    );
  }

  if (active.length === 1) {
    const activeIndex = workPackages.findIndex((item) => item.id === active[0].id);
    for (const item of workPackages.slice(0, activeIndex)) {
      if (item.state !== "complete") {
        violations.push(
          `${item.id} precedes active ${active[0].id} but is not COMPLETE`
        );
      }
    }
    for (const item of workPackages.slice(activeIndex + 1)) {
      if (item.state !== "planned") {
        violations.push(
          `${item.id} follows active ${active[0].id} but is not PLANNED`
        );
      }
    }

    const topStatus = sources.roadmap.match(/^Status: \*\*([^*]+)\*\*/m)?.[1] ?? "";
    if (!topStatus.includes(active[0].id) || !topStatus.includes("ACTIVE")) {
      violations.push(
        `Phase 9 top-level status does not identify active Work Package ${active[0].id}`
      );
    }

    if (compass.activeId !== active[0].id) {
      violations.push(
        `Compass active Work Package ${compass.activeId ?? "missing"} contradicts roadmap ${active[0].id}`
      );
    }
  }

  if (compass.activeStorey !== compass.currentStorey) {
    violations.push(
      `Compass current storey ${compass.currentStorey ?? "missing"} contradicts active Work Package storey ${compass.activeStorey ?? "missing"}`
    );
  }

  if (compass.releaseAuthority !== "not-authorized") {
    violations.push("Compass must keep Production release authority not-authorized");
  }

  requireContains(
    violations,
    "README",
    sources.readme,
    "Phase 9 Compass Construction: **ACTIVE**"
  );
  requireContains(
    violations,
    "README",
    sources.readme,
    "Phase 8 Reference Import Gate: **PASS — DEVELOPMENT BASELINE**"
  );
  forbidContains(violations, "README", sources.readme, "Design bootstrap only");
  forbidContains(
    violations,
    "README",
    sources.readme,
    "Application implementation is **not authorized**"
  );

  requireContains(
    violations,
    "BLUEPRINT-V0",
    sources.blueprint,
    "PHASE 8 REFERENCE IMPORT PASS — PHASE 9 COMPASS CONSTRUCTION ACTIVE"
  );
  forbidContains(
    violations,
    "BLUEPRINT-V0",
    sources.blueprint,
    "PHASE 8 BAUMAN REFERENCE IMPORT ACTIVE"
  );

  if (contract.readiness?.productionDeployment !== "not-authorized") {
    violations.push(
      "Application Management contract must keep productionDeployment=not-authorized"
    );
  }
  if (contract.policy?.metadataOnly !== true) {
    violations.push("Application Management contract must remain metadataOnly=true");
  }
  for (const key of [
    "applicationManagementMayInventOperations",
    "applicationManagementMayMutateCanonicalBlueprintState",
    "applicationManagementMayPassQualityGates",
    "applicationManagementMayAuthorizeProductionRelease"
  ]) {
    if (contract.policy?.[key] !== false) {
      violations.push(`Application Management contract policy ${key} must remain false`);
    }
  }

  forbidContains(
    violations,
    "Phase 9 roadmap",
    sources.roadmap,
    "PHASE 9 PASS"
  );

  return violations;
}

export function loadRepositoryTruth(root = process.cwd()) {
  const read = (relativePath) =>
    fs.readFileSync(path.join(root, relativePath), "utf8");

  return {
    readme: read("README.md"),
    blueprint: read("projects/blueprint-os/BLUEPRINT-V0.md"),
    roadmap: read("projects/blueprint-os/PHASE-9-COMPASS-CONSTRUCTION-WORK-PACKAGES.md"),
    compass: read("packages/application/src/compass-dashboard.ts"),
    contract: read("control/application-management.contract.json")
  };
}
