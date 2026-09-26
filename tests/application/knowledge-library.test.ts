import { describe, expect, it } from "vitest";

import { KnowledgeLibraryApplicationService } from "../../packages/application/src";

describe("KnowledgeLibraryApplicationService", () => {
  it("exposes existing reusable definitions with provenance", () => {
    const library = new KnowledgeLibraryApplicationService();
    const sections = library.list();

    const constitutions = sections.find(
      (section) => section.kind === "constitution"
    );
    const templates = sections.find((section) => section.kind === "template");
    const references = sections.find((section) => section.kind === "reference");

    expect(constitutions?.items).toHaveLength(1);
    expect(constitutions?.items[0]).toMatchObject({
      sourcePath: "docs/UNIVERSAL-CONSTITUTION.v0.md",
      authorityLayer: "constitution"
    });
    expect(templates?.items.length).toBeGreaterThan(1);
    expect(
      templates?.items.every((item) => item.sourcePath.includes("foundation-templates"))
    ).toBe(true);
    expect(references?.items.length).toBeGreaterThan(1);
  });

  it("does not fabricate unpublished patterns or anti-patterns", () => {
    const sections = new KnowledgeLibraryApplicationService().list();

    for (const kind of ["pattern", "anti-pattern"] as const) {
      expect(sections.find((section) => section.kind === kind)?.items).toEqual([]);
    }
  });

  it("publishes the Bauman architecture as a provenance-safe reference case", () => {
    const library = new KnowledgeLibraryApplicationService();
    const item = library.find("knowledge:reference-case:bauman-nextgen-v1");

    expect(item).toMatchObject({
      kind: "reference-case",
      version: "1",
      status: "design-baseline",
      sourcePath: "docs/reference-cases/BAUMAN-NEXTGEN-v1.md",
      authorityLayer: "reference"
    });
    expect(item?.tags).toContain("provenance");
    expect(item).not.toHaveProperty("projectId");
    expect(item).not.toHaveProperty("gateStatus");
    expect(item).not.toHaveProperty("readiness");
  });

  it("keeps reusable knowledge separate from project completion state", () => {
    const items = new KnowledgeLibraryApplicationService()
      .list()
      .flatMap((section) => section.items);

    for (const item of items) {
      expect(item).not.toHaveProperty("projectId");
      expect(item).not.toHaveProperty("gateStatus");
      expect(item).not.toHaveProperty("readiness");
      expect(["design-baseline", "implementation-baseline", "active-template"])
        .toContain(item.status);
    }
  });

  it("finds a reusable item by stable library id", () => {
    const library = new KnowledgeLibraryApplicationService();
    const item = library.find("knowledge:constitution:universal-v0");

    expect(item?.title).toBe("Universal Constitution v0");
    expect(library.find("knowledge:missing")).toBeNull();
  });
});
