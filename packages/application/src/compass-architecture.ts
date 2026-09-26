import {
  getBlueprintCompassProjection,
  type BlueprintCompassProjection
} from "./compass-dashboard";

export type CompassStoreyState = "accepted-baseline" | "active" | "planned";

export interface CompassStoreyDefinition {
  readonly number: number;
  readonly code: string;
  readonly name: string;
  readonly purpose: string;
  readonly source: string;
  readonly dependsOn: readonly number[];
}

export interface CompassStoreyProjection extends CompassStoreyDefinition {
  readonly state: CompassStoreyState;
  readonly stateReason: string;
}

const definitions: readonly CompassStoreyDefinition[] = Object.freeze([
  { number: 1, code: "S01", name: "Constitution & authority", purpose: "Protect non-overridable engineering laws, identity and authority boundaries.", source: "docs/UNIVERSAL-CONSTITUTION.v0.md", dependsOn: [] },
  { number: 2, code: "S02", name: "Contract & schema foundation", purpose: "Version canonical contracts, compatibility checks and fail-closed validation.", source: "schemas/vertical-slice.contracts.v1.json", dependsOn: [1] },
  { number: 3, code: "S03", name: "Canonical persistence", purpose: "Preserve stable IDs, transactions, concurrency and repository boundaries.", source: "adr/0002-postgresql-persistence.md", dependsOn: [2] },
  { number: 4, code: "S04", name: "Deterministic blueprint engine", purpose: "Resolve templates, dependencies, rationale and fingerprints deterministically.", source: "docs/TEMPLATE-RESOLUTION-CONTRACT.v1.md", dependsOn: [2, 3] },
  { number: 5, code: "S05", name: "Project lifecycle", purpose: "Separate project identity, profile, lifecycle and multi-project authority.", source: "packages/application/src/project-registry.ts", dependsOn: [3, 4] },
  { number: 6, code: "S06", name: "Planning graph", purpose: "Represent Roadmap, Work Package dependencies, blockers and sequencing.", source: "packages/application/src/work-quality-service.ts", dependsOn: [5] },
  { number: 7, code: "S07", name: "Quality evidence", purpose: "Keep Quality Gate decisions distinct from Work completion and retain evidence provenance.", source: "packages/application/src/project-readiness.ts", dependsOn: [6] },
  { number: 8, code: "S08", name: "Prompt projection", purpose: "Generate deterministic execution prompts from canonical engineering state.", source: "packages/application/src/prompt-projection.ts", dependsOn: [4, 6, 7] },
  { number: 9, code: "S09", name: "Professional workspace UX", purpose: "Provide coherent desktop, tablet and mobile engineering workflows.", source: "projects/blueprint-os/P6-009-PRODUCT-UX-GATE.md", dependsOn: [5, 6, 7, 8] },
  { number: 10, code: "S10", name: "Knowledge & reference system", purpose: "Separate reusable engineering knowledge from canonical project completion state.", source: "packages/application/src/knowledge-library.ts", dependsOn: [1, 4] },
  { number: 11, code: "S11", name: "Ecosystem management contract", purpose: "Expose lifecycle metadata to App Manage without transferring canonical authority.", source: "control/application-management.contract.json", dependsOn: [5, 7, 10] },
  { number: 12, code: "S12", name: "Compass dashboard", purpose: "Orient the builder around current phase, blockers, evidence, risk and next valid work.", source: "packages/application/src/compass-dashboard.ts", dependsOn: [6, 7, 11] },
  { number: 13, code: "S13", name: "Self-audit & drift detection", purpose: "Detect contradictions between code, roadmap, docs, gates and runtime projections.", source: "P9-004", dependsOn: [12] },
  { number: 14, code: "S14", name: "Project bootstrap factory", purpose: "Turn a new software idea into a validated Blueprint and dependency-aware starting roadmap.", source: "P9-005", dependsOn: [4, 12, 13] },
  { number: 15, code: "S15", name: "Reusable pattern governance", purpose: "Promote reviewed multi-project evidence into Patterns without one-project Core pollution.", source: "P9-006", dependsOn: [10, 13, 14] },
  { number: 16, code: "S16", name: "Operational resilience", purpose: "Prove backup, restore, observability, environment separation and degraded modes.", source: "P9-007 / P9-008", dependsOn: [3, 7, 13] },
  { number: 17, code: "S17", name: "Secure integrations", purpose: "Scope provider/plugin credentials, data exchange and authority boundaries.", source: "P9-009", dependsOn: [1, 11, 16] },
  { number: 18, code: "S18", name: "Bounded AI assistance", purpose: "Allow AI proposals without silent canonical mutation, gate PASS or release authority.", source: "P9-010", dependsOn: [8, 13, 17] },
  { number: 19, code: "S19", name: "Ecosystem dogfooding", purpose: "Run Blueprint OS against itself and heterogeneous real projects to expose semantic leakage.", source: "P9-018", dependsOn: [14, 15, 16, 17, 18] },
  { number: 20, code: "S20", name: "Compass Acceptance Gate", purpose: "Accept the ecosystem reference baseline only from exact evidence and professional review.", source: "P9-020", dependsOn: [19] }
].map((item) => Object.freeze({ ...item, dependsOn: Object.freeze([...item.dependsOn]) })));

export function resolveCompassArchitecture(
  compass: BlueprintCompassProjection = getBlueprintCompassProjection()
): readonly CompassStoreyProjection[] {
  return Object.freeze(
    definitions.map((storey) => {
      const state: CompassStoreyState =
        storey.number < compass.currentStorey.number
          ? "accepted-baseline"
          : storey.number === compass.currentStorey.number
            ? "active"
            : "planned";

      const stateReason =
        state === "accepted-baseline"
          ? "This structural layer is below the current construction storey and is part of the accepted development baseline."
          : state === "active"
            ? "This is the current construction storey. Its active Work Package still requires exact gate evidence."
            : "This storey is dependency-gated and cannot be claimed complete before the current/lower layers advance.";

      return Object.freeze({ ...storey, state, stateReason });
    })
  );
}

export function getCompassStorey(
  number: number,
  compass: BlueprintCompassProjection = getBlueprintCompassProjection()
): CompassStoreyProjection | null {
  return resolveCompassArchitecture(compass).find((item) => item.number === number) ?? null;
}
