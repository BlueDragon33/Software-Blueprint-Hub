import { describe, expect, it } from "vitest";

import {
  findBreakingChanges,
  migrationEvidenceRequired
} from "../../scripts/schema-compatibility-lib.mjs";

describe("schema compatibility guard", () => {
  it("classifies a newly required property as breaking", () => {
    const baseline = {
      $defs: {
        Example: {
          type: "object",
          properties: {
            name: { type: "string" },
            note: { type: "string" }
          },
          required: ["name"],
          additionalProperties: false
        }
      }
    };

    const current = {
      $defs: {
        Example: {
          type: "object",
          properties: {
            name: { type: "string" },
            note: { type: "string" }
          },
          required: ["name", "note"],
          additionalProperties: false
        }
      }
    };

    const changes = findBreakingChanges(baseline, current);

    expect(changes).toContain(
      "#/$defs/Example: property became required: note"
    );
    expect(migrationEvidenceRequired(changes)).toBe(true);
  });

  it("does not require migration evidence for an additive optional property", () => {
    const baseline = {
      $defs: {
        Example: {
          type: "object",
          properties: {
            name: { type: "string" }
          },
          required: ["name"],
          additionalProperties: false
        }
      }
    };

    const current = {
      $defs: {
        Example: {
          type: "object",
          properties: {
            name: { type: "string" },
            note: { type: "string" }
          },
          required: ["name"],
          additionalProperties: false
        }
      }
    };

    const changes = findBreakingChanges(baseline, current);

    expect(changes).toEqual([]);
    expect(migrationEvidenceRequired(changes)).toBe(false);
  });

  it("detects removed enum values as breaking", () => {
    const baseline = {
      $defs: {
        Example: {
          type: "string",
          enum: ["A", "B"]
        }
      }
    };

    const current = {
      $defs: {
        Example: {
          type: "string",
          enum: ["A"]
        }
      }
    };

    const changes = findBreakingChanges(baseline, current);

    expect(changes).toContain(
      '#/$defs/Example: enum value removed: "B"'
    );
  });
});
