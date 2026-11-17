import { test, expect } from "@playwright/test";

const path = "/tests/web/graph-harness/index.html";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("blueprint:hub:language", "en"));
  await page.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
});

test("overview, search, source trace, independent states and impact filters work", async ({ page }) => {
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Graph Intelligence Studio" })).toBeVisible();
  await expect(page.locator("button[data-kind]")).toHaveCount(12);
  await page.getByLabel("Search graph", { exact: true }).fill("evidence:graph");
  await expect(page.locator("button[data-kind]")).toHaveCount(1);
  await page.locator("button[data-kind]").click();
  const detail = page.getByRole("region", { name: "Selected node details" });
  await expect(detail).toContainText("artifact:test-fixture");
  await expect(detail).toContainText("canonical-record");
  await expect(detail).toContainText("unverified");
  await expect(detail).toContainText("Direct relationships (2)");
  await detail.getByRole("button", { name: "Evidence Gate", exact: true }).click();
  await expect(detail).toContainText("Selected node is outside the current view");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await page.getByLabel("View scope").selectOption("records");
  await page.locator("button[data-kind='gate-evidence']").click();
  await page.getByRole("button", { name: "Impact only", exact: true }).click();
  await expect(page.locator("button[data-kind='release']")).toHaveCount(1);
  await expect(page.locator("button[data-kind='work-package']")).toHaveCount(2);
  await page.getByLabel("Relationship", { exact: true }).selectOption("dependency");
  await expect(page.locator("button[data-kind]")).toHaveCount(1);
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await page.getByLabel("Search graph", { exact: true }).fill("absent-record");
  await expect(page.getByText("No source records match these filters", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Show overview" }).click();
  await expect(page.locator("button[data-kind]")).toHaveCount(12);
});

test("keyboard selection, zoom, pan, responsive layout and local-only operation", async ({ page, isMobile }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(path);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.getByLabel("Zoom level")).toHaveText("125%");
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect(page.getByLabel("Zoom level")).toHaveText("100%");
  const viewport = page.getByRole("region", { name: "Scrollable intelligence graph" });
  await viewport.evaluate(e => { e.scrollTop = 100; e.scrollLeft = 80; });
  expect(await viewport.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  if (!isMobile) {
    const box = (await viewport.boundingBox())!;
    await page.mouse.move(box.x + 8, box.y + 200); await page.mouse.down();
    await page.mouse.move(box.x + 8, box.y + 130, { steps: 6 }); await page.mouse.up();
    expect(await viewport.evaluate(e => e.scrollTop)).toBeGreaterThan(100);
  }
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  expect(await viewport.evaluate(e => e.scrollTop)).toBe(0);
  const first = page.locator("button[data-kind]").first();
  await first.focus(); await page.keyboard.press("Enter"); await expect(first).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `artifacts/graph-${test.info().project.name}.png`, fullPage: true });
});

test("computed text, placeholder and non-text contrast meets inherited thresholds", async ({ page }) => {
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Graph Intelligence Studio" })).toBeVisible();
  await page.locator("button[data-kind]").first().focus();
  const measurement = await page.evaluate(() => {
    const studio = document.querySelector("section[aria-labelledby]")!;
    const parse = (s: string): number[] => (s.match(/[\d.]+/g) ?? []).map(Number);
    const blend = (a: number[], b: number[]) => {
      const opacity = a[3] ?? 1;
      return [0, 1, 2].map(i => a[i]! * opacity + b[i]! * (1 - opacity));
    };
    const background = (e: Element): number[] => {
      const chain: Element[] = []; let cur: Element | null = e;
      while (cur) { chain.unshift(cur); cur = cur.parentElement; }
      let color = [255, 255, 255];
      for (const ancestor of chain) {
        const s = getComputedStyle(ancestor);
        if (s.backgroundImage !== "none" || (Number(s.opacity) !== 1 && !(ancestor instanceof HTMLButtonElement && ancestor.disabled))) {
          throw new Error("Unknown compositing; cannot certify contrast");
        }
        color = blend(parse(s.backgroundColor), color);
      }
      return color;
    };
    const lum = (c: number[]) => c.slice(0, 3).map(x => {
      x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
    }).reduce((v, x, i) => v + x * [.2126, .7152, .0722][i]!, 0);
    const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
    const failures: { text: string; ratio: number; required: number }[] = [];
    let checked = 0, minimum = Infinity;
    for (const e of studio.querySelectorAll("*")) {
      if (!Array.from(e.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())) continue;
      if (e.closest("button:disabled") || !e.getClientRects().length || e.tagName === "OPTION") continue;
      const style = getComputedStyle(e), bg = background(e), fg = blend(parse(style.color), bg);
      const large = parseFloat(style.fontSize) >= 24 || parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700;
      const measured = ratio(fg, bg), required = large ? 3 : 4.5;
      checked++; minimum = Math.min(minimum, measured);
      if (measured < required) failures.push({ text: e.textContent!.slice(0, 70), ratio: measured, required });
    }
    const input = studio.querySelector("input")!;
    const placeholder = ratio(parse(getComputedStyle(input, "::placeholder").color), background(input));
    const node = studio.querySelector("button[data-kind]")!;
    const style = getComputedStyle(node);
    const border = ratio(parse(style.borderLeftColor), background(node.parentElement!));
    const focus = Math.min(ratio(parse(style.outlineColor), background(node)),
      ratio(parse(style.outlineColor), background(node.parentElement!)));
    return { checked, minimum, placeholder, border, focus, failures };
  });
  expect(measurement.checked).toBeGreaterThan(30);
  expect(measurement.failures).toEqual([]);
  expect(measurement.placeholder).toBeGreaterThanOrEqual(4.5);
  expect(measurement.border).toBeGreaterThanOrEqual(3);
  expect(measurement.focus).toBeGreaterThanOrEqual(3);
  await test.info().attach("computed-contrast", { body: JSON.stringify(measurement), contentType: "application/json" });
});

test("bounded large graph remains navigable; empty/loading/error states recover", async ({ page }) => {
  await page.goto(path + "?case=large");
  await page.getByLabel("View scope").selectOption("records");
  await expect(page.locator("button[data-kind]")).toHaveCount(120);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Record pages" })).toContainText("2/");
  await page.getByLabel("Search graph", { exact: true }).fill("work:large-0499");
  await expect(page.locator("button[data-kind]")).toHaveCount(1);
  await page.goto(path + "?case=empty");
  await expect(page.getByText("No graph sources are available.")).toBeVisible();
  await page.goto(path + "?case=loading");
  await expect(page.getByRole("status")).toContainText("Reading authorized project sources");
  await page.goto(path + "?case=error");
  await expect(page.getByRole("alert")).toContainText("Project graph unavailable");
  await page.getByRole("button", { name: "Retry project graph" }).click();
  await expect(page.getByRole("heading", { name: "Graph Intelligence Studio" })).toBeVisible();
});
