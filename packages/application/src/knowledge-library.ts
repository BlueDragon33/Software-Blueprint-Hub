import {
  foundationBlueprintTemplatesV1
} from "./foundation-templates";

export type KnowledgeKind =
  | "constitution"
  | "template"
  | "reference"
  | "pattern"
  | "anti-pattern"
  | "reference-case";

export interface KnowledgeLibraryItem {
  readonly id: string;
  readonly kind: KnowledgeKind;
  readonly title: string;
  readonly summary: string;
  readonly version: string;
  readonly status: "design-baseline" | "implementation-baseline" | "active-template";
  readonly sourcePath: string;
  readonly authorityLayer?: string;
  readonly tags: readonly string[];
}

export interface KnowledgeLibrarySection {
  readonly kind: KnowledgeKind;
  readonly label: string;
  readonly description: string;
  readonly items: readonly KnowledgeLibraryItem[];
}

const referenceItems: readonly KnowledgeLibraryItem[] = Object.freeze([
  Object.freeze({
    id: "knowledge:constitution:universal-v0",
    kind: "constitution",
    title: "Universal Constitution v0",
    summary:
      "Long-lived engineering laws for product, architecture, data, UX, security, QA, operations and governance.",
    version: "0",
    status: "design-baseline",
    sourcePath: "docs/UNIVERSAL-CONSTITUTION.v0.md",
    authorityLayer: "constitution",
    tags: Object.freeze(["universal", "engineering-law"])
  }),
  Object.freeze({
    id: "knowledge:reference:template-resolution-v1",
    kind: "reference",
    title: "Template Resolution Contract v1",
    summary:
      "Deterministic authority-layer and conflict semantics for resolving Project Profiles into modules and gates.",
    version: "1",
    status: "implementation-baseline",
    sourcePath: "docs/TEMPLATE-RESOLUTION-CONTRACT.v1.md",
    tags: Object.freeze(["resolver", "templates", "authority"])
  }),
  Object.freeze({
    id: "knowledge:reference:ci-test-v1",
    kind: "reference",
    title: "CI / Test Contract v1",
    summary:
      "Repository quality evidence rules used to prevent green-CI from being confused with product acceptance.",
    version: "1",
    status: "implementation-baseline",
    sourcePath: "docs/CI-TEST-CONTRACT.v1.md",
    tags: Object.freeze(["quality", "ci", "evidence"])
  }),
  Object.freeze({
    id: "knowledge:reference:nfr-capacity-v1",
    kind: "reference",
    title: "NFR / Capacity Budgets v1",
    summary:
      "Engineering budgets and non-functional constraints used as validation targets rather than marketing claims.",
    version: "1",
    status: "implementation-baseline",
    sourcePath: "docs/NFR-CAPACITY-BUDGETS.v1.md",
    tags: Object.freeze(["nfr", "capacity", "operations"])
  }),
  Object.freeze({
    id: "knowledge:reference:phase0-audit",
    kind: "reference",
    title: "Phase 0 Reference Audit",
    summary:
      "Traceable reference audit that records the source material used during Blueprint OS design bootstrap.",
    version: "1",
    status: "design-baseline",
    sourcePath: "docs/PHASE-0-REFERENCE-AUDIT.md",
    tags: Object.freeze(["reference", "provenance"])
  }),
  Object.freeze({
    id: "knowledge:reference:adr-template",
    kind: "reference",
    title: "Architecture Decision Record template",
    summary:
      "Reusable ADR authoring structure. It is a template, not a project ArchitectureDecision record.",
    version: "1",
    status: "implementation-baseline",
    sourcePath: "adr/0000-template.md",
    tags: Object.freeze(["adr", "governance"])
  })
]);

const referenceCaseItems: readonly KnowledgeLibraryItem[] = Object.freeze([
  Object.freeze({
    id: "knowledge:reference-case:bauman-nextgen-v1",
    kind: "reference-case",
    title: "Bauman Next-Generation Platform",
    summary:
      "Complex learning-platform architecture reference used to test Blueprint OS extensibility, provenance, authority and evidence semantics without importing Bauman-specific domain rules into Universal Core.",
    version: "1",
    status: "design-baseline",
    sourcePath: "docs/reference-cases/BAUMAN-NEXTGEN-v1.md",
    authorityLayer: "reference",
    tags: Object.freeze([
      "bauman",
      "learning-platform",
      "reference-case",
      "architecture",
      "provenance"
    ])
  })
]);

const templateItems: readonly KnowledgeLibraryItem[] = Object.freeze(
  foundationBlueprintTemplatesV1.map((template) =>
    Object.freeze({
      id: "knowledge:" + template.id,
      kind: "template" as const,
      title: template.id
        .split(":")
        .slice(1)
        .join(" · ")
        .replaceAll("-", " "),
      summary:
        template.activation?.explanation ??
        "Reusable Blueprint definition applied by deterministic resolution.",
      version: template.version,
      status: "active-template" as const,
      sourcePath: "packages/application/src/foundation-templates.ts",
      authorityLayer: template.authorityLayer,
      tags: Object.freeze([
        template.authorityLayer,
        ...new Set(
          template.requirements.flatMap((requirement) => requirement.tags ?? [])
        )
      ])
    })
  )
);

const sectionDefinitions: readonly Omit<KnowledgeLibrarySection, "items">[] =
  Object.freeze([
    Object.freeze({
      kind: "constitution",
      label: "Constitutions",
      description:
        "Long-lived engineering laws. Project blueprints may deepen them but cannot silently override them."
    }),
    Object.freeze({
      kind: "template",
      label: "Blueprint Templates",
      description:
        "Versioned reusable definitions consumed by deterministic Blueprint resolution."
    }),
    Object.freeze({
      kind: "pattern",
      label: "Patterns",
      description:
        "Reusable proven approaches. No canonical Pattern records have been published yet."
    }),
    Object.freeze({
      kind: "anti-pattern",
      label: "Anti-patterns",
      description:
        "Reusable failure modes. No canonical Anti-pattern records have been published yet."
    }),
    Object.freeze({
      kind: "reference",
      label: "Reference Contracts",
      description:
        "Version-controlled design and engineering references with explicit provenance."
    }),
    Object.freeze({
      kind: "reference-case",
      label: "Reference Cases",
      description:
        "Versioned real-project architecture cases used for comparison, mapping and gap analysis without becoming project completion state."
    })
  ]);

const knowledgeItems: readonly KnowledgeLibraryItem[] = Object.freeze([
  ...referenceItems,
  ...referenceCaseItems,
  ...templateItems
]);

const knowledgeSections: readonly KnowledgeLibrarySection[] = Object.freeze(
  sectionDefinitions.map((section) =>
    Object.freeze({
      ...section,
      items: Object.freeze(
        knowledgeItems
          .filter((item) => item.kind === section.kind)
          .sort(
            (a, b) =>
              a.title.localeCompare(b.title) ||
              a.version.localeCompare(b.version)
          )
      )
    })
  )
);

const knowledgeById = new Map(
  knowledgeItems.map((item) => [item.id, item] as const)
);

export class KnowledgeLibraryApplicationService {
  list(): readonly KnowledgeLibrarySection[] {
    return knowledgeSections;
  }

  find(id: string): KnowledgeLibraryItem | null {
    return knowledgeById.get(id) ?? null;
  }
}
