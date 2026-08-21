import { expect, test, type Locator } from "@playwright/test";

const expectedRatios = [0.22, 0.22, 0.34, 0.22] as const;

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

test("Workspace BETA defaults and resets to 22/22/34/22 panel proportions", async ({ page }) => {
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
  await expect.poll(async () => readPanelRatios(panels)).toEqual(
    expect.arrayContaining(expectedRatios.map((ratio) => expect.closeTo(ratio, 2))),
  );
});
