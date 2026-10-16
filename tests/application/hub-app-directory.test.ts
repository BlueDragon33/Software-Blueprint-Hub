import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appSearchKey, groupOrder, matchesApp, presentGovernedApps, presentTrackedApps } from "../../apps/web/src/lib/hub-app-directory";

const governed = JSON.parse(readFileSync(
  new URL("../../control/constitution-governed-repositories.json", import.meta.url), "utf8"
)) as { repositories: { projectId: string; repository: string; branch: string; blueprintLevel: string }[] };

const coverage = JSON.parse(readFileSync(
  new URL("../../control/governance-current-view.v1.json", import.meta.url), "utf8"
)) as { repositories: {
  projectId: string; repository: string; branch: string; blueprintLevel: string;
  registrationState: string; sourceRevision: string | null; observedAt: string | null;
}[] };

const privateServices = JSON.parse(readFileSync(
  new URL("../../control/private-execution-service-onboarding.v1.json", import.meta.url), "utf8"
)) as { entries: {
  projectId: string; repository: string; branch: string; blueprintLevel: string;
  registrationState: string; sourceRevision: string; observedAt: string; visibility: string;
  liveCrossRepoVerified: boolean;
}[] };

describe("Vietnamese-first ecosystem launcher", () => {
  const apps = presentGovernedApps(governed.repositories);
  it("indexes exactly the current governed repository truth; no invented app or deployment URL", () => {
    expect(apps).toHaveLength(15);
    expect(new Set(apps.map((item) => item.projectId)).size).toBe(15);
    expect(apps.map((item) => item.repository)).toEqual(governed.repositories.map((item) => item.repository));
    expect(apps.every((item) => groupOrder.includes(item.group) && !!item.icon && !!item.vi)).toBe(true);
    expect(apps.some((item) => "url" in item || "deployed" in item)).toBe(false);
  });
  it("shows 15 sealed, 2 admitted and 1 pending expert candidate without invented rights", () => {
    const tracked = presentTrackedApps(coverage.repositories);
    expect(tracked).toHaveLength(18);
    expect(tracked.filter((app) => app.registrationState === "admitted-registration")).toHaveLength(2);
    expect(tracked.filter((app) => app.registrationState === "pending-onboarding")).toHaveLength(1);
    expect(tracked.filter((app) => app.registrationState === "sealed-baseline")).toHaveLength(15);
    expect(tracked.some((app) => app.projectId === "project:ecad-design")).toBe(true);
    expect(tracked.some((app) => app.projectId === "project:cae-simulation")).toBe(true);
    expect(tracked.some((app) => app.projectId === "project:blueprint-russian-expert-engine" && app.registrationState === "pending-onboarding")).toBe(true);
    expect(tracked.every((app) => !("url" in app) && !("deployed" in app))).toBe(true);
    expect(() => presentTrackedApps([...coverage.repositories, coverage.repositories[0]!])).toThrow("Duplicate");
    expect(() => presentTrackedApps(coverage.repositories.map((app) =>
      app.projectId === "project:ecad-design" ? { ...app, sourceRevision: null } : app
    ))).toThrow("observed exact SHA");
  });

  it("stages 21 identities: 15 sealed, 2 admitted, 1 expert candidate and 3 private pending", () => {
    const tracked = presentTrackedApps([...coverage.repositories,...privateServices.entries]);
    expect(tracked).toHaveLength(21);
    expect(tracked.filter((app) => app.registrationState === "sealed-baseline")).toHaveLength(15);
    expect(tracked.filter((app) => app.registrationState === "admitted-registration")).toHaveLength(2);
    expect(tracked.filter((app) => app.registrationState === "pending-onboarding")).toHaveLength(4);
    expect(tracked.filter((app) => app.visibility === "private")).toHaveLength(3);
    expect(tracked.filter((app) => app.visibility === "private").every((app) => app.liveCrossRepoVerified === false)).toBe(true);
    expect(tracked.every((app) => !("productionAuthorized" in app) && !("deploymentUrl" in app))).toBe(true);
    expect(() => presentTrackedApps([...coverage.repositories,...privateServices.entries,privateServices.entries[0]!])).toThrow("Duplicate");
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
