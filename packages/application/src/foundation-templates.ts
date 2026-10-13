import type { ProjectProfile } from "@blueprint-os/contracts";
import {
  resolveBlueprint,
  type BlueprintTemplate,
  type ResolutionResult
} from "@blueprint-os/blueprint-engine";

const levelTemplate = (
  level: ProjectProfile["blueprintLevel"],
  requirements: BlueprintTemplate["requirements"]
): BlueprintTemplate => ({
  schemaVersion: "1.0.0",
  id: "template:level:" + level.toLowerCase(),
  version: "1.0.0",
  authorityLayer: "blueprint-level",
  activation: {
    all: [{ field: "blueprintLevel", operator: "equals", value: level }],
    explanation: "Applies to " + level + " projects"
  },
  requirements
});

export const universalConstitutionTemplateV1 = Object.freeze({
    schemaVersion: "1.0.0",
    id: "template:constitution:universal-v1",
    version: "1.3.0",
    authorityLayer: "constitution",
    requirements: [
      {
        id: "module:product:purpose",
        kind: "module",
        depth: "basic",
        tags: ["product"],
        description: "Define users, jobs-to-be-done, constraints, and success evidence. Apply R15/R21/R23: preserved objective, canonical B0–B2 COMPACT/B3–B5 STRUCTURED and context-aware vertical-slice intake. R28 additionally requires provenance, checked learning-state feedback and professional pedagogical acceptance for learning products. R29 preserves disciplinary identity and rejects cloned shells. R31 comprehensive Russian profiles require independent linguistic/pedagogical evidence; synthetic mastery never passes."
      },
      {
        id: "module:architecture:boundaries",
        kind: "module",
        depth: "standard",
        tags: ["architecture"],
        dependsOn: ["module:product:purpose"],
        description: "Define ownership, contracts, and dependency direction. Apply R2/R11/R25: one canonical owner, truthful catalog capability and independent B/E axes; no shadow registry. R32 academic profiles inherit one universal authority and existing study-plan ownership; no parallel constitutions or automatic S100/R200 implementation."
      },
      {
        id: "module:data:source-of-truth",
        kind: "module",
        depth: "standard",
        tags: ["data"],
        dependsOn: ["module:architecture:boundaries"],
        description: "Define canonical state, identity, versions, and lifecycle. Apply R5: scoped version-safe writes, idempotency, readback and recovery."
      },
      {
        id: "module:security:authority",
        kind: "module",
        depth: "standard",
        tags: ["security"],
        dependsOn: ["module:architecture:boundaries"],
        description: "Define trust boundaries, authentication, and authorization. R12 federation remains migration-gated; declarations and trust boundaries apply immediately; no forged or stale central approval."
      },
      {
        id: "module:ux:information-architecture",
        kind: "module",
        depth: "standard",
        tags: ["ux"],
        dependsOn: ["module:product:purpose"],
        description: "Define information architecture and critical user journeys."
      },
      {
        id: "module:quality:evidence",
        kind: "module",
        depth: "standard",
        tags: ["quality"],
        dependsOn: ["module:architecture:boundaries"],
        description: "Define measurable tests, defects, gates, and evidence. Apply R7/R10: bounded defect attempts and non-gamed quality cohorts."
      },
      {
        id: "module:operations:release",
        kind: "module",
        depth: "standard",
        tags: ["operations"],
        dependsOn: ["module:quality:evidence"],
        description: "Define exact-revision promotion, recovery, and observability. Apply R20: distinguish code/test/merge/deploy/acceptance and require truthful cleanup, rollback and restart evidence."
      },
      {
        id: "module:governance:evolution",
        kind: "module",
        depth: "standard",
        tags: ["governance"],
        dependsOn: ["module:architecture:boundaries"],
        description: "Define ADR, compatibility, deprecation, and debt policy. Apply R8/R16/R22: durable scoped checkpoints, one dependency-aware work queue and capability-based economical handoffs."
      },
      {
        id: "module:architecture:structural-capacity",
        kind: "module",
        depth: "standard",
        tags: ["architecture", "capacity", "longevity"],
        dependsOn: ["module:architecture:boundaries"],
        description:
          "Preserve a credible future-scale path without speculative overbuilding or irreversible coupling. Apply R18: measure architectural/UX entropy; no speculative scaffolds or destructive count reduction. R30 S100 is ten capacity bands in an existing profile/review, never a literal feature quota."
      },
      {
        id: "module:governance:architectural-longevity",
        kind: "module",
        depth: "standard",
        tags: ["governance", "compatibility", "longevity"],
        dependsOn: [
          "module:architecture:boundaries",
          "module:governance:evolution"
        ],
        description:
          "Keep domain meaning portable across framework, provider, UI-library and AI-vendor evolution. Apply R24: enrollment and reclassification require canonical profile/owner review; never downgrade risk for cost."
      },
      {
        id: "module:ux:product-elegance",
        kind: "module",
        depth: "standard",
        tags: ["ux", "design-system", "longevity"],
        dependsOn: ["module:ux:information-architecture"],
        description:
          "Define a calm, coherent and deliberately responsive visual system designed to age gracefully. Apply R13: shared status vocabulary with task-appropriate responsive layouts and no duplicate approval surfaces."
      },
      {
        id: "module:ux:premium-usability",
        kind: "module",
        depth: "standard",
        tags: ["ux", "product-quality"],
        dependsOn: [
          "module:product:purpose",
          "module:ux:information-architecture"
        ],
        description:
          "Make critical journeys efficient, comprehensible and commercially credible at realistic data sizes."
      },
      {
        id: "module:maintenance:long-term-durability",
        kind: "module",
        depth: "standard",
        tags: ["maintenance", "compatibility", "quality", "longevity"],
        dependsOn: [
          "module:architecture:boundaries",
          "module:data:source-of-truth",
          "module:quality:evidence",
          "module:operations:release"
        ],
        description:
          "Protect against dependency, schema, migration, browser/device, provider and UI-regression ageing."
      },
      {
        id: "module:security:fortress-resilience",
        kind: "module",
        depth: "standard",
        tags: ["security", "resilience", "recovery"],
        dependsOn: [
          "module:security:authority",
          "module:data:source-of-truth",
          "module:operations:release"
        ],
        description:
          "Apply defense in depth, least privilege, blast-radius containment, protected canonical state and tested recovery. Apply R26: separate governance, operations and app data/releases; test least privilege, isolation and independent recovery."
      },
      {
        id: "module:architecture:operational-sovereignty",
        kind: "module",
        depth: "standard",
        tags: ["architecture", "operations", "portability", "offline", "dependency"],
        dependsOn: [
          "module:architecture:boundaries",
          "module:data:source-of-truth",
          "module:operations:release"
        ],
        description:
          "Prefer local/offline-capable and provider-replaceable operation where practical; make external dependencies explicit, portable and recoverable."
      },
      {
        id: "gate:quality:evidence",
        kind: "gate",
        depth: "standard",
        tags: ["quality"],
        dependsOn: ["module:quality:evidence"],
        description: "PASS requires revision-specific evidence. Require exact revision, scope, truthful status, risk-appropriate checks, continuity and ecosystem evidence under R1/R3/R9/R17/R27; metrics never grant permission."
      },
      {
        id: "gate:security:authority",
        kind: "gate",
        depth: "standard",
        tags: ["security"],
        dependsOn: ["module:security:authority"],
        description: "Protected mutations require trusted authorization. Apply R14/R19: operational device approval never implies constitutional, business-data, privileged or Production authority."
      },
      {
        id: "gate:ux:human-acceptance",
        kind: "gate",
        depth: "standard",
        tags: ["ux"],
        dependsOn: ["module:ux:information-architecture"],
        description: "Critical user journeys require human UX acceptance."
      },
      {
        id: "gate:architecture:future-scale",
        kind: "gate",
        depth: "standard",
        tags: ["architecture", "capacity", "longevity"],
        dependsOn: ["module:architecture:structural-capacity"],
        description:
          "PASS requires evidence that present implementation does not needlessly block justified future scale."
      },
      {
        id: "gate:ux:commercial-quality",
        kind: "gate",
        depth: "standard",
        tags: ["ux", "product-quality"],
        dependsOn: [
          "module:ux:product-elegance",
          "module:ux:premium-usability"
        ],
        description:
          "PASS requires coherent visual quality and efficient realistic user journeys, not merely functional UI. R6 and WCAG 2.2 AA require measured final rendered/composited contrast: text 4.5:1, large text 3:1 (24px normal or 14pt bold), meaningful non-text 3:1; desktop/mobile/themes/states, fail-closed unknown colors and complex backgrounds, real human UX."
      },
      {
        id: "gate:durability:ageing-regression",
        kind: "gate",
        depth: "standard",
        tags: ["maintenance", "quality", "longevity"],
        dependsOn: ["module:maintenance:long-term-durability"],
        description:
          "PASS requires regression evidence appropriate to expected lifetime, upgrade risk and compatibility surface. Apply R4: reproduce, diagnose first divergence, minimal coherent fix and affected critical-journey regression."
      },
      {
        id: "gate:operations:dependency-sovereignty",
        kind: "gate",
        depth: "standard",
        tags: ["operations", "portability", "offline", "dependency"],
        dependsOn: ["module:architecture:operational-sovereignty"],
        description:
          "PASS requires an explicit dependency budget, degraded/offline behavior where applicable, portable data/exit paths, and no unjustified mandatory paid-provider lock-in."
      },
      {
        id: "gate:security:resilience-containment",
        kind: "gate",
        depth: "standard",
        tags: ["security", "resilience", "recovery"],
        dependsOn: ["module:security:fortress-resilience"],
        description:
          "PASS requires bounded authority, containment and recoverability evidence appropriate to consequence."
      }
    ]
  } satisfies BlueprintTemplate
);

export const foundationBlueprintTemplatesV1: readonly BlueprintTemplate[] =
  Object.freeze([
    universalConstitutionTemplateV1,
    levelTemplate("B0", [
      {
        id: "module:micro:release-definition",
        kind: "module",
        depth: "basic",
        dependsOn: ["module:product:purpose"]
      }
    ]),
    levelTemplate("B1", [
      {
        id: "module:small:regression",
        kind: "module",
        depth: "basic",
        dependsOn: ["module:quality:evidence"]
      }
    ]),
    levelTemplate("B2", [
      {
        id: "module:product:domain-model",
        kind: "module",
        depth: "standard",
        dependsOn: ["module:architecture:boundaries"]
      }
    ]),
    levelTemplate("B3", [
      {
        id: "module:system:integration",
        kind: "module",
        depth: "advanced",
        dependsOn: ["module:architecture:boundaries"]
      },
      {
        id: "module:system:observability",
        kind: "module",
        depth: "advanced",
        dependsOn: ["module:operations:release"]
      }
    ]),
    levelTemplate("B4", [
      {
        id: "module:platform:extension-contract",
        kind: "module",
        depth: "advanced",
        tags: ["platform", "extensibility"],
        dependsOn: ["module:architecture:boundaries"]
      },
      {
        id: "module:platform:compatibility",
        kind: "module",
        depth: "advanced",
        tags: ["platform", "compatibility"],
        dependsOn: ["module:governance:evolution"]
      },
      {
        id: "gate:platform:compatibility",
        kind: "gate",
        depth: "advanced",
        dependsOn: ["module:platform:compatibility"]
      }
    ]),
    levelTemplate("B5", [
      {
        id: "module:critical:threat-model",
        kind: "module",
        depth: "critical",
        dependsOn: ["module:security:authority"]
      },
      {
        id: "module:critical:disaster-recovery",
        kind: "module",
        depth: "critical",
        dependsOn: ["module:operations:release"]
      },
      {
        id: "gate:critical:independent-verification",
        kind: "gate",
        depth: "critical",
        dependsOn: ["module:quality:evidence"]
      }
    ])
  ]);

export function resolveFoundationBlueprintPreview(
  profile: ProjectProfile
): ResolutionResult {
  return resolveBlueprint({
    profile,
    templates: foundationBlueprintTemplatesV1
  });
}
