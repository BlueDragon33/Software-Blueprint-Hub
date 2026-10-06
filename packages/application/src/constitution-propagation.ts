export type GovernedBlueprintLevel = "B0" | "B1" | "B2" | "B3" | "B4" | "B5";

export interface GovernedRepositoryDefinition {
  readonly repository: string;
  readonly branch: string;
  readonly projectId: string;
  readonly blueprintLevel: GovernedBlueprintLevel;
  readonly role: "authority-self" | "governed";
}

export interface ConstitutionAdoptionManifestSnapshot {
  readonly schemaVersion: "1.0.0";
  readonly policyId: string;
  readonly policyVersion: string;
  readonly projectId: string;
  readonly blueprintLevel: GovernedBlueprintLevel;
  readonly enforcementMode: "enforced";
  readonly inheritedPillars: readonly string[];
  readonly disabledPillars: readonly string[];
  readonly constitutionalWaivers: readonly string[];
  readonly evidenceAuthority: "canonical-quality-gates";
  readonly productionAuthority: "separate-explicit-release-gate";
}

export interface GovernedRepositoryAdoptionSnapshot {
  readonly repository: string;
  readonly branch: string;
  readonly sourceRevision: string;
  readonly manifest: ConstitutionAdoptionManifestSnapshot | null;
}

export type ConstitutionPropagationRepositoryState =
  | "current"
  | "migration-required"
  | "policy-ahead"
  | "invalid-adoption"
  | "unverified";

export interface ConstitutionMigrationPlan {
  readonly id: string;
  readonly repository: string;
  readonly projectId: string;
  readonly fromPolicyVersion: string | null;
  readonly toPolicyVersion: string;
  readonly requiredSteps: readonly string[];
  readonly externalRepositoryMutationAllowed: false;
  readonly canonicalProjectMutationAllowed: false;
  readonly qualityGatePassAllowed: false;
  readonly productionReleaseAuthority: false;
}

export interface ConstitutionPropagationRepositoryProjection {
  readonly repository: string;
  readonly branch: string;
  readonly projectId: string;
  readonly blueprintLevel: GovernedBlueprintLevel;
  readonly role: "authority-self" | "governed";
  readonly sourceRevision: string | null;
  readonly observedPolicyVersion: string | null;
  readonly state: ConstitutionPropagationRepositoryState;
  readonly blockers: readonly string[];
  readonly migrationPlan: ConstitutionMigrationPlan | null;
  readonly externalRepositoryMutationAllowed: false;
  readonly qualityGatePassAllowed: false;
  readonly productionReleaseAuthority: false;
}

export interface ConstitutionPropagationProjection {
  readonly kind: "constitution-ecosystem-propagation";
  readonly policyId: string;
  readonly activePolicyVersion: string;
  readonly totalRepositories: number;
  readonly currentRepositories: number;
  readonly migrationRequiredRepositories: number;
  readonly blockedRepositories: number;
  readonly repositories: readonly ConstitutionPropagationRepositoryProjection[];
  readonly externalRepositoryMutationAllowed: false;
  readonly automaticQualityGatePassAllowed: false;
  readonly productionReleaseAuthority: false;
  readonly boundaryNote: string;
}

const requiredPillarsV1_1 = Object.freeze([
  "structural-capacity",
  "architectural-longevity",
  "product-elegance",
  "premium-usability",
  "long-term-durability",
  "fortress-security-disaster-resilience"
]);

const requiredPillarsV1_2 = Object.freeze([
  ...requiredPillarsV1_1,
  "operational-sovereignty-dependency-minimization"
]);

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function semver(value: string, label: string): readonly [number, number, number] {
  const normalized = required(value, label);
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(normalized);
  if (!match) throw new TypeError(`${label} must use major.minor.patch`);
  return Object.freeze([
    Number(match[1]),
    Number(match[2]),
    Number(match[3])
  ]);
}

function compareVersion(left: string, right: string): number {
  const a = semver(left, "policy version");
  const b = semver(right, "policy version");
  for (let index = 0; index < 3; index += 1) {
    const delta = a[index]! - b[index]!;
    if (delta !== 0) return delta;
  }
  return 0;
}

function exactSha(value: string): boolean {
  return /^[a-f0-9]{40}$/.test(value);
}

function requiredPillarsForPolicyVersion(
  policyVersion: string
): readonly string[] {
  try {
    return compareVersion(policyVersion, "1.2.0") >= 0
      ? requiredPillarsV1_2
      : requiredPillarsV1_1;
  } catch {
    return Object.freeze([]);
  }
}

function migrationPlan(
  repository: GovernedRepositoryDefinition,
  fromPolicyVersion: string | null,
  activePolicyVersion: string
): ConstitutionMigrationPlan {
  return Object.freeze({
    id: `constitution-migration:${repository.repository}@${activePolicyVersion}`,
    repository: repository.repository,
    projectId: repository.projectId,
    fromPolicyVersion,
    toPolicyVersion: activePolicyVersion,
    requiredSteps: Object.freeze([
      "Update the repository adoption manifest to the published policy version.",
      "Resolve the project Blueprint under the target Universal Constitution.",
      "Create project Work Packages for newly required modules or gates; do not fabricate completion.",
      "Record a project dependency budget, including local/offline posture, external providers, cost class, data boundary, portability and exit path.",
      "Collect project-specific canonical Quality Gate evidence at the required Blueprint depth.",
      "Run Constitution Compliance and the repository's normal CI on the exact migration revision.",
      "Keep Production release authority separate from Constitution migration."
    ]),
    externalRepositoryMutationAllowed: false,
    canonicalProjectMutationAllowed: false,
    qualityGatePassAllowed: false,
    productionReleaseAuthority: false
  });
}

function validateManifest(
  definition: GovernedRepositoryDefinition,
  snapshot: GovernedRepositoryAdoptionSnapshot,
  policyId: string
): readonly string[] {
  const manifest = snapshot.manifest;
  if (!manifest) return Object.freeze(["adoption-manifest-unavailable"]);

  const blockers: string[] = [];
  if (manifest.schemaVersion !== "1.0.0") blockers.push("adoption-schema-unsupported");
  if (manifest.policyId !== policyId) blockers.push("policy-id-mismatch");
  if (manifest.projectId !== definition.projectId) blockers.push("project-id-mismatch");
  if (manifest.blueprintLevel !== definition.blueprintLevel) {
    blockers.push("blueprint-level-mismatch");
  }
  if (manifest.enforcementMode !== "enforced") blockers.push("enforcement-disabled");
  if (manifest.disabledPillars.length > 0) blockers.push("constitutional-pillar-disabled");
  if (manifest.constitutionalWaivers.length > 0) blockers.push("constitutional-waiver-present");
  if (manifest.evidenceAuthority !== "canonical-quality-gates") {
    blockers.push("evidence-authority-invalid");
  }
  if (manifest.productionAuthority !== "separate-explicit-release-gate") {
    blockers.push("production-authority-invalid");
  }

  const observedPillars = new Set(manifest.inheritedPillars);
  for (const pillar of requiredPillarsForPolicyVersion(manifest.policyVersion)) {
    if (!observedPillars.has(pillar)) {
      blockers.push(`required-pillar-missing:${pillar}`);
    }
  }

  return Object.freeze([...new Set(blockers)].sort());
}

export function buildConstitutionPropagationProjection(input: {
  readonly policyId: string;
  readonly activePolicyVersion: string;
  readonly governedRepositories: readonly GovernedRepositoryDefinition[];
  readonly snapshots: readonly GovernedRepositoryAdoptionSnapshot[];
}): ConstitutionPropagationProjection {
  const policyId = required(input.policyId, "policyId");
  semver(input.activePolicyVersion, "activePolicyVersion");

  const definitions = new Map<string, GovernedRepositoryDefinition>();
  for (const item of input.governedRepositories) {
    required(item.repository, "repository");
    required(item.branch, "branch");
    required(item.projectId, "projectId");
    if (definitions.has(item.repository)) {
      throw new TypeError(`Duplicate governed repository ${item.repository}`);
    }
    definitions.set(item.repository, item);
  }

  const snapshots = new Map<string, GovernedRepositoryAdoptionSnapshot>();
  for (const snapshot of input.snapshots) {
    if (snapshots.has(snapshot.repository)) {
      throw new TypeError(`Duplicate adoption snapshot ${snapshot.repository}`);
    }
    snapshots.set(snapshot.repository, snapshot);
  }

  const repositories = Object.freeze(
    [...definitions.values()]
      .sort((a, b) => a.repository.localeCompare(b.repository))
      .map((definition): ConstitutionPropagationRepositoryProjection => {
        const snapshot = snapshots.get(definition.repository);
        if (!snapshot) {
          return Object.freeze({
            repository: definition.repository,
            branch: definition.branch,
            projectId: definition.projectId,
            blueprintLevel: definition.blueprintLevel,
            role: definition.role,
            sourceRevision: null,
            observedPolicyVersion: null,
            state: "unverified",
            blockers: Object.freeze(["repository-snapshot-unavailable"]),
            migrationPlan: null,
            externalRepositoryMutationAllowed: false,
            qualityGatePassAllowed: false,
            productionReleaseAuthority: false
          });
        }

        const blockers: string[] = [];
        if (snapshot.branch !== definition.branch) blockers.push("default-branch-mismatch");
        if (!exactSha(snapshot.sourceRevision)) blockers.push("source-revision-invalid");
        blockers.push(...validateManifest(definition, snapshot, policyId));

        const observedPolicyVersion = snapshot.manifest?.policyVersion ?? null;
        if (observedPolicyVersion) {
          try {
            semver(observedPolicyVersion, "observed policy version");
          } catch {
            blockers.push("policy-version-invalid");
          }
        }

        if (blockers.length > 0 || !observedPolicyVersion) {
          return Object.freeze({
            repository: definition.repository,
            branch: definition.branch,
            projectId: definition.projectId,
            blueprintLevel: definition.blueprintLevel,
            role: definition.role,
            sourceRevision: snapshot.sourceRevision,
            observedPolicyVersion,
            state: "invalid-adoption",
            blockers: Object.freeze([...new Set(blockers)].sort()),
            migrationPlan: null,
            externalRepositoryMutationAllowed: false,
            qualityGatePassAllowed: false,
            productionReleaseAuthority: false
          });
        }

        const comparison = compareVersion(observedPolicyVersion, input.activePolicyVersion);
        const state: ConstitutionPropagationRepositoryState =
          comparison === 0
            ? "current"
            : comparison < 0
              ? "migration-required"
              : "policy-ahead";

        const stateBlockers =
          state === "policy-ahead"
            ? Object.freeze(["repository-policy-version-ahead-of-authority"])
            : Object.freeze([] as string[]);

        return Object.freeze({
          repository: definition.repository,
          branch: definition.branch,
          projectId: definition.projectId,
          blueprintLevel: definition.blueprintLevel,
          role: definition.role,
          sourceRevision: snapshot.sourceRevision,
          observedPolicyVersion,
          state,
          blockers: stateBlockers,
          migrationPlan:
            state === "migration-required"
              ? migrationPlan(definition, observedPolicyVersion, input.activePolicyVersion)
              : null,
          externalRepositoryMutationAllowed: false,
          qualityGatePassAllowed: false,
          productionReleaseAuthority: false
        });
      })
  );

  return Object.freeze({
    kind: "constitution-ecosystem-propagation",
    policyId,
    activePolicyVersion: input.activePolicyVersion,
    totalRepositories: repositories.length,
    currentRepositories: repositories.filter((item) => item.state === "current").length,
    migrationRequiredRepositories: repositories.filter(
      (item) => item.state === "migration-required"
    ).length,
    blockedRepositories: repositories.filter(
      (item) => item.state === "invalid-adoption" || item.state === "policy-ahead" || item.state === "unverified"
    ).length,
    repositories,
    externalRepositoryMutationAllowed: false,
    automaticQualityGatePassAllowed: false,
    productionReleaseAuthority: false,
    boundaryNote:
      "Propagation is a read-only deterministic plan from provenance-bound adoption snapshots. External repository mutation belongs to a scoped provider adapter, project Quality Gate PASS remains project-local, and Production authority remains separate."
  });
}
