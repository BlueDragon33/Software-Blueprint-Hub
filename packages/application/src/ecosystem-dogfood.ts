import {
  createProjectBootstrapPlan,
  type ProjectBootstrapIntent,
  type ProjectBootstrapPlan
} from "./project-bootstrap";

export interface EcosystemDogfoodCase {
  readonly id: string;
  readonly sentinel: string;
  readonly expectedBlueprintLevel: ProjectBootstrapPlan["profile"]["blueprintLevel"];
  readonly intent: ProjectBootstrapIntent;
}

export interface EcosystemDogfoodResult {
  readonly kind: "ecosystem-dogfood-regression";
  readonly sourceRevision: string;
  readonly cases: readonly {
    readonly id: string;
    readonly projectId: string;
    readonly blueprintLevel: string;
    readonly roadmapItems: number;
  }[];
  readonly blockers: readonly string[];
  readonly universalCoreMutationAllowed: false;
  readonly crossProjectStateMergeAllowed: false;
  readonly productionReleaseAuthority: false;
}

export const blueprintOsDogfoodCasesV1: readonly EcosystemDogfoodCase[] =
  Object.freeze([
    Object.freeze({
      id: "blueprint-os-self",
      sentinel: "SELF_COMPASS_SENTINEL",
      expectedBlueprintLevel: "B4",
      intent: Object.freeze({
        name: "Blueprint OS SELF_COMPASS_SENTINEL",
        projectType: "engineering-platform",
        primaryUsers: ["software architect", "product engineer"],
        jobsToBeDone: ["Blueprint heterogeneous software systems safely."],
        dataSensitivity: "internal",
        persistence: "server",
        authentication: "required",
        authorization: "policy-based",
        offlineRequirement: "read",
        externalIntegrations: ["github", "deployment-provider", "application-management"],
        aiUse: "assistive",
        extensibilityRequirement: "plugins",
        expectedLifetime: "long-lived",
        deploymentTarget: "managed web platform",
        criticality: "high"
      })
    }),
    Object.freeze({
      id: "local-device-tool",
      sentinel: "LOCAL_MODEM_SENTINEL",
      expectedBlueprintLevel: "B3",
      intent: Object.freeze({
        name: "Local Device Tool LOCAL_MODEM_SENTINEL",
        projectType: "local-first-device-tool",
        primaryUsers: ["device owner"],
        jobsToBeDone: ["Inspect and manage a local device without cloud credential leakage."],
        dataSensitivity: "internal",
        persistence: "local",
        authentication: "optional",
        authorization: "simple",
        offlineRequirement: "read-write",
        externalIntegrations: [],
        aiUse: "none",
        extensibilityRequirement: "configuration",
        expectedLifetime: "years",
        deploymentTarget: "browser PWA",
        criticality: "standard"
      })
    }),
    Object.freeze({
      id: "learning-product",
      sentinel: "LEARNING_SENTINEL",
      expectedBlueprintLevel: "B2",
      intent: Object.freeze({
        name: "Learning Product LEARNING_SENTINEL",
        projectType: "learning-web-application",
        primaryUsers: ["learner", "teacher"],
        jobsToBeDone: ["Learn structured material with persistent progress."],
        dataSensitivity: "confidential",
        persistence: "server",
        authentication: "required",
        authorization: "role-based",
        offlineRequirement: "read",
        externalIntegrations: [],
        aiUse: "assistive",
        extensibilityRequirement: "configuration",
        expectedLifetime: "years",
        deploymentTarget: "managed web platform",
        criticality: "standard"
      })
    }),
    Object.freeze({
      id: "critical-policy-system",
      sentinel: "CRITICAL_POLICY_SENTINEL",
      expectedBlueprintLevel: "B5",
      intent: Object.freeze({
        name: "Critical Policy System CRITICAL_POLICY_SENTINEL",
        projectType: "critical-control-system",
        primaryUsers: ["authorized operator"],
        jobsToBeDone: ["Execute policy-controlled critical operations with recovery evidence."],
        dataSensitivity: "restricted",
        persistence: "hybrid",
        authentication: "required",
        authorization: "policy-based",
        offlineRequirement: "read-write",
        externalIntegrations: ["audit", "identity"],
        aiUse: "none",
        extensibilityRequirement: "configuration",
        expectedLifetime: "long-lived",
        deploymentTarget: "controlled infrastructure",
        criticality: "critical"
      })
    })
  ]);

export function runEcosystemDogfoodRegression(
  sourceRevision: string,
  cases: readonly EcosystemDogfoodCase[] = blueprintOsDogfoodCasesV1
): EcosystemDogfoodResult {
  const revision = sourceRevision.trim();
  if (!revision) throw new TypeError("Dogfood source revision is required");
  if (cases.length < 3) {
    throw new TypeError("Ecosystem dogfood requires at least three heterogeneous projects");
  }

  const ids = new Set<string>();
  const sentinels = new Set<string>();
  for (const item of cases) {
    if (ids.has(item.id)) throw new TypeError(`Duplicate dogfood case ${item.id}`);
    if (sentinels.has(item.sentinel)) {
      throw new TypeError(`Duplicate dogfood sentinel ${item.sentinel}`);
    }
    ids.add(item.id);
    sentinels.add(item.sentinel);
  }

  const plans = cases.map((item) => ({
    item,
    plan: createProjectBootstrapPlan(item.intent)
  }));
  const blockers: string[] = [];
  const projectIds = new Set<string>();

  for (const { item, plan } of plans) {
    if (plan.profile.blueprintLevel !== item.expectedBlueprintLevel) {
      blockers.push(
        `unexpected-blueprint-level:${item.id}:${plan.profile.blueprintLevel}!=${item.expectedBlueprintLevel}`
      );
    }
    if (projectIds.has(plan.profile.projectId)) {
      blockers.push(`duplicate-project-identity:${plan.profile.projectId}`);
    }
    projectIds.add(plan.profile.projectId);

    const serialized = JSON.stringify(plan);
    if (!serialized.includes(item.sentinel)) {
      blockers.push(`missing-own-sentinel:${item.id}`);
    }
    for (const other of cases) {
      if (other.id !== item.id && serialized.includes(other.sentinel)) {
        blockers.push(`cross-project-semantic-leak:${other.id}->${item.id}`);
      }
    }

    if (plan.canonicalMutationAllowed !== false) {
      blockers.push(`canonical-mutation-authority-leak:${item.id}`);
    }
    if (plan.requiresExplicitCreateConfirmation !== true) {
      blockers.push(`explicit-confirmation-missing:${item.id}`);
    }
  }

  return Object.freeze({
    kind: "ecosystem-dogfood-regression",
    sourceRevision: revision,
    cases: Object.freeze(
      plans.map(({ item, plan }) =>
        Object.freeze({
          id: item.id,
          projectId: plan.profile.projectId,
          blueprintLevel: plan.profile.blueprintLevel,
          roadmapItems: plan.roadmap.length
        })
      )
    ),
    blockers: Object.freeze(blockers.sort()),
    universalCoreMutationAllowed: false,
    crossProjectStateMergeAllowed: false,
    productionReleaseAuthority: false
  });
}
