import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import { HubLauncher } from "../../apps/web/app/_components/hub-launcher";
import { HubSettings } from "../../apps/web/app/settings/hub-settings";
import { presentGovernedApps } from "../../apps/web/src/lib/hub-app-directory";

const fromWeb = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { renderToStaticMarkup } = fromWeb("react-dom/server") as {
  renderToStaticMarkup: (element: unknown) => string
};
const { createElement } = fromWeb("react") as { createElement: (...args: unknown[]) => unknown };
const governed = JSON.parse(readFileSync(
  new URL("../../control/constitution-governed-repositories.json", import.meta.url), "utf8"
)) as { repositories: { projectId: string; repository: string; branch: string; blueprintLevel: string }[] };

describe("Vietnamese App Home semantic render and safety", () => {
  const apps = presentGovernedApps(governed.repositories);
  const homeProject = {
    projectId: "project:blueprint-os",
    name: "Blueprint OS / Software Blueprint Hub",
    blueprintLevel: "B4", updatedAt: "2026-09-29T00:00:00Z"
  };
  it("renders Vietnamese icons with direct working destinations and honest repository status", () => {
    const markup = renderToStaticMarkup(createElement(HubLauncher, {
      projects: [homeProject], governedApps: apps, canManageEcosystem: true
    }));
    expect(markup).toContain("Ứng dụng của bạn");
    expect(markup).toContain("Tìm ứng dụng");
    expect(markup).toContain("Quản lý ứng dụng");
    expect(markup).toContain("Hệ sinh thái");
    expect(markup).toContain('href="/settings"');
    expect(markup).toContain('href="/ecosystem');
    expect(markup).toContain('href="/projects/project%3Ablueprint-os"');
    expect(markup).toContain("Xem thông tin");
    expect(markup).toContain("Mở dự án");
    expect(markup).not.toContain("PASS verified");
  });
  it("never leaks unprovisioned governed repository names when owner status is false", () => {
    const markup = renderToStaticMarkup(createElement(HubLauncher, {
      projects: [homeProject], governedApps: [], canManageEcosystem: false
    }));
    expect(markup).toContain("Dự án khác của tôi");
    expect(markup).not.toContain("Application Management");
    expect(markup).not.toContain("BOIECH");
    expect(markup).not.toContain('href="/ecosystem"');
  });
  it("renders real settings controls, preserving Vietnamese-first default", () => {
    const markup = renderToStaticMarkup(createElement(HubSettings));
    expect(markup).toContain("Tiếng Việt");
    expect(markup).toContain("Mật độ biểu tượng");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("Chỉ lưu");
  });
});
