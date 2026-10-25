import { expect, test, type Locator } from "@playwright/test";

const expectedRatios = [0.25, 0.25, 0.25, 0.25] as const;

async function readPanelRatios(panels: Locator): Promise<number[]> {
  const widths = await panels.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().width),
  );
  const total = widths.reduce((sum, width) => sum + width, 0);
  return widths.map((width) => width / total);
}

function expectDefaultRatios(ratios: number[]) {
  expectedRatios.forEach((expected, index) => {
    expect(ratios[index]).toBeCloseTo(expected, 2);
  });
}

function maximumRatioError(ratios: number[]): number {
  return Math.max(...ratios.map((ratio, index) => Math.abs(ratio - expectedRatios[index])));
}

test("Workspace BETA defaults and resets to equal 25/25/25/25 panel proportions", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const panels = page.locator(".workspace-beta-functional-panel");
  const firstDivider = page.locator(".workspace-beta-resizer").first();

  expectDefaultRatios(await readPanelRatios(panels));

  await firstDivider.focus();
  await page.keyboard.press("ArrowRight");
  const resizedRatios = await readPanelRatios(panels);
  expect(resizedRatios[0]).toBeGreaterThan(expectedRatios[0]);

  await page.keyboard.press("Home");
  await expect.poll(async () => maximumRatioError(await readPanelRatios(panels))).toBeLessThan(0.006);
});
