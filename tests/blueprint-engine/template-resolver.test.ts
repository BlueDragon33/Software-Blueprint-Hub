import { readFileSync } from "node:fs";

import type { ProjectProfile } from "../../packages/contracts/src";
import { validateContract } from "../../packages/contracts/src";
import {
  resolveBlueprint,
  type BlueprintTemplate,
  type ResolutionInput,
  type TemplateRequirement
} from "../../packages/blueprint-engine/src";
import { describe, expect, it } from "vitest";

const profile = JSON.parse(
  readFileSync(
    new URL("../contracts/fixtures/v1/project-profile.valid.json", import.meta.url),
    "utf8"
  )
) as ProjectProfile;

function template(
  id: string,
  authorityLayer: BlueprintTemplate["authorityLayer"],
  requirements: readonly TemplateRequirement[],
  options: {
    version?: string;
    activation?: BlueprintTemplate["activation"];
  } = {}
): BlueprintTemplate {
  return {
    schemaVersion: "1.0.0",
    id,
    version: options.version ?? "1.0.0",
    authorityLayer,
    requirements,
    ...(options.activation ? { activation: options.activation } : {})
  };
}

function input(templates: readonly BlueprintTemplate[]): ResolutionInput {
  return { profile, templates };
}

describe("Blueprint template resolver", () => {
  it("returns identical normalized output and fingerprint for identical input", () => {
    const templates = [
      template("template:constitution:base", "constitution", [
        {
          id: "module:product:purpose",
          kind: "module",
          depth: "basic",
          description: "Define product purpose"
        }
      ])
    ];

    const first = resolveBlueprint(input(templates));
    const second = resolveBlueprint(input(templates));

    expect(first).toEqual(second);
  });

  it("does not activate B4-only modules for a B0 profile", () => {
    const b0Profile: ProjectProfile = {
      ...profile,
      blueprintLevel: "B0"
    };

    const templates = [
      template(
        "template:level:b0",
        "blueprint-level",
        [{ id: "module:micro:purpose", kind: "module" }],
        {
          activation: {
            all: [{ field: "blueprintLevel", operator: "equals", value: "B0" }],
            explanation: "Applies to B0 projects"
          }
        }
      ),
      template(
        "template:level:b4",
        "blueprint-level",
        [{ id: "module:platform:plugin-registry", kind: "module" }],
        {
          activation: {
            all: [{ field: "blueprintLevel", operator: "equals", value: "B4" }],
            explanation: "Applies to B4 projects"
          }
        }
      )
    ];

    const result = resolveBlueprint({ profile: b0Profile, templates });
    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expect(result.blueprint.requiredModules).toContain("module:micro:purpose");
    expect(result.blueprint.requiredModules).not.toContain(
      "module:platform:plugin-registry"
    );
  });

  it("unions compatible template requirements deterministically", () => {
    const result = resolveBlueprint(
      input([
        template("template:constitution:base", "constitution", [
          {
            id: "module:data:contract",
            kind: "module",
            depth: "standard",
            tags: ["data"],
            dependsOn: ["module:product:purpose"]
          },
          { id: "module:product:purpose", kind: "module" }
        ]),
        template("template:type:web", "project-type", [
          {
            id: "module:data:contract",
            kind: "module",
            depth: "advanced",
            tags: ["web", "data"]
          }
        ])
      ])
    );

    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    const requirement = result.requirements.find(
      (item) => item.id === "module:data:contract"
    );
    expect(requirement).toMatchObject({
      required: true,
      depth: "advanced",
      tags: ["data", "web"],
      dependsOn: ["module:product:purpose"]
    });
  });

  it("fails closed on incompatible scalar constraints", () => {
    const result = resolveBlueprint(
      input([
        template("template:constitution:base", "constitution", [
          {
            id: "module:deployment:runtime",
            kind: "module",
            constraint: "node"
          }
        ]),
        template("template:type:conflict", "project-type", [
          {
            id: "module:deployment:runtime",
            kind: "module",
            constraint: "deno"
          }
        ])
      ])
    );

    expect(result.status).toBe("conflict");
    if (result.status !== "conflict") return;
    expect(result.conflicts[0]).toMatchObject({
      kind: "INCOMPATIBLE_VALUE",
      targetId: "module:deployment:runtime",
      field: "constraint"
    });
  });

  it("prevents a lower authority layer from weakening a mandatory security gate", () => {
    const result = resolveBlueprint(
      input([
        template("template:constitution:security", "constitution", [
          {
            id: "gate:security:authorization",
            kind: "gate",
            required: true,
            depth: "critical"
          }
        ]),
        template("template:project:weakening", "project-addition", [
          {
            id: "gate:security:authorization",
            kind: "gate",
            required: false,
            depth: "basic"
          }
        ])
      ])
    );

    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    const gate = result.requirements.find(
      (item) => item.id === "gate:security:authorization"
    );
    expect(gate?.required).toBe(true);
    expect(gate?.depth).toBe("critical");
    expect(result.blueprint.requiredGates).toContain(
      "gate:security:authorization"
    );
  });

  it("fails when a required module dependency is missing", () => {
    const result = resolveBlueprint(
      input([
        template("template:type:web", "project-type", [
          {
            id: "module:web:shell",
            kind: "module",
            dependsOn: ["module:design:tokens"]
          }
        ])
      ])
    );

    expect(result.status).toBe("conflict");
    if (result.status !== "conflict") return;
    expect(result.conflicts.some((item) => item.kind === "MISSING_DEPENDENCY")).toBe(
      true
    );
  });

  it("fails on dependency cycles", () => {
    const result = resolveBlueprint(
      input([
        template("template:type:cycle", "project-type", [
          {
            id: "module:cycle:a",
            kind: "module",
            dependsOn: ["module:cycle:b"]
          },
          {
            id: "module:cycle:b",
            kind: "module",
            dependsOn: ["module:cycle:a"]
          }
        ])
      ])
    );

    expect(result.status).toBe("conflict");
    if (result.status !== "conflict") return;
    expect(result.conflicts.some((item) => item.kind === "DEPENDENCY_CYCLE")).toBe(
      true
    );
  });

  it("changes the fingerprint when an exact template version changes", () => {
    const v1 = template(
      "template:type:web",
      "project-type",
      [{ id: "module:web:shell", kind: "module" }],
      { version: "1.0.0" }
    );
    const v2 = template(
      "template:type:web",
      "project-type",
      [{ id: "module:web:shell", kind: "module" }],
      { version: "1.1.0" }
    );

    const first = resolveBlueprint(input([v1]));
    const second = resolveBlueprint(input([v2]));

    expect(first.status).toBe("success");
    expect(second.status).toBe("success");
    if (first.status !== "success" || second.status !== "success") return;

    expect(first.blueprint.inputFingerprint).not.toBe(
      second.blueprint.inputFingerprint
    );
  });

  it("is invariant to input template list order", () => {
    const firstTemplate = template("template:constitution:base", "constitution", [
      { id: "module:product:purpose", kind: "module" }
    ]);
    const secondTemplate = template("template:type:web", "project-type", [
      { id: "module:web:shell", kind: "module" }
    ]);

    const forward = resolveBlueprint(input([firstTemplate, secondTemplate]));
    const reversed = resolveBlueprint(input([secondTemplate, firstTemplate]));

    expect(forward).toEqual(reversed);
  });

  it("promotes dependency closure and produces a schema-valid ResolvedBlueprint", () => {
    const result = resolveBlueprint(
      input([
        template("template:type:web", "project-type", [
          {
            id: "module:web:shell",
            kind: "module",
            dependsOn: ["module:design:tokens"]
          },
          {
            id: "module:design:tokens",
            kind: "module",
            required: false
          }
        ])
      ])
    );

    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expect(result.blueprint.requiredModules).toEqual([
      "module:design:tokens",
      "module:web:shell"
    ]);
    expect(validateContract("ResolvedBlueprint", result.blueprint).valid).toBe(
      true
    );
  });
});
