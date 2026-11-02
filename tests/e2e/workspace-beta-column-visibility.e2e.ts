import { expect, test } from "@playwright/test";

test("Workspace columns collapse to narrow rails and can each be restored", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const panels = page.locator(".workspace-beta-functional-panel");
  await expect(panels).toHaveCount(4);
  const before = await panels.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  const names = ["sources", "knowledge", "practice", "AI Studio"];
  const lightGeometry = new Map<string, { width: number; height: number; x: number; y: number }>();
  const collapsedGeometry = new Map<string, { width: number; height: number; x: number; y: number }>();

  async function verifyToggle(name: string, collapsed: boolean, theme: "light" | "dark", layoutKey: string) {
    const label = `${collapsed ? "Show" : "Hide"} ${name} column`;
    const button = page.getByRole("button", { name: label });
    await expect(button).toBeVisible();
    const actual = await button.evaluate((element) => {
      const buttonStyle = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const icon = element.querySelector<HTMLElement>(".workspace-beta-column-symbol");
      const header = element.closest<HTMLElement>(".workspace-beta-functional-panel-header");
      if (!icon || !header) throw new Error("Column toggle styles could not be read");
      return {
        borderColor: buttonStyle.borderColor,
        borderWidth: buttonStyle.borderWidth,
        backgroundColor: buttonStyle.backgroundColor,
        iconColor: getComputedStyle(icon).color,
        headerColor: getComputedStyle(header).backgroundColor,
        position: buttonStyle.position,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
      };
    });

    expect(actual.borderColor).toBe("rgba(0, 0, 0, 0)");
    expect(actual.borderWidth).toBe("1px");
    expect(actual.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(actual.headerColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(actual.iconColor).toBe(theme === "dark" ? "rgb(250, 250, 250)" : "rgb(34, 34, 34)");
    expect(actual.position).toBe(collapsed ? "sticky" : "absolute");
    expect(actual.width).toBeGreaterThan(0);
    expect(actual.width).toBeLessThanOrEqual(19);
    expect(actual.height).toBeLessThanOrEqual(19);

    const geometry = { width: actual.width, height: actual.height, x: actual.x, y: actual.y };
    const geometryKey = `${layoutKey}:${name}:${collapsed ? "collapsed" : "expanded"}`;
    const reference = (collapsed ? collapsedGeometry : lightGeometry).get(geometryKey);
    if (!reference) {
      (collapsed ? collapsedGeometry : lightGeometry).set(geometryKey, geometry);
    } else {
      expect(Math.abs(geometry.width - reference.width)).toBeLessThan(0.1);
      expect(Math.abs(geometry.height - reference.height)).toBeLessThan(0.1);
      expect(Math.abs(geometry.x - reference.x)).toBeLessThan(0.1);
      expect(Math.abs(geometry.y - reference.y)).toBeLessThan(0.1);
    }
  }

  async function verifyAllToggleStyles(theme: "light" | "dark", collapsedNames: ReadonlySet<string>) {
    const layoutKey = names.filter((name) => collapsedNames.has(name)).join(",") || "none";
    for (const name of names) {
      await verifyToggle(name, collapsedNames.has(name), theme, layoutKey);
    }
  }

  const collapsedNames = new Set<string>();
  await verifyAllToggleStyles("light", collapsedNames);

  for (const name of names) {
    await page.getByRole("button", { name: `Hide ${name} column` }).click();
    await expect(page.getByRole("button", { name: `Show ${name} column` })).toBeVisible();
    collapsedNames.add(name);
    await verifyAllToggleStyles("light", collapsedNames);
  }
  const collapsed = await panels.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  expect(collapsed.every((width) => width <= 38)).toBe(true);

  for (const name of names) {
    await page.getByRole("button", { name: `Show ${name} column` }).click();
    collapsedNames.delete(name);
    await verifyAllToggleStyles("light", collapsedNames);
  }
  const restoredLight = await panels.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  for (let i = 0; i < 4; i++) expect(Math.abs(restoredLight[i] - before[i])).toBeLessThan(3);

  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-workspace-theme", "dark");
  await verifyAllToggleStyles("dark", collapsedNames);
  for (const name of names) {
    await page.getByRole("button", { name: `Hide ${name} column` }).click();
    collapsedNames.add(name);
    await verifyAllToggleStyles("dark", collapsedNames);
  }
  const collapsedDark = await panels.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  expect(collapsedDark.every((width) => width <= 38)).toBe(true);
  for (const name of names) {
    await page.getByRole("button", { name: `Show ${name} column` }).click();
    collapsedNames.delete(name);
    await verifyAllToggleStyles("dark", collapsedNames);
  }

  const keyboardToggle = page.getByRole("button", { name: "Hide AI Studio column" });
  await keyboardToggle.press("Space");
  await expect(page.getByRole("button", { name: "Show AI Studio column" })).toHaveCSS("outline-style", "solid");
  await expect(page.getByRole("button", { name: "Show AI Studio column" })).toHaveCSS("outline-width", "2px");
  await page.getByRole("button", { name: "Show AI Studio column" }).press("Space");

  const restoredDark = await panels.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  for (let i = 0; i < 4; i++) expect(Math.abs(restoredDark[i] - before[i])).toBeLessThan(3);
});
