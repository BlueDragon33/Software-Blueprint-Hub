import {
  classifyCanonicalReadFailure
} from "../../apps/web/src/server/runtime-state";
import { describe, expect, it } from "vitest";

describe("canonical runtime failure classification", () => {
  it("separates authorization denial from runtime unavailability", () => {
    expect(
      classifyCanonicalReadFailure({ code: "AUTHORIZATION_DENIED" })
    ).toBe("forbidden");

    expect(
      classifyCanonicalReadFailure({ code: "DATABASE_UNAVAILABLE" })
    ).toBe("unavailable");

    expect(classifyCanonicalReadFailure(new Error("connection failed"))).toBe(
      "unavailable"
    );
  });

  it("fails closed to unavailable for unknown values", () => {
    expect(classifyCanonicalReadFailure(null)).toBe("unavailable");
    expect(classifyCanonicalReadFailure("AUTHORIZATION_DENIED")).toBe(
      "unavailable"
    );
  });
});
