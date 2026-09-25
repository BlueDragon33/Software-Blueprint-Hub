import {
  generatePromptPreviewAction,
  resolveBlueprintPreviewAction
} from "../../apps/web/app/actions";
import { describe, expect, it } from "vitest";

describe("App Shell server preview", () => {
  it("resolves a B4 Project Profile through the real versioned template catalog", async () => {
    const result = await resolveBlueprintPreviewAction({
      projectName: "Blueprint OS",
      projectType: "web-application",
      blueprintLevel: "B4"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.blueprint.requiredModules).toContain(
      "module:architecture:boundaries"
    );
    expect(result.blueprint.requiredModules).toContain(
      "module:platform:extension-contract"
    );
    expect(result.blueprint.requiredGates).toContain(
      "gate:ux:human-acceptance"
    );
    expect(result.templateVersions.length).toBeGreaterThan(1);
  });

  it("generates the execution prompt through Prompt Projection, not React text assembly", async () => {
    const resolved = await resolveBlueprintPreviewAction({
      projectName: "Blueprint OS",
      projectType: "web-application",
      blueprintLevel: "B4"
    });

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const result = await generatePromptPreviewAction({
      profile: resolved.profile,
      blueprint: resolved.blueprint,
      templateVersions: resolved.templateVersions,
      workTitle: "Verify the App Shell",
      gateReady: true
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.projection.content).toContain(
      "Verify the App Shell"
    );
    expect(result.projection.content).toContain(
      "evidence:preview:ux-review"
    );
    expect(result.projection.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.projection.sourceRevision).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("changes Prompt Projection source revision when UX evidence changes", async () => {
    const resolved = await resolveBlueprintPreviewAction({
      projectName: "Blueprint OS",
      projectType: "web-application",
      blueprintLevel: "B4"
    });

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const withoutEvidence = await generatePromptPreviewAction({
      profile: resolved.profile,
      blueprint: resolved.blueprint,
      templateVersions: resolved.templateVersions,
      workTitle: "Verify the App Shell",
      gateReady: false
    });
    const withEvidence = await generatePromptPreviewAction({
      profile: resolved.profile,
      blueprint: resolved.blueprint,
      templateVersions: resolved.templateVersions,
      workTitle: "Verify the App Shell",
      gateReady: true
    });

    expect(withoutEvidence.ok).toBe(true);
    expect(withEvidence.ok).toBe(true);
    if (!withoutEvidence.ok || !withEvidence.ok) return;

    expect(withEvidence.projection.sourceRevision).not.toBe(
      withoutEvidence.projection.sourceRevision
    );
  });
});
