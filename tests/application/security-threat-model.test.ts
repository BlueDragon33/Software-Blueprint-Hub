import { describe, expect, it } from "vitest";

import {
  blueprintOsThreatModelV1,
  buildSecurityThreatModel
} from "../../packages/application/src/security-threat-model";

describe("P9-014 Security Threat-model Hardening", () => {
  it("covers every mandatory threat category with no publish blocker", () => {
    expect(blueprintOsThreatModelV1.categoryCoverage).toEqual([
      "ai-authority",
      "credential",
      "cross-project-leakage",
      "data-integrity",
      "destructive-operation",
      "privilege-escalation",
      "provider-authority",
      "release-authority",
      "trust-boundary"
    ]);
    expect(blueprintOsThreatModelV1.openHighOrCritical).toEqual([]);
    expect(blueprintOsThreatModelV1.publishBlockers).toEqual([]);
    expect(blueprintOsThreatModelV1.productionReleaseAuthority).toBe(false);
    expect(blueprintOsThreatModelV1.aiAuthorityExpansionAllowed).toBe(false);
    expect(blueprintOsThreatModelV1.providerAuthorityExpansionAllowed).toBe(false);
  });

  it("fails closed when a high threat is marked mitigated without evidence", () => {
    expect(() =>
      buildSecurityThreatModel({
        projectId: "project:test",
        sourceRevision: "revision:test",
        trustZones: ["client", "server"],
        threats: [{
          id: "T-1",
          category: "trust-boundary",
          title: "Missing evidence",
          severity: "high",
          trustZone: "server",
          attackPath: "Boundary bypass.",
          mitigation: "Validate.",
          owner: "Core",
          evidence: [],
          status: "mitigated"
        }]
      })
    ).toThrow(/without evidence/i);
  });

  it("does not allow high or critical threats to be silently accepted", () => {
    expect(() =>
      buildSecurityThreatModel({
        projectId: "project:test",
        sourceRevision: "revision:test",
        trustZones: ["client", "server"],
        threats: [{
          id: "T-1",
          category: "credential",
          title: "Credential leak",
          severity: "critical",
          trustZone: "server",
          attackPath: "Raw credential.",
          mitigation: "Opaque refs.",
          owner: "Security",
          evidence: ["review:one"],
          status: "accepted"
        }]
      })
    ).toThrow(/cannot be silently accepted/i);
  });

  it("turns missing categories and open severe threats into publish blockers", () => {
    const model = buildSecurityThreatModel({
      projectId: "project:test",
      sourceRevision: "revision:test",
      trustZones: ["client", "server"],
      threats: [{
        id: "T-1",
        category: "trust-boundary",
        title: "Open boundary issue",
        severity: "high",
        trustZone: "server",
        attackPath: "Untrusted input.",
        mitigation: "Pending validation fix.",
        owner: "Core",
        evidence: [],
        status: "open"
      }]
    });

    expect(model.publishBlockers).toContain("open-high-critical-threat:T-1");
    expect(model.publishBlockers).toContain("missing-threat-category:credential");
  });

  it("rejects unknown trust zones and raw secret-like values", () => {
    expect(() =>
      buildSecurityThreatModel({
        projectId: "project:test",
        sourceRevision: "revision:test",
        trustZones: ["client", "server"],
        threats: [{
          id: "T-1",
          category: "credential",
          title: "Wrong zone",
          severity: "medium",
          trustZone: "database",
          attackPath: "Unknown boundary.",
          mitigation: "Scope zones.",
          owner: "Security",
          evidence: [],
          status: "open"
        }]
      })
    ).toThrow(/unknown trust zone/i);

    expect(() =>
      buildSecurityThreatModel({
        projectId: "project:test",
        sourceRevision: "revision:test",
        trustZones: ["client", "server"],
        threats: [{
          id: "T-1",
          category: "credential",
          title: "Secret leak",
          severity: "medium",
          trustZone: "server",
          attackPath: "Bearer abcdefghijklmnop",
          mitigation: "Redact.",
          owner: "Security",
          evidence: [],
          status: "open"
        }]
      })
    ).toThrow(/secret-like/i);
  });
});
