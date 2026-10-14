import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appSearchKey, groupOrder, matchesApp, presentGovernedApps } from "../../apps/web/src/lib/hub-app-directory";

const governed = JSON.parse(readFileSync(
  new URL("../../control/constitution-governed-repositories.json", import.meta.url), "utf8"
)) as { repositories: { projectId: string; repository: string; branch: string; blueprintLevel: string }[] };

describe("Vietnamese-first ecosystem launcher", () => {
  const apps = presentGovernedApps(governed.repositories);
  it("indexes exactly the current governed repository truth; no invented app or deployment URL", () => {
    expect(apps).toHaveLength(15);
    expect(new Set(apps.map((item) => item.projectId)).size).toBe(15);
    expect(apps.map((item) => item.repository)).toEqual(governed.repositories.map((item) => item.repository));
    expect(apps.every((item) => groupOrder.includes(item.group) && !!item.icon && !!item.vi)).toBe(true);
    expect(apps.some((item) => "url" in item || "deployed" in item)).toBe(false);
  });
  it("searches Vietnamese accents and plain text reliably", () => {
    expect(appSearchKey("Điều khiển Ếch")).toBe("dieu khien ech");
    expect(apps.filter((app) => matchesApp(app, "boi ech"))[0]?.projectId).toBe("project:boiech-ai");
    expect(apps.filter((app) => matchesApp(app, "HOA NHAP NGA"))[0]?.projectId).toBe("project:ru-life");
    expect(apps.filter((app) => matchesApp(app, "MPC PID"))[0]?.projectId).toBe("project:mpc-pid-system");
    expect(apps.filter((app) => matchesApp(app, "visa"))[0]?.projectId).toBe("project:application-management");
    expect(apps.filter((app) => matchesApp(app, "not-existing-app"))).toEqual([]);
  });
  it("refuses duplicate governed IDs and unidentified repos rather than labeling them randomly", () => {
    expect(() => presentGovernedApps([...governed.repositories, governed.repositories[0]!])).toThrow("Duplicate");
    expect(() => presentGovernedApps([{ projectId:"project:evil", repository:"fake/evil",branch:"main",blueprintLevel:"B4" }])).toThrow("Unknown");
  });
  it("exposes defensive readonly catalog projection", () => {
    expect(Object.isFrozen(apps)).toBe(true);
    expect(Object.isFrozen(apps[0])).toBe(true);
  });
});
