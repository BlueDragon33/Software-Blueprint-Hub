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
    version: "1.1.0",
    authorityLayer: "constitution",
    requirements: [
      {
        id: "module:product:purpose",
        kind: "module",
        depth: "basic",
        tags: ["product"],
        description: "Define users, jobs-to-be-done, constraints, and success evidence."
      },
      {
        id: "module:architecture:boundaries",
        kind: "module",
        depth: "standard",
        tags: ["architecture"],
        dependsOn: ["module:product:purpose"],
        description: "Define ownership, contracts, and dependency direction."
      },
      {
        id: "module:data:source-of-truth",
        kind: "module",
        depth: "standard",
        tags: ["data"],
        dependsOn: ["module:architecture:boundaries"],
        description: "Define canonical state, identity, versions, and lifecycle."
      },
      {
        id: "module:security:authority",
        kind: "module",
        depth: "standard",
        tags: ["security"],
        dependsOn: ["module:architecture:boundaries"],
        description: "Define trust boundaries, authentication, and authorization."
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
        description: "Define measurable tests, defects, gates, and evidence."
      },
      {
        id: "module:operations:release",
        kind: "module",
        depth: "standard",
        tags: ["operations"],
        dependsOn: ["module:quality:evidence"],
        description: "Define exact-revision promotion, recovery, and observability."
      },
      {
        id: "module:governance:evolution",
        kind: "module",
        depth: "standard",
        tags: ["governance"],
        dependsOn: ["module:architecture:boundaries"],
        description: "Define ADR, compatibility, deprecation, and debt policy."
      },
      {
        id: "module:architecture:structural-capacity",
        kind: "module",
        depth: "standard",
        tags: ["architecture", "capacity", "longevity"],
        dependsOn: ["module:architecture:boundaries"],
        description:
          "Preserve a credible future-scale path without speculative overbuilding or irreversible coupling."
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
          "Keep domain meaning portable across framework, provider, UI-library and AI-vendor evolution."
      },
      {
        id: "module:ux:product-elegance",
        kind: "module",
        depth: "standard",
        tags: ["ux", "design-system", "longevity"],
        dependsOn: ["module:ux:information-architecture"],
        description:
          "Define a calm, coherent and deliberately responsive visual system designed to age gracefully."
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
          "Apply defense in depth, least privilege, blast-radius containment, protected canonical state and tested recovery."
      },
      {
        id: "gate:quality:evidence",
        kind: "gate",
        depth: "standard",
        tags: ["quality"],
        dependsOn: ["module:quality:evidence"],
        description: "PASS requires revision-specific evidence."
      },
      {
        id: "gate:security:authority",
        kind: "gate",
        depth: "standard",
        tags: ["security"],
        dependsOn: ["module:security:authority"],
        description: "Protected mutations require trusted authorization."
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
          "PASS requires coherent visual quality and efficient realistic user journeys, not merely functional UI."
      },
      {
        id: "gate:durability:ageing-regression",
        kind: "gate",
        depth: "standard",
        tags: ["maintenance", "quality", "longevity"],
        dependsOn: ["module:maintenance:long-term-durability"],
        description:
          "PASS requires regression evidence appropriate to expected lifetime, upgrade risk and compatibility surface."
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
