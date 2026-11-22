import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../apps/web/app/projects/[projectId]/prompt/actions", () => ({
  saveReviewedNextActionAction: vi.fn()
}));
import { UniversalNextActionCandidate } from "../../apps/web/app/projects/[projectId]/_components/universal-next-action.candidate";

const fromWeb = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { renderToStaticMarkup } = fromWeb("react-dom/server") as {
  renderToStaticMarkup: (element: unknown) => string
};
const { createElement } = fromWeb("react") as {
  createElement: (...args: unknown[]) => unknown
};
const base = {
  projectId: "project:blueprint-os",
  projectName: "Blueprint OS",
  workPackageId: "work:review",
  sourceRevision: "sha256:" + "a".repeat(64),
  checkpointRef: null,
  verifiedAt: null,
  reason: "Canonically observed; no runner authority",
  action: {
    label: "Mở Prompt Workspace",
    kind: "internal-navigation" as const,
    href: "/projects/project%3Ablueprint-os/prompt"
  }
};
const render = (state: "ready" | "blocked" | "unverified") =>
  renderToStaticMarkup(createElement(UniversalNextActionCandidate, { view: { ...base, state } }));

describe("Universal Next Action v2 visible controls, honest read-only SSR", () => {
  it("shows primary immediate navigation and a secondary optional advanced control", () => {
    const html = render("ready");
    expect(html).toContain("Tiếp tục công việc");
    expect(html).toContain("Xem kế hoạch và bổ sung nhiệm vụ");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("work:review");
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain("Agent đang chạy");
  });
  it("does not label a blocked task READY or running", () => {
    const html = render("blocked");
    expect(html).toContain("Bị chặn");
    expect(html).toContain("Mở Workspace · Gỡ nút thắt");
    expect(html).not.toContain("Tiếp tục công việc");
  });
  it("does not pretend to have verified source when status is unknown", () => {
    const html = render("unverified");
    expect(html).toContain("Chưa xác minh");
    expect(html).toContain("Mở Workspace · Kiểm tra nguồn");
    expect(html).not.toContain("Sẵn sàng");
  });
});
